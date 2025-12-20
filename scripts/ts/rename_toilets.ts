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
  console.error('[rename-toilets] ❌ DATABASE_URL 또는 PRODUCTION_DB 누락 (.env.local 확인)');
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { prepare: false });

type RenameRow = {
  old_name: string;
  address: string;      // 부분 매칭용 (ILIKE '%address%')
  new_name?: string;
  new_address?: string;
};

async function main() {
  console.log('🚀 [rename-toilets] 시작');

  const csvPath = path.join(process.cwd(), 'data/targets/rename_targets.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('[rename-toilets] ❌ data/targets/rename_targets.csv 파일이 없습니다.');
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse<RenameRow>(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[rename-toilets] CSV 로딩 완료: ${rows.length}개`);

  for (const row of rows) {
    const { old_name, address, new_name, new_address } = row;

    if (!old_name || !address) {
      console.log(
        '[rename-toilets] ⚠ old_name 또는 address가 비어있어 스킵:',
        row,
      );
      continue;
    }

    console.log('\n========================================');
    console.log(
      `[rename-toilets] 대상: old_name="${old_name}", address LIKE "%${address}%"`
    );
    console.log(
      `                 → new_name="${new_name ?? '(변경 없음)'}", new_address="${new_address ?? '(변경 없음)'}"`,
    );

    const addrPattern = `%${address}%`;

    const before = await sql/*sql*/`
      SELECT id, name, address
      FROM toilets
      WHERE name = ${old_name}
        AND address ILIKE ${addrPattern}
    `;

    if (before.length === 0) {
      console.log('[rename-toilets] 🔎 매칭되는 행이 없습니다. (스킵)');
      continue;
    }

    console.log(`[rename-toilets] 현재 매칭 행 수: ${before.length}`);
    for (const b of before) {
      console.log(`  - id=${b.id}, name="${b.name}", address="${b.address}"`);
    }

    // 바꿀 값이 하나도 없으면 스킵
    const hasNewName = !!(new_name && new_name.trim());
    const hasNewAddr = !!(new_address && new_address.trim());
    if (!hasNewName && !hasNewAddr) {
      console.log('[rename-toilets] 변경할 name/address가 없어 스킵');
      continue;
    }

    let updated;
    if (hasNewName && hasNewAddr) {
      updated = await sql/*sql*/`
        UPDATE toilets
        SET
          name = ${new_name!.trim()},
          address = ${new_address!.trim()}
        WHERE name = ${old_name}
          AND address ILIKE ${addrPattern}
        RETURNING id, name, address
      `;
    } else if (hasNewName) {
      updated = await sql/*sql*/`
        UPDATE toilets
        SET name = ${new_name!.trim()}
        WHERE name = ${old_name}
          AND address ILIKE ${addrPattern}
        RETURNING id, name, address
      `;
    } else {
      updated = await sql/*sql*/`
        UPDATE toilets
        SET address = ${new_address!.trim()}
        WHERE name = ${old_name}
          AND address ILIKE ${addrPattern}
        RETURNING id, name, address
      `;
    }

    console.log(`[rename-toilets] ✅ 업데이트된 행 수: ${updated.length}`);
    for (const u of updated) {
      console.log(
        `  → id=${u.id}, name="${u.name}", address="${u.address}"`,
      );
    }
  }

  await sql.end();
  console.log('\n🎉 [rename-toilets] 전체 완료');
}

main().catch((e) => {
  console.error('[rename-toilets] 오류:', e);
  sql.end();
  process.exit(1);
});
