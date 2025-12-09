// scripts/ingest_multi.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { parse } from 'csv-parse/sync';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('[ingest-multi] ❌ DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

/* ----------------------------
   CSV 기본 스키마 타입 정의
-----------------------------*/
type ToiletCsvRow = {
  화장실명?: string;
  소재지도로명주소?: string;
  소재지지번주소?: string;
  WGS84위도?: string;
  WGS84경도?: string;
  구분?: string;
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
  기저귀교환대유무?: string;

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

  if (!/서울|부산|인천|대구|대전|광주|울산|경기|강원|충청|전라|경상|제주|대한민국|한국/.test(a)) {
    if (/([가-힣A-Za-z]+구)/.test(a)) a = `서울특별시 ${a}`;
    else a = `대한민국 ${a}`;
  }
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
   CSV 1개 ingest 함수
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

  for (const r of rows) {
    const name = (r['화장실명'] ?? '').trim() || '공중화장실';
    const road = (r['소재지도로명주소'] ?? '').trim();
    const jibun = (r['소재지지번주소'] ?? '').trim();
    const rawAddress = road || jibun;

    if (!name || !rawAddress) continue;

    const address = cleanAddress(rawAddress);


    const lat = Number((r['WGS84위도'] ?? '').trim());
    const lng = Number((r['WGS84경도'] ?? '').trim());
    const hasValid = isValidKoreaCoord(lat, lng);

    const category = (r['구분'] ?? '').trim() || null;
    const phone = (r['전화번호'] ?? '').trim() || null;
    const open_time = (r['개방시간상세'] ?? r['개방시간'] ?? '').trim() || null;

    const male_toilet = toOorX(num(r['남성용-대변기수']) + num(r['남성용-소변기수']));
    const female_toilet = toOorX(num(r['여성용-대변기수']));
    const male_disabled = toOorX(num(r['남성용-장애인용대변기수']) + num(r['남성용-장애인용소변기수']));
    const female_disabled = toOorX(num(r['여성용-장애인용대변기수']));
    const male_child = toOorX(num(r['남성용-어린이용대변기수']) + num(r['남성용-어린이용소변기수']));
    const female_child = toOorX(num(r['여성용-어린이용대변기수']));

    const emergency_bell = toBool(r['비상벨설치여부']);
    const cctv = toBool(r['화장실입구CCTV설치유무']);
    const baby_change = toBool(r['기저귀교환대유무']);

    // 이름+주소 fingerprint로 중복 방지
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
        ${file.source},
        TRUE,
        CASE WHEN ${hasValid}
          THEN ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ELSE NULL
        END,
        md5(${fpRaw}),
        ${category}, ${phone}, ${open_time},
        ${male_toilet}, ${female_toilet},
        ${male_disabled}, ${female_disabled},
        ${male_child}, ${female_child},
        ${emergency_bell}, ${cctv}, ${baby_change}
      )
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
        male_child     = EXCLUDED.male_child,
        female_child   = EXCLUDED.female_child,
        emergency_bell = EXCLUDED.emergency_bell,
        cctv           = EXCLUDED.cctv,
        baby_change    = EXCLUDED.baby_change,
        geom = COALESCE(
          toilets.geom,
          CASE WHEN ${hasValid}
            THEN ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            ELSE NULL
          END
        )
    `;

    if (!hasValid) invalidGeom++;
    success++;
  }

  return { total: rows.length, success, invalidGeom };
}

/* ----------------------------
   여러 CSV ingest 설정
-----------------------------*/
const FILES: Array<{ path: string; source: string }> = [
  {
    path: 'data/public_toilets.csv',
    source: 'seoul_open_data_main',
  },
  // {
  //   path: 'data/public_toilets_extra.csv',
  //   source: 'seoul_open_data_extra',
  // },
  // {
  //   path: 'data/park_toilets.csv',
  //   source: 'manual_park_import',
  // },
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
