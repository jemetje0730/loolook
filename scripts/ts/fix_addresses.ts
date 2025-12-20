import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import fetch from 'node-fetch';
import { parse } from 'csv-parse/sync';

const DATABASE_URL = process.env.DATABASE_URL!;
const VWORLD_KEY = process.env.VWORLD_KEY!;

if (!DATABASE_URL) {
  console.error('[fix-addresses] ❌ DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}
if (!VWORLD_KEY) {
  console.error('[fix-addresses] ❌ VWORLD_KEY 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

type FixRow = {
  name: string;
  address: string; // 부분 매칭용
};

const KR = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 };
const inRange = (v: number, min: number, max: number) =>
  Number.isFinite(v) && v >= min && v <= max;
const isValidKoreaCoord = (lat: number, lng: number) =>
  inRange(lat, KR.minLat, KR.maxLat) && inRange(lng, KR.minLng, KR.maxLng);

async function geocodeVWorld(address: string, type: 'road' | 'parcel') {
  const url = `https://api.vworld.kr/req/address?service=address&request=getCoord&version=2.0&crs=EPSG:4326&address=${encodeURIComponent(
    address,
  )}&refine=true&simple=false&format=json&type=${type}&key=${VWORLD_KEY}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error('[fix-addresses] VWorld HTTP 에러:', resp.status);
      return null;
    }
    const j: any = await resp.json().catch(() => null);
    const point = j?.response?.result?.point;
    if (!point) {
      console.error(
        `[fix-addresses] VWorld 결과 없음 (type=${type})`,
      );
      return null;
    }

    const lng = Number(point.x);
    const lat = Number(point.y);

    if (!isValidKoreaCoord(lat, lng)) {
      console.error('[fix-addresses] VWorld 좌표가 한국 범위 밖:', { lat, lng });
      return null;
    }

    return { lat, lng };
  } catch (e) {
    console.error('[fix-addresses] VWorld 호출 에러:', e);
    return null;
  }
}

async function main() {
  const csvPath = path.join(process.cwd(), 'data/targets/fix_targets.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('[fix-addresses] ❌ data/targets/fix_targets.csv 파일이 없습니다.');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse<FixRow>(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[fix-addresses] CSV 로딩 완료: ${rows.length}개`);
  console.log('🚀 [fix-addresses] 시작');

  for (const row of rows) {
    const { name, address } = row;
    if (!name || !address) {
      console.log('[fix-addresses] ⚠ name 또는 address 누락 → 스킵:', row);
      continue;
    }

    console.log('\n========================================');
    console.log(
      `[fix-addresses] 대상 → name="${name}", address LIKE "%${address}%"`
    );

    const addrPattern = `%${address}%`;

    const matches = await sql/*sql*/`
      SELECT id,
             name,
             address,
             ST_Y(geom::geometry) AS lat,
             ST_X(geom::geometry) AS lng
      FROM toilets
      WHERE name = ${name}
        AND address ILIKE ${addrPattern}
    `;

    if (matches.length === 0) {
      console.log('[fix-addresses] 🔍 0개 행 발견 → 스킵');
      continue;
    }

    console.log(`[fix-addresses] 🔍 ${matches.length}개 행 발견`);
    for (const m of matches) {
      console.log(
        `  - id=${m.id}, address="${m.address}", lat,lng=${m.lat},${m.lng}`,
      );
    }

    // VWorld에는 DB에 있는 address 전체를 쓰는 게 더 안정적
    const baseAddress = matches[0].address as string;
    console.log(
      `[fix-addresses] → VWorld 지오코딩: ${baseAddress}`,
    );

    // 1차: 도로명, 2차: 지번
    let geo = await geocodeVWorld(baseAddress, 'road');
    if (!geo) {
      console.log('[fix-addresses] road 실패 → parcel로 재시도');
      geo = await geocodeVWorld(baseAddress, 'parcel');
    }

    if (!geo) {
      console.log('[fix-addresses] ❌ VWorld 지오코딩 실패 → 스킵');
      continue;
    }

    const updated = await sql/*sql*/`
      UPDATE toilets
      SET geom = ST_SetSRID(ST_MakePoint(${geo.lng}, ${geo.lat}), 4326)::geography
      WHERE name = ${name}
        AND address ILIKE ${addrPattern}
      RETURNING id,
                name,
                address,
                ST_Y(geom::geometry) AS lat,
                ST_X(geom::geometry) AS lng
    `;

    console.log(`[fix-addresses] ✅ 업데이트 완료 (${updated.length}건)`);
    for (const u of updated) {
      console.log(
        `  → id=${u.id}, address="${u.address}", NEW lat,lng = ${u.lat}, ${u.lng}`,
      );
    }
  }

  await sql.end();
  console.log('\n🎉 [fix-addresses] 전체 완료');
}

main().catch((e) => {
  console.error('[fix-addresses] 오류:', e);
  sql.end();
  process.exit(1);
});
