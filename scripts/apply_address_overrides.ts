import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('[addr-override] DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

type Row = { id: string; address: string };

function cleanAddress(raw: string) {
  let a = (raw || '').trim();
  // 자주 보이는 오탈자/노이즈 정리
  a = a.replace(/서을특별시/g, '서울특별시');
  a = a.replace(/\?/g, ' ');
  a = a.replace(/\s+/g, ' ');
  // 괄호 설명/콤마 뒤 부가설명 제거
  a = a.replace(/,.*$/, '');
  a = a.replace(/\(.*?\)/g, '');
  // 붙은 동/도로번호 띄우기
  a = a.replace(/([가-힣A-Za-z0-9]+동)([^\s])/g, '$1 $2'); // 하계1동255 → 하계1동 255
  a = a.replace(/(로|길|대로|로길)(\d)/g, '$1 $2');        // 동일로112길 → 동일로 112길
  a = a.replace(/(로|대로)\s?(\d+)(?:-|\s)?(\d+)?/g, (_m, p1, n1, n2) => `${p1} ${n1}${n2 ? '-' + n2 : ''}`);
  a = a.replace(/\s{2,}/g, ' ').trim();

  // 서울 데이터로 가정 → 축약 시 프리픽스 보강
  if (!/한국|대한민국|서울|부산|인천|대구|대전|광주|울산|경기|강원|충청|전라|경상|제주/.test(a)) {
    if (/([가-힣A-Za-z]+구)/.test(a)) a = `서울특별시 ${a}`;
    else a = `대한민국 ${a}`;
  }
  return a;
}

async function main() {
  // 파일 읽기
  const path = './overrides_address.csv';
  if (!fs.existsSync(path)) {
    console.error('[addr-override] 프로젝트 루트에 overrides_address.csv 파일을 두세요. (id,address)');
    process.exit(1);
  }
  const csv = fs.readFileSync(path, 'utf8');
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Row[];

  if (!rows.length) {
    console.log('[addr-override] 읽은 행 0건 (헤더/포맷 확인)');
    process.exit(0);
  }

  console.log(`[addr-override] 읽은 행: ${rows.length}건`);

  // 트랜잭션으로 주소 업데이트 & geom NULL로 초기화(재지오코딩 유도)
  const updated: string[] = [];
  const skipped: string[] = [];

  await sql.begin(async (trx) => {
    for (const r of rows) {
      const id = String(r.id || '').trim();
      const addrRaw = String(r.address || '').trim();

      if (!id) { skipped.push(`${r.id} (id 없음)`); continue; }
      if (!addrRaw || addrRaw === '없음') { skipped.push(`${id} (address 비어있음/없음)`); continue; }

      const addr = cleanAddress(addrRaw);

      // 해당 id 존재 여부 확인
      const exists = await trx<{ c: number }[]>/*sql*/`
        SELECT COUNT(*)::int AS c FROM toilets WHERE id = ${id}
      `;
      if (Number(exists[0]?.c) === 0) { skipped.push(`${id} (toilets에 없음)`); continue; }

      await trx/*sql*/`
        UPDATE toilets
        SET address = ${addr}, geom = NULL
        WHERE id = ${id}
      `;
      updated.push(id);
    }
  });

  console.log(`[addr-override] 주소 업데이트 완료: ${updated.length}건, 스킵: ${skipped.length}건`);
  if (skipped.length) {
    console.log('[addr-override] 스킵 예시(최대 10):');
    for (const s of skipped.slice(0, 10)) console.log(' -', s);
  }

  // 현재 상태 리포트
  const remain = await sql<{ c: number }[]>/*sql*/`SELECT COUNT(*)::int AS c FROM toilets WHERE geom IS NULL`;
  console.log(`[addr-override] 현재 DB 남은 geom NULL: ${remain[0].c}`);

  await sql.end();
}

main().catch(async (e) => {
  console.error('[addr-override] 오류:', e?.message ?? e);
  try { await sql.end(); } catch {}
  process.exit(1);
});
