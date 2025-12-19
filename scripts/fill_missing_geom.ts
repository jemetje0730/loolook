import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import fetch from 'node-fetch';

// ---------- ENV ----------
const DATABASE_URL = process.env.DATABASE_URL;
const VWORLD_KEY   = process.env.VWORLD_KEY ?? '';
const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY ?? '';

if (!DATABASE_URL) {
  console.error('[fill] DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });
const sleep = (ms:number)=>new Promise(res=>setTimeout(res, ms));

// ---------- TYPES ----------
type TotalsRow = { total: string|number; geom_null: string|number };
type CountRow  = { c: string|number };
type TargetRow = { id: string; address: string };

// ---------- GEO UTILS ----------
function isValidKoreaCoord(lat:number, lng:number){
  return Number.isFinite(lat) && Number.isFinite(lng) &&
         lng >= 124 && lng <= 132 && lat >= 33 && lat <= 39;
}

function areaTokens(addr:string){
  const mCity = addr.match(/(서울특별시|서울|부산광역시|부산|인천광역시|인천|대구광역시|대구|대전광역시|대전|광주광역시|광주|울산광역시|울산|세종특별자치시|세종|경기도|강원도|충청북도|충북|충청남도|충남|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주)/);
  const mGu   = addr.match(/([가-힣A-Za-z]+구)/);
  const mDong = addr.match(/([가-힣A-Za-z0-9]+동)/);
  return { city:mCity?.[1]??null, gu:mGu?.[1]??null, dong:mDong?.[1]??null };
}

async function areaCentroid(addr:string){
  const a = areaTokens(addr);
  const pats:string[] = [];
  if (a.city&&a.gu&&a.dong) pats.push(`%${a.city}%${a.gu}%${a.dong}%`);
  if (a.city&&a.gu)         pats.push(`%${a.city}%${a.gu}%`);
  if (a.gu)                 pats.push(`%${a.gu}%`);
  if (a.city)               pats.push(`%${a.city}%`);

  for (const pat of pats){
    const r = await sql<{lat:number;lng:number}[]>/*sql*/`
      SELECT AVG(ST_Y(geom::geometry)) AS lat, AVG(ST_X(geom::geometry)) AS lng
      FROM toilets
      WHERE geom IS NOT NULL AND address ILIKE ${pat}
    `;
    const lat = Number(r[0]?.lat), lng = Number(r[0]?.lng);
    if (isFinite(lat) && isFinite(lng)) return { lat, lng };
  }
  // 서울시청
  return { lat: 37.5665, lng: 126.9780 };
}

// ---------- ADDRESS CLEAN ----------
function fixKnownWeirdGu(a:string){
  // '중구 용산구' 같이 이중 표기 → 마지막 구만 유지(데이터 특성상 용산구가 맞는 케이스 있었음)
  a = a.replace(/중구\s+용산구/g, '용산구');
  a = a.replace(/용산구\s+중구/g, '용산구');
  return a;
}

function cleanAddress(raw:string){
  let a = (raw||'').trim();

  // 기본 오탈자/노이즈
  a = a.replace(/서을특별시/g, '서울특별시');
  a = a.replace(/\?/g, ' ');
  a = a.replace(/\s+/g, ' ');
  a = fixKnownWeirdGu(a);

  // 괄호/콤마 뒤 설명 제거
  a = a.replace(/,.*$/,'');
  a = a.replace(/\(.*?\)/g,'');

  // 지하/내부/출구/주차장 등 제거
  a = a.replace(/\b(지하\d*|지하|지상\d*|지상|B\d+|출구|입구|나들목|교통광장|주차장|공영주차장|내|층|지하\s*\d+층)\b/gi,' ');
  // '중앙대로 지하 163' 같이 '지하'가 번호 앞에 끼인 경우 통째로 제거
  a = a.replace(/\s지하\s*/g, ' ');

  // 동/구 붙임 → 띄우기 (하계1동255 → 하계1동 255)
  a = a.replace(/([가-힣A-Za-z0-9]+동)([0-9산-])/g,'$1 $2');

  // '산48-4' → '산 48-4'
  a = a.replace(/산\s*([0-9]+-?[0-9]*)/g, '산 $1');

  // '로|길|대로' 뒤 번호 붙은 것 띄우되, '나길/라길' 계열은 보존
  // 1) 우선 전반적 띄우기
  a = a.replace(/(로|길|대로|로길)(\d)/g,'$1 $2'); // 동일로112길 → 동일로 112길
  // 2) '동일로 136나길'처럼 '숫자+나길/라길/다길…'은 다시 붙여준다
  a = a.replace(/(로|길|대로)\s?(\d+)\s?([나라다마바사아자차카타파하])길/,
                (_m,p1,n1,syl)=>`${p1}${n1}${syl}길`);

  // 여분 공백 정리
  a = a.replace(/\s{2,}/g,' ').trim();

  // 축약 시 프리픽스 보강
  if (!/한국|대한민국|서울|부산|인천|대구|대전|광주|울산|경기|강원|충청|전라|경상|제주/.test(a)) {
    if (/([가-힣A-Za-z]+구)/.test(a)) a = `서울특별시 ${a}`;
    else a = `대한민국 ${a}`;
  }
  return a;
}

// ---------- DISTANCE CALC ----------
function haversineDistance(lat1:number, lng1:number, lat2:number, lng2:number){
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;
  const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) +
            Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // meters
}

// ---------- GEOCODERS ----------
async function vworld(addr:string){
  if (!VWORLD_KEY) return null;
  for (const type of ['road','parcel'] as const){
    const url = `https://api.vworld.kr/req/address?service=address&request=getCoord&version=2.0&crs=EPSG:4326&formats=json&type=${type}&refine=true&simple=true&address=${encodeURIComponent(addr)}&key=${VWORLD_KEY}`;
    try{
      const r = await fetch(url, { timeout: 9000 as any });
      const j:any = await r.json().catch(()=> ({}));
      const p = j?.response?.result?.point;
      if (p?.x && p?.y){
        const lng = Number(p.x), lat = Number(p.y);
        if (isValidKoreaCoord(lat,lng)) return { lat, lng, src:`vworld-${type}` as const };
      }
    }catch{}
  }
  return null;
}

async function kakaoAddress(addr:string, analyzeType?:'exact'|'similar'){
  if (!KAKAO_REST_KEY) return null;
  const headers = { Authorization: `KakaoAK ${KAKAO_REST_KEY}` };
  const types = analyzeType ? [analyzeType] : ['exact','similar'] as const;
  for (const analyze of types){
    try{
      const resp = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?analyze_type=${analyze}&size=1&query=${encodeURIComponent(addr)}`,
        { headers, timeout: 9000 as any }
      );
      // 401/429 등 에러 메시지 노출
      if (!resp.ok) {
        const txt = await resp.text().catch(()=> '');
        throw new Error(`[kakao-address-${analyze}] ${resp.status} ${txt}`.trim());
      }
      const data:any = await resp.json().catch(()=> ({}));
      const d = data?.documents?.[0];
      const x = Number(d?.x ?? d?.address?.x ?? d?.road_address?.x);
      const y = Number(d?.y ?? d?.address?.y ?? d?.road_address?.y);
      if (isValidKoreaCoord(y,x)) return { lat:y, lng:x, src:`kakao-address-${analyze}` as const };
    }catch(_e){}
  }
  return null;
}

async function kakaoKeyword(q:string, bias?:{lat:number;lng:number}){
  if (!KAKAO_REST_KEY) return null;
  const headers = { Authorization: `KakaoAK ${KAKAO_REST_KEY}` };
  const base = `https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=${encodeURIComponent(q)}`;
  const url  = bias ? `${base}&x=${bias.lng}&y=${bias.lat}&radius=5000` : base;
  try{
    const resp = await fetch(url, { headers, timeout: 9000 as any });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=> '');
      throw new Error(`[kakao-keyword] ${resp.status} ${txt}`.trim());
    }
    const data:any = await resp.json().catch(()=> ({}));
    const d = data?.documents?.[0];
    const x = Number(d?.x), y = Number(d?.y);
    if (isValidKoreaCoord(y,x)) return { lat:y, lng:x, src: bias?('kakao-keyword-biased' as const):('kakao-keyword' as const) };
  }catch(_e){}
  return null;
}

// ---------- STRATEGY ----------
async function geocodeSmart(raw:string){
  // 1차: 원문 정리
  const cleaned = cleanAddress(raw);

  // 1) Kakao 우선 (exact match)
  const ka_exact = await kakaoAddress(cleaned, 'exact');
  const v = await vworld(cleaned);

  // Kakao exact와 VWorld 둘 다 있으면 비교
  if (ka_exact && v) {
    const dist = haversineDistance(ka_exact.lat, ka_exact.lng, v.lat, v.lng);
    if (dist > 100) {
      // 100m 이상 차이나면 경고 로그
      console.warn(`  ⚠️  좌표 차이 ${Math.round(dist)}m: ${raw.slice(0,40)}`);
      console.warn(`      Kakao: ${ka_exact.lat},${ka_exact.lng} | VWorld: ${v.lat},${v.lng}`);
    }
    // Kakao exact 우선 채택
    return ka_exact;
  }
  if (ka_exact) return ka_exact;
  if (v) return v;

  // 2) Kakao similar
  const ka_similar = await kakaoAddress(cleaned, 'similar');
  if (ka_similar) return ka_similar;

  // 3) 특수 케이스: 역/공원/시장/보도육교 등 POI
  const isPOI = /(역|공원|시장|광장|체육|자연공원|보도육교)/.test(cleaned);
  const centroid = await areaCentroid(cleaned);
  if (isPOI) {
    const q1 = `${cleaned} 공중화장실`;
    const q2 = `${cleaned} 화장실`;
    const k1 = await kakaoKeyword(q1, centroid) || await kakaoKeyword(q1);
    if (k1) return k1;
    const k2 = await kakaoKeyword(q2, centroid) || await kakaoKeyword(q2);
    if (k2) return k2;
  }

  // 4) 변형 시도: '로 75길' → '로75길', '동 256-4' → '동256-4' 등 역방향 변형도 한 번
  const variants = new Set<string>();
  variants.add(
    cleaned
      .replace(/(로|대로)\s+(\d+)([나라다마바사아자차카타파하])길/g, (_m,p1,n1,syl)=>`${p1}${n1}${syl}길`)
      .replace(/([가-힣0-9]+동)\s+([0-9산-]+)/g, '$1$2')
  );
  variants.add(
    cleaned
      .replace(/([가-힣0-9]+동)\s*([0-9]+-?[0-9]*)/g, '$1 $2')
  );

  for (const vaddr of variants){
    const k_var = await kakaoAddress(vaddr, 'exact');
    if (k_var) return k_var;
    const v2 = await vworld(vaddr);
    if (v2) return v2;
    const k3 = await kakaoKeyword(vaddr, centroid) || await kakaoKeyword(vaddr);
    if (k3) return k3;
  }

  return null;
}

// ---------- MAIN ----------
async function main(){
  console.log('[fill] ✅ DB 연결됨:', DATABASE_URL!.replace(/\/\/([^:]+):?[^@]*@/, '//$1:****@'));

  // CLI 옵션 파싱
  const args = process.argv.slice(2);
  const revalidateMode = args.includes('--revalidate');

  const totals = await sql<TotalsRow[]>/*sql*/`
    SELECT
      (SELECT COUNT(*) FROM toilets) AS total,
      (SELECT COUNT(*) FROM toilets WHERE geom IS NULL) AS geom_null
  `;
  const total = Number(totals[0].total);
  const geomNull = Number(totals[0].geom_null);
  console.log(`[fill] 현재 상태: 총 ${total}건 중 좌표 없음 ${geomNull}건`);

  if (revalidateMode) {
    console.log('[fill] 🔄 재검증 모드: 모든 좌표 재지오코딩');
  }

  // 쿼리 조건 직접 분기
  let targets;
  if (revalidateMode) {
    targets = await sql<TargetRow[]>/*sql*/`
      SELECT id, address
      FROM toilets
      WHERE address IS NOT NULL
        AND length(address) > 3
      ORDER BY id
    `;
  } else {
    targets = await sql<TargetRow[]>/*sql*/`
      SELECT id, address
      FROM toilets
      WHERE geom IS NULL
        AND address IS NOT NULL
        AND length(address) > 3
      ORDER BY id
    `;
  }
  const target = targets.length;
  console.log(`[fill] 지오코딩 대상: ${target}건`);
  if (!target){ await sql.end(); return; }

  let processed=0, success=0, failed=0;
  const failSamples: Array<{id:string; address:string}> = [];
  const BATCH = Math.min(200, target);

  for (let i=0; i<targets.length; i+=BATCH){
    const chunk = targets.slice(i, i+BATCH);
    console.log(`[fill] 배치 시작 (건수: ${chunk.length})`);

    for (const r of chunk){
      const addr = (r.address||'').trim();
      try{
        const g = await geocodeSmart(addr);
        if (g && isValidKoreaCoord(g.lat, g.lng)){
          await sql/*sql*/`
            UPDATE toilets
            SET geom = ST_SetSRID(ST_MakePoint(${g.lng}, ${g.lat}), 4326)::geography
            WHERE id = ${r.id}
          `;
          success++;
        }else{
          failed++;
          if (failSamples.length<30) failSamples.push({id:r.id, address:addr});
        }
      }catch{
        failed++;
        if (failSamples.length<30) failSamples.push({id:r.id, address:addr});
      }

      processed++;
      if (processed % 25 === 0 || processed === target){
        const pct = Math.min(100, Number(((processed/target)*100).toFixed(1)));
        console.log(`[fill] 진행 ${processed}/${target} (${pct}%)  성공:${success} 실패:${failed}`);
      }
      await sleep(150); // 카카오 401/429 예방
    }
  }

  const remain = await sql<CountRow[]>/*sql*/`SELECT COUNT(*) AS c FROM toilets WHERE geom IS NULL`;
  console.log(`[fill] ✅ 완료. 총 시도 ${processed}건, 성공 ${success}건, 실패 ${failed}건`);
  console.log(`[fill] 현재 DB 남은 geom NULL: ${Number(remain[0].c)}`);
  if (failSamples.length){
    console.log('[fill] 예시 실패 주소(최대 30건):');
    for (const f of failSamples) console.log(` - #${String(f.id)}: ${f.address}`);
  }

  await sql.end();
}

main().catch(async (e)=>{
  // 카카오/브이월드 에러 메시지 보이게
  console.error('[fill] 오류:', e?.message ?? e);
  try{ await sql.end(); }catch{}
  process.exit(1);
});
