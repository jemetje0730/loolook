import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import fetch from 'node-fetch';

const DATABASE_URL = process.env.DATABASE_URL!;
const KAKAO_KEY = process.env.KAKAO_REST_KEY!;

if (!DATABASE_URL) {
  console.error('[add-one] ❌ DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}
if (!KAKAO_KEY) {
  console.error('[add-one] ❌ KAKAO_REST_KEY 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

function isValidKoreaCoord(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lng >= 124 &&
    lng <= 132 &&
    lat >= 33 &&
    lat <= 39
  );
}

// 필요하면 ingest_multi.ts의 cleanAddress를 그대로 복붙해도 됨
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

  if (!/서울|부산|인천|대구|대전|광주|울산|경기|강원|충청|전라|경상|제주|대한민국|한국/.test(a)) {
    if (/([가-힣A-Za-z]+구)/.test(a)) a = `서울특별시 ${a}`;
    else a = `대한민국 ${a}`;
  }
  return a;
}

async function geocode(addr: string) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
    addr,
  )}`;
  const resp = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
  });
  const j: any = await resp.json().catch(() => ({}));
  const d = j?.documents?.[0];
  if (!d) return null;

  const lat = Number(d.y);
  const lng = Number(d.x);
  if (!isValidKoreaCoord(lat, lng)) return null;

  return { lat, lng };
}

async function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const rawAddress = args[1];

  if (!name || !rawAddress) {
    console.log(`사용법:
  npx tsx scripts/add_one.ts "화장실명" "주소"`);
    process.exit(0);
  }

  const address = cleanAddress(rawAddress);

  console.log(`[add-one] 지오코딩중: ${address}`);
  const g = await geocode(address);

  if (!g) {
    console.log('⚠ 좌표를 찾지 못했습니다. geom=NULL로 저장합니다.');
  }

  const { lat, lng } = g ?? { lat: null, lng: null };

  // ingest_multi.ts와 동일한 fp 규칙
  const fpRaw = (name + '|' + address).toLowerCase();

  await sql/*sql*/`
    INSERT INTO toilets (
      name, address, source, is_public, geom, fp,
      category, phone, open_time,
      male_toilet, female_toilet,
      male_disabled, female_disabled,
      male_child, female_child,
      emergency_bell, cctv, baby_change
    )
    VALUES (
      ${name},
      ${address},
      'manual_add_one',
      TRUE,
      ${
        g
          ? sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`
          : null
      },
      md5(${fpRaw}),
      NULL,  -- category
      NULL,  -- phone
      NULL,  -- open_time
      NULL,  -- 남자화장실 정보 없음
      NULL,  -- 여자화장실
      NULL,  -- 남 장애인
      NULL,  -- 여 장애인
      NULL,  -- 남 어린이
      NULL,  -- 여 어린이
      NULL,  -- 비상벨
      NULL,  -- CCTV
      NULL   -- 기저귀교환대
    )
    ON CONFLICT (fp) DO UPDATE SET
      name           = EXCLUDED.name,
      address        = EXCLUDED.address,
      source         = EXCLUDED.source,
      geom           = COALESCE(
        toilets.geom,
        EXCLUDED.geom
      );
  `;

  console.log('[add-one] 추가/업데이트 완료');
  if (!g) console.log('⚠ geom이 NULL 입니다. 나중에 보완 가능.');

  await sql.end();
}

main().catch((e) => {
  console.error('[add-one] 오류:', e);
  sql.end();
  process.exit(1);
});
