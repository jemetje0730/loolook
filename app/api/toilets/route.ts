import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const isPublic = searchParams.get('public');

    if (mode === 'all') {
      const rows = await sql`
        SELECT id, name, address,
               ST_Y(geom::geometry) AS lat,
               ST_X(geom::geometry) AS lng,
               category, phone, open_time,
               male_toilet, female_toilet,
               male_disabled, female_disabled,
               male_child, female_child,
               emergency_bell, cctv, baby_change
        FROM toilets
        WHERE geom IS NOT NULL
          ${isPublic !== null ? sql`AND is_public = ${isPublic === '1'}` : sql``}
      `;
      return NextResponse.json(rows);
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use ?mode=all' },
      { status: 400 },
    );
  } catch (e: any) {
    console.error('toilets GET error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
