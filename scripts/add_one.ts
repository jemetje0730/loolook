import 'dotenv/config';
import postgres from 'postgres';
import fetch from 'node-fetch';

const sql = postgres(process.env.DATABASE_URL!, { prepare: true });
const KAKAO_KEY = process.env.KAKAO_REST_KEY!;

function isValidCoord(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) &&
    lng >= 124 && lng <= 132 &&
    lat >= 33 && lat <= 39;
}

async function geocode(addr: string) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(addr)}`;
  const resp = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } });
  const j: any = await resp.json().catch(() => ({}));
  const d = j?.documents?.[0];
  if (!d) return null;

  const lat = Number(d.y);
  const lng = Number(d.x);
  if (!isValidCoord(lat, lng)) return null;
  return { lat, lng };
}

async function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const address = args[1];

  if (!name || !address) {
    console.log(`사용법:
  npx tsx scripts/add_one.ts "화장실명" "주소"`);
    process.exit(0);
  }

  console.log(`[add-one] 지오코딩중: ${address}`);
  const g = await geocode(address);

  const id = crypto.randomUUID();

  await sql/*sql*/`
    INSERT INTO toilets (id, name, address, lat, lng, geom)
    VALUES (
      ${id},
      ${name},
      ${address},
      ${g ? g.lat : null},
      ${g ? g.lng : null},
      ${g ? sql`ST_SetSRID(ST_MakePoint(${g.lng}, ${g.lat}), 4326)::geography` : null}
    )
  `;

  console.log(`[add-one] 추가 완료! id = ${id}`);
  if (!g) console.log(`⚠ 좌표 없음 → fill_missing_geom.ts로 나중에 보완가능`);

  await sql.end();
}

main();
