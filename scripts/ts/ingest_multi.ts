import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { parse } from 'csv-parse/sync';

// USE_PRODUCTION=true 로 실행하면 PRODUCTION_DB 사용, 아니면 DATABASE_URL 사용
const DATABASE_URL = process.env.USE_PRODUCTION === 'true'
  ? process.env.PRODUCTION_DB!
  : process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  console.error('[ingest-multi] ❌ DATABASE_URL 또는 PRODUCTION_DB 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

/* ----------------------------
   CSV 기본 스키마 타입 정의
-----------------------------*/
type ToiletCsvRow = {
  화장실명?: string;
  건물명?: string; // seoul_toilets.csv
  소재지도로명주소?: string;
  도로명주소?: string; // seoul_toilets.csv
  소재지지번주소?: string;
  지번주소?: string; // seoul_toilets.csv
  WGS84위도?: string;
  'y 좌표'?: string; // seoul_toilets.csv
  위도?: string; // gyeongi_toilets.csv
  WGS84경도?: string;
  'x 좌표'?: string; // seoul_toilets.csv
  경도?: string; // gyeongi_toilets.csv
  구분?: string;
  유형?: string; // seoul_toilets.csv
  전화번호?: string;
  개방시간?: string;
  개방시간상세?: string;

  '남성용-대변기수'?: string;
  '남성용-소변기수'?: string;
  '여성용-대변기수'?: string;
  '남성용-장애인용대변기수'?: string;
  '남성용-장애인용소변기수'?: string;
  '여성용-장애인용대변기수'?: string;
  '남성용-어린이용대변기수'?: string;
  '남성용-어린이용소변기수'?: string;
  '여성용-어린이용대변기수'?: string;

  비상벨설치여부?: string;
  화장실입구CCTV설치유무?: string;
  화장실입구CCTV설치여부?: string; // gyeongi_toilets.csv
  기저귀교환대유무?: string;

  // seoul_toilets.csv 전용 (파이프 구분 형식)
  '화장실 현황'?: string;           // "남자|여자|"
  '장애인화장실 현황'?: string;      // "남자|여자|"
  '편의시설 (기타설비)'?: string;    // "기저귀교환대(남)|기저귀교환대(여)|"
  '안내표지'?: string;              // "비상벨(여)|비상벨(장애인_남)|출입구CCTV|"

  // daegu_toilets.csv 전용
  TOILET_NM?: string;   // 화장실명
  MGC_NM?: string;      // 관리기관명
  ADRES_DC?: string;    // 주소
  TELNO_CN?: string;    // 전화번호
  USGTM_DC?: string;    // 사용시간
  LA?: string;          // 위도
  LO?: string;          // 경도

  [k: string]: string | undefined;
};

function toBool(v: unknown) {
  const s = String(v ?? '').trim();
  return ['Y', 'y', 'YES', '있음', '예', 'true', '1', 'O', 'o'].includes(s);
}
function toOorX(n: number) {
  return n > 0 ? 'O' : 'X';
}
function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function isValidKoreaCoord(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lng >= 124 && lng <= 132 &&
    lat >= 33 && lat <= 39;
}
function cleanAddress(raw: string) {
  let a = (raw || '').trim();
  a = a.replace(/서을특별시/g, '서울특별시');
  a = a.replace(/\?/g, ' ');
  a = a.replace(/\s+/g, ' ');
  a = a.replace(/,.*$/, '');
  a = a.replace(/\(.*?\)/g, '');
  a = a.replace(/([가-힣A-Za-z0-9]+동)([0-9산-])/g, '$1 $2');
  a = a.replace(/(로|길|대로|로길)(\d)/g, '$1 $2');
  a = a.replace(/\s{2,}/g, ' ').trim();

  return a;
}

/* ----------------------------
   DB 스키마 보장
-----------------------------*/
async function ensureSchema() {
  await sql/*sql*/`
  CREATE TABLE IF NOT EXISTS toilets (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    source TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    geom GEOGRAPHY(POINT, 4326),
    fp TEXT UNIQUE,
    category TEXT,
    phone TEXT,
    open_time TEXT,
    male_toilet CHAR(1),
    female_toilet CHAR(1),
    male_disabled CHAR(1),
    female_disabled CHAR(1),
    male_child CHAR(1),
    female_child CHAR(1),
    emergency_bell BOOLEAN,
    cctv BOOLEAN,
    baby_change BOOLEAN
  );`;

  await sql/*sql*/`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname='toilets_geom_korea_range'
    ) THEN
      ALTER TABLE toilets ADD CONSTRAINT toilets_geom_korea_range
      CHECK (
        geom IS NULL OR (
          ST_X(geom::geometry) BETWEEN 124 AND 132 AND
          ST_Y(geom::geometry) BETWEEN 33 AND 39
        )
      );
    END IF;
  END$$;`;

  await sql/*sql*/`
    CREATE INDEX IF NOT EXISTS idx_toilets_geom ON toilets USING GIST (geom);
  `;
}

/* ----------------------------
   CSV 1개 ingest 함수 (배치 INSERT 방식)
-----------------------------*/
async function ingestCsv(file: { path: string; source: string }) {
  const full = path.join(process.cwd(), file.path);
  if (!fs.existsSync(full)) {
    console.log(`❌ CSV 없음 → ${file.path}`);
    return { total: 0, success: 0, invalidGeom: 0 };
  }

  const raw = fs.readFileSync(full, 'utf8');
  const rows = parse<ToiletCsvRow>(raw, { columns: true, skip_empty_lines: true });

  let success = 0;
  let invalidGeom = 0;

  // 배치 크기 설정
  const BATCH_SIZE = 200;
  const batches: any[][] = [];
  let currentBatch: any[] = [];
  const seenInBatch = new Set<string>(); // 배치 내 중복 체크

  for (const r of rows) {
    // 이름 파싱 (건물명 우선, 없으면 화장실명, daegu는 TOILET_NM 또는 MGC_NM)
    const name = (r['건물명'] ?? r['화장실명'] ?? r['TOILET_NM'] ?? r['MGC_NM'] ?? '').trim() || '공중화장실';

    // 주소 파싱
    const road = (r['도로명주소'] ?? r['소재지도로명주소'] ?? r['소재지주소'] ?? r['ADRES_DC'] ?? '').trim();
    const jibun = (r['지번주소'] ?? r['소재지지번주소'] ?? '').trim();
    const rawAddress = road || jibun;

    if (!name || !rawAddress) {
      console.warn('[ingest-multi] name/address 스킵:', {
        name,
        rawAddress,
        row: r,
      });
      continue;
    }

    const address = cleanAddress(rawAddress);

    // 좌표 파싱 (각 CSV 형식 지원)
    const lat = Number((r['y 좌표'] ?? r['위도'] ?? r['WGS84위도'] ?? r['LA'] ?? '').trim());
    const lng = Number((r['x 좌표'] ?? r['경도'] ?? r['WGS84경도'] ?? r['LO'] ?? '').trim());
    const hasValid = isValidKoreaCoord(lat, lng);

    // 파이프(|) 제거 헬퍼 함수
    const removePipes = (str: string) => str.replace(/\|/g, '').trim();

    const category = removePipes(r['유형'] ?? r['구분'] ?? '') || null;
    const phone = removePipes(r['전화번호'] ?? r['TELNO_CN'] ?? '') || null;
    const open_time = removePipes(r['개방시간상세'] ?? r['개방시간'] ?? r['USGTM_DC'] ?? '') || null;

    // seoul_toilets.csv 형식인지 확인 (파이프 구분)
    const isSeoulFormat = r['화장실 현황'] !== undefined;

    let male_toilet: 'O' | 'X';
    let female_toilet: 'O' | 'X';
    let male_disabled: 'O' | 'X';
    let female_disabled: 'O' | 'X';
    let emergency_bell: boolean;
    let cctv: boolean;
    let baby_change: boolean;

    if (isSeoulFormat) {
      // seoul_toilets.csv 형식: 파이프(|) 구분
      const toiletStatus = r['화장실 현황'] ?? '';
      const disabledStatus = r['장애인화장실 현황'] ?? '';
      const facilities = r['편의시설 (기타설비)'] ?? '';
      const signs = r['안내표지'] ?? '';

      male_toilet = toiletStatus.includes('남자') ? 'O' : 'X';
      female_toilet = toiletStatus.includes('여자') ? 'O' : 'X';
      male_disabled = disabledStatus.includes('남자') ? 'O' : 'X';
      female_disabled = disabledStatus.includes('여자') ? 'O' : 'X';

      emergency_bell = signs.includes('비상벨');
      cctv = signs.includes('CCTV') || signs.includes('출입구CCTV');
      baby_change = facilities.includes('기저귀교환대');
    } else {
      // public_toilets.csv 형식: 숫자
      male_toilet = toOorX(num(r['남성용-대변기수']) + num(r['남성용-소변기수']));
      female_toilet = toOorX(num(r['여성용-대변기수']));
      male_disabled = toOorX(num(r['남성용-장애인용대변기수']) + num(r['남성용-장애인용소변기수']));
      female_disabled = toOorX(num(r['여성용-장애인용대변기수']));

      emergency_bell = toBool(r['비상벨설치여부']);
      cctv = toBool(r['화장실입구CCTV설치유무'] ?? r['화장실입구CCTV설치여부']);
      baby_change = toBool(r['기저귀교환대유무']);
    }

    // 이름+주소 fingerprint로 중복 방지
    const fpRaw = (name + '|' + address).toLowerCase();

    // 배치 내 중복 체크 (같은 배치에 동일한 fp가 있으면 스킵)
    if (seenInBatch.has(fpRaw)) {
      continue;
    }

    if (!hasValid) invalidGeom++;

    // 배치에 데이터 추가
    currentBatch.push({
      name,
      address,
      source: file.source,
      is_public: true,
      geom: hasValid ? sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography` : null,
      fp: sql`md5(${fpRaw})`,
      category,
      phone,
      open_time,
      male_toilet,
      female_toilet,
      male_disabled,
      female_disabled,
      emergency_bell,
      cctv,
      baby_change,
      hasValid,
      lat,
      lng,
      fpRaw,
    });
    seenInBatch.add(fpRaw);

    // 배치가 가득 차면 batches에 추가하고 새 배치 시작
    if (currentBatch.length >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
      seenInBatch.clear(); // 새 배치를 위해 Set 초기화
    }
  }

  // 남은 데이터 추가
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // 배치별로 INSERT 실행 (진짜 배치 INSERT 방식)
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`   배치 ${i + 1}/${batches.length} (${batch.length}개 행) 처리 중...`);

    // VALUES 절 동적 생성
    const valuesClauses = batch.map((_, idx) => {
      const offset = idx * 18;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4},
              CASE WHEN $${offset + 5} THEN ST_SetSRID(ST_MakePoint($${offset + 6}, $${offset + 7}), 4326)::geography ELSE NULL END,
              md5($${offset + 8}), $${offset + 9}, $${offset + 10}, $${offset + 11},
              $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18})`;
    }).join(',\n');

    const params: any[] = [];
    for (const b of batch) {
      const fpRaw = (b.name + '|' + b.address).toLowerCase();
      params.push(
        b.name,
        b.address,
        b.source,
        b.is_public,
        b.hasValid,
        b.lng,
        b.lat,
        fpRaw,
        b.category,
        b.phone,
        b.open_time,
        b.male_toilet,
        b.female_toilet,
        b.male_disabled,
        b.female_disabled,
        b.emergency_bell,
        b.cctv,
        b.baby_change
      );
    }

    // sql.unsafe를 사용하여 동적 SQL 실행
    await sql.unsafe(`
      INSERT INTO toilets (
        name, address, source, is_public, geom, fp,
        category, phone, open_time,
        male_toilet, female_toilet,
        male_disabled, female_disabled,
        emergency_bell, cctv, baby_change
      )
      VALUES ${valuesClauses}
      ON CONFLICT (fp) DO UPDATE SET
        name           = EXCLUDED.name,
        address        = EXCLUDED.address,
        source         = EXCLUDED.source,
        category       = EXCLUDED.category,
        phone          = EXCLUDED.phone,
        open_time      = EXCLUDED.open_time,
        male_toilet    = EXCLUDED.male_toilet,
        female_toilet  = EXCLUDED.female_toilet,
        male_disabled  = EXCLUDED.male_disabled,
        female_disabled= EXCLUDED.female_disabled,
        emergency_bell = EXCLUDED.emergency_bell,
        cctv           = EXCLUDED.cctv,
        baby_change    = EXCLUDED.baby_change,
        geom = COALESCE(toilets.geom, EXCLUDED.geom)
    `, params);

    success += batch.length;
  }

  return { total: rows.length, success, invalidGeom };
}

/* ----------------------------
   여러 CSV ingest 설정
-----------------------------*/
const FILES: Array<{ path: string; source: string }> = [
  {
    path: 'data/toilets/new_gangnam_toilets.csv',
    source: 'gangnam_research_2025',
  }
];

async function main() {
  console.log('🚀 [ingest-multi] 시작');
  console.log('[ingest-multi] DB:', DATABASE_URL.replace(/\/\/([^:]+):?[^@]*@/, '//$1:****@'));

  await ensureSchema();

  for (const f of FILES) {
    console.log(`\n➡ ${f.path} (source=${f.source}) ingest 중...`);
    const res = await ingestCsv(f);
    console.log(`   - 총 ${res.total}행 → 성공 ${res.success}, 좌표 NULL ${res.invalidGeom}`);
  }

  const stat = await sql/*sql*/`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN geom IS NULL THEN 1 ELSE 0 END) AS null_geom,
      COUNT(DISTINCT source) AS sources
    FROM toilets;
  `;

  console.log('\n📊 전체 ingest 후 상태:');
  console.log(`   - 총 행:        ${stat[0].total}`);
  console.log(`   - geom NULL:    ${stat[0].null_geom}`);
  console.log(`   - source 개수:  ${stat[0].sources}`);

  await sql.end();
  console.log('🎉 [ingest-multi] 완료');
}

main().catch(e => {
  console.error('[ingest-multi] 오류:', e);
  sql.end();
  process.exit(1);
});
