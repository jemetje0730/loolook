import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = postgres(DATABASE_URL, { prepare: false });

async function main() {
  const args = process.argv.slice(2);
  const name = args[0];
  const addrKeyword = args[1];

  if (!name || !addrKeyword) {
    console.log(`사용법:
  npx tsx scripts/delete_one.ts "화장실명" "주소키워드"
`);
    process.exit(0);
  }

  console.log(`[delete-one] 삭제 대상 검색중...`);
  const before = await sql/*sql*/`
    SELECT id, name, address
    FROM toilets
    WHERE name = ${name}
      AND address LIKE ${'%' + addrKeyword + '%'}
  `;

  if (before.length === 0) {
    console.log(`⚠ 일치하는 화장실이 없습니다.`);
    await sql.end();
    return;
  }

  console.log('삭제 예정 행 목록:');
  for (const r of before) {
    console.log(` - ${r.id} | ${r.name} | ${r.address}`);
  }

  const deleted = await sql/*sql*/`
    DELETE FROM toilets
    WHERE id = ANY(${before.map((r: any) => r.id)})
    RETURNING id, name, address
  `;

  console.log(`\n✅ 삭제 완료. 삭제된 행 수: ${deleted.length}`);
  await sql.end();
}

main().catch((e) => {
  console.error('[delete-one] 오류:', e);
  sql.end();
  process.exit(1);
});
