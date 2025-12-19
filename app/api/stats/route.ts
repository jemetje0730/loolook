import { NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

export async function GET() {
  try {
    const [toiletCount] = await sql`
      SELECT COUNT(*) as count
      FROM toilets
      WHERE geom IS NOT NULL
    `;

    const [publicCount] = await sql`
      SELECT COUNT(*) as count
      FROM toilets
      WHERE geom IS NOT NULL
        AND category NOT IN ('매장 내부 화장실', '도어락 잠금 화장실')
    `;

    const [disabledCount] = await sql`
      SELECT COUNT(*) as count
      FROM toilets
      WHERE geom IS NOT NULL
        AND (male_disabled = 'O' OR female_disabled = 'O')
    `;

    const [babyChangeCount] = await sql`
      SELECT COUNT(*) as count
      FROM toilets
      WHERE geom IS NOT NULL AND baby_change = true
    `;

    return NextResponse.json({
      total: parseInt(toiletCount.count),
      public: parseInt(publicCount.count),
      disabled: parseInt(disabledCount.count),
      babyChange: parseInt(babyChangeCount.count),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
