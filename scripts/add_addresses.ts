import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';

const DATABASE_URL = process.env.DATABASE_URL!;
const KAKAO_KEY = process.env.KAKAO_REST_KEY!;

if (!DATABASE_URL) {
  console.error('[add-addresses] ❌ DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}
if (!KAKAO_KEY) {
  console.error('[add-addresses] ❌ KAKAO_REST_KEY 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

type AddRow = {
  name: string;
  address: string;
  category?: string;
  phone?: string;
  open_time?: string;
  male_toilet?: string;
  female_toilet?: string;
  male_disabled?: string;
  female_disabled?: string;
  male_child?: string;
  female_child?: string;
  emergency_bell?: string;
  cctv?: string;
  baby_change?: string;
};

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

  if (
    !/서울|부산|인천|대구|대전|광주|울산|경기|강원|충청|전라|경상|제주|대한민국|한국/.test(a)
  ) {
    if (/([가-힣A-Za-z]+구)/.test(a)) a = `서울특별시 ${a}`;
    else a = `대한민국 ${a}`;
  }
  return a;
}

function toBool(v?: string) {
  const s = (v ?? '').trim().toLowerCase();
  if (!s) return null;
  return ['y', 'yes', '있음', '예', 'true', '1', 'o'].includes(s);
}

function normalizeOX(v?: string) {
  const s = (v ?? '').trim().toUpperCase();
  if (!s) return null;
  if (s === 'O' || s === 'X') return s;
  if (s === 'Y' || s === 'YES' || s === '1') return 'O';
  if (s === 'N' || s === 'NO' || s === '0') return 'X';
  const n = Number(s);
  if (Number.isFinite(n)) return n > 0 ? 'O' : 'X';
  return null;
}

async function geocode(addr: string) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
    addr,
  )}`;
  const resp = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_KEY}` },
  });
  if (!resp.ok) {
    console.error('[add-addresses] Kakao HTTP 에러:', resp.status);
    return null;
  }
  const j: any = await resp.json().catch(() => ({}));
  const d = j?.documents?.[0];
  if (!d) return null;

  const lat = Number(d.y);
  const lng = Number(d.x);
  if (!isValidKoreaCoord(lat, lng)) return null;

  return { lat, lng };
}

async function main() {
  console.log('🚀 [add-addresses] 시작');
  console.log(
    '[add-addresses] DB:',
    DATABASE_URL.replace(/\/\/([^:]+):?[^@]*@/, '//$1:****@'),
  );

  const csvPath = path.join(process.cwd(), 'data/add_targets.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('[add-addresses] ❌ data/add_targets.csv 파일이 없습니다.');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse<AddRow>(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[add-addresses] CSV 로딩 완료: ${rows.length}개`);

  for (const row of rows) {
    const name = row.name?.trim();
    const rawAddress = row.address?.trim();

    if (!name || !rawAddress) {
      console.log('[add-addresses] ⚠ name 또는 address 누락 → 스킵:', row);
      continue;
    }

    const address = cleanAddress(rawAddress);

    const category = row.category?.trim() || null;
    const phone = row.phone?.trim() || null;
    const open_time = row.open_time?.trim() || null;

    const male_toilet = normalizeOX(row.male_toilet);
    const female_toilet = normalizeOX(row.female_toilet);
    const male_disabled = normalizeOX(row.male_disabled);
    const female_disabled = normalizeOX(row.female_disabled);
    const male_child = normalizeOX(row.male_child);
    const female_child = normalizeOX(row.female_child);

    const emergency_bell = toBool(row.emergency_bell);
    const cctv = toBool(row.cctv);
    const baby_change = toBool(row.baby_change);

    console.log('\n========================================');
    console.log(`[add-addresses] INSERT/UPSERT 시도: "${name}" | "${address}"`);

    console.log('[add-addresses] 지오코딩중 (Kakao)...');
    const g = await geocode(address);
    if (!g) {
      console.log(
        '[add-addresses] ⚠ Kakao 지오코딩 실패 → geom=NULL로 저장',
      );
    } else {
      console.log(
        `[add-addresses] → lat,lng = ${g.lat}, ${g.lng}`,
      );
    }

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
        'manual_add_addresses',
        TRUE,
        ${
          g
            ? sql`ST_SetSRID(ST_MakePoint(${g.lng}, ${g.lat}), 4326)::geography`
            : null
        },
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
        category       = COALESCE(EXCLUDED.category, toilets.category),
        phone          = COALESCE(EXCLUDED.phone, toilets.phone),
        open_time      = COALESCE(EXCLUDED.open_time, toilets.open_time),
        male_toilet    = COALESCE(EXCLUDED.male_toilet, toilets.male_toilet),
        female_toilet  = COALESCE(EXCLUDED.female_toilet, toilets.female_toilet),
        male_disabled  = COALESCE(EXCLUDED.male_disabled, toilets.male_disabled),
        female_disabled= COALESCE(EXCLUDED.female_disabled, toilets.female_disabled),
        male_child     = COALESCE(EXCLUDED.male_child, toilets.male_child),
        female_child   = COALESCE(EXCLUDED.female_child, toilets.female_child),
        emergency_bell = COALESCE(EXCLUDED.emergency_bell, toilets.emergency_bell),
        cctv           = COALESCE(EXCLUDED.cctv, toilets.cctv),
        baby_change    = COALESCE(EXCLUDED.baby_change, toilets.baby_change),
        geom           = COALESCE(toilets.geom, EXCLUDED.geom)
    `;

    console.log('[add-addresses] ✅ 추가/업데이트 완료');
  }

  await sql.end();
  console.log('\n🎉 [add-addresses] 전체 완료');
}

main().catch((e) => {
  console.error('[add-addresses] 오류:', e);
  sql.end();
  process.exit(1);
});
