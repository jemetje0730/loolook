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
  console.error('[delete-toilets] ❌ DATABASE_URL 또는 PRODUCTION_DB 누락 (.env.local 확인)');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

type DeleteRow = {
  name: string;
  address: string;
};

function normalizeName(input: string): string {
  return (input ?? '').replace(/\s+/g, '').trim();
}

/**
 * 주소를 "매칭 친화적"으로 정규화해서 짧게 만듦
 * - 괄호/따옴표 제거
 * - 쉼표 뒤 부가설명 제거
 * - 가능하면 "도로명(대로/로/길)+번지" 또는 "지번(동 1234-56)"까지만 추출
 * - 마지막에 공백 제거 (DB도 공백 제거해서 비교)
 */
function normalizeAddress(input: string): string {
  if (!input) return '';

  let s = input.replace(/"/g, '').replace(/\([^)]*\)/g, ' ').trim();
  s = s.split(',')[0].replace(/\s+/g, ' ').trim();

  const roadMatch = s.match(/(.+?(?:대로|로|길)\s*\d+(?:-\d+)?)/);
  if (roadMatch?.[1]) return roadMatch[1].replace(/\s+/g, '').trim();

  const jibunMatch = s.match(/(.+?\s\d{3,5}-\d+)/);
  if (jibunMatch?.[1]) return jibunMatch[1].replace(/\s+/g, '').trim();

  return s.replace(/\s+/g, '').trim();
}

async function main() {
  console.log('🚀 [delete-toilets] 시작');

  const csvPath = path.join(process.cwd(), 'data/targets/delete_targets.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('[delete-toilets] ❌ data/targets/delete_targets.csv 파일이 없습니다.');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse<DeleteRow>(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[delete-toilets] CSV 로딩 완료: ${rows.length}개`);

  let totalDeleted = 0;

  for (const row of rows) {
    const { name, address } = row;

    if (!name || !address) continue;

    const nameNorm = normalizeName(name);
    const addrNorm = normalizeAddress(address);
    const addrPattern = `%${addrNorm}%`;

    // ✅ "매칭 되는 것만" 출력/삭제: name(공백제거 동일) + address(공백제거 포함)
    const matched = await sql/*sql*/`
      SELECT id, name, address
      FROM toilets
      WHERE regexp_replace(name, '\\s+', '', 'g') = ${nameNorm}
        AND regexp_replace(address, '\\s+', '', 'g') ILIKE ${addrPattern}
    `;

    if (matched.length === 0) continue;

    console.log('\n========================================');
    console.log(`[delete-toilets] 삭제 대상: "${name}"`);
    console.log(`[delete-toilets]  - nameNorm : "${nameNorm}"`);
    console.log(`[delete-toilets]  - addrNorm : "${addrNorm}"`);
    console.log(`[delete-toilets]  - matched  : ${matched.length}개`);
    for (const m of matched) {
      console.log(`  - id=${m.id}, name="${m.name}", address="${m.address}"`);
    }

    const deleted = await sql/*sql*/`
      DELETE FROM toilets
      WHERE regexp_replace(name, '\\s+', '', 'g') = ${nameNorm}
        AND regexp_replace(address, '\\s+', '', 'g') ILIKE ${addrPattern}
      RETURNING id
    `;

    console.log(`[delete-toilets] ✅ deleted: ${deleted.length}개`);
    totalDeleted += deleted.length;
  }

  await sql.end();
  console.log(`\n🎉 [delete-toilets] 전체 완료 (deleted=${totalDeleted})`);
}

main().catch((e) => {
  console.error('[delete-toilets] 오류:', e);
  sql.end();
  process.exit(1);
});