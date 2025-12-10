import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { parse } from 'csv-parse/sync';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('[delete-toilets] ❌ DATABASE_URL 누락 (.env.local 확인)');
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { prepare: false });

type DeleteRow = {
  name: string;
  address: string; // 부분 매칭용
};

async function main() {
  console.log('🚀 [delete-toilets] 시작');

  const csvPath = path.join(process.cwd(), 'data/delete_targets.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('[delete-toilets] ❌ data/delete_targets.csv 파일이 없습니다.');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse<DeleteRow>(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[delete-toilets] CSV 로딩 완료: ${rows.length}개`);

  for (const row of rows) {
    const { name, address } = row;

    if (!name || !address) {
      console.log('[delete-toilets] ⚠ name 또는 address 누락 → 스킵:', row);
      continue;
    }

    console.log('\n========================================');
    console.log(
      `[delete-toilets] 삭제 대상: name="${name}", address LIKE "%${address}%"`
    );

    const addrPattern = `%${address}%`;

    const before = await sql/*sql*/`
      SELECT id, name, address
      FROM toilets
      WHERE name = ${name}
        AND address ILIKE ${addrPattern}
    `;

    if (before.length === 0) {
      console.log('[delete-toilets] 🔎 매칭되는 행이 없습니다. (스킵)');
      continue;
    }

    console.log(
      `[delete-toilets] 삭제 예정 행 수: ${before.length}`,
    );
    for (const b of before) {
      console.log(
        `  - id=${b.id}, name="${b.name}", address="${b.address}"`,
      );
    }

    const result = await sql/*sql*/`
      DELETE FROM toilets
      WHERE name = ${name}
        AND address ILIKE ${addrPattern}
      RETURNING id
    `;

    console.log(
      `[delete-toilets] ✅ 실제 삭제된 행 수: ${result.length}`,
    );
  }

  await sql.end();
  console.log('\n🎉 [delete-toilets] 전체 완료');
}

main().catch((e) => {
  console.error('[delete-toilets] 오류:', e);
  sql.end();
  process.exit(1);
});
