import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const isPublic = searchParams.get('public');

    // ---------- 1) 전체 조회 모드 (MapView 기본 로직) ----------
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const toilets = Array.isArray(body) ? body : [body];

    for (const t of toilets) {
      if (!t.name || !t.address || typeof t.lat !== 'number' || typeof t.lng !== 'number') continue;

      await sql`
        INSERT INTO toilets (name, address, is_public, geom)
        VALUES (
          ${t.name},
          ${t.address},
          ${t.is_public ?? true},
          ST_SetSRID(ST_MakePoint(${t.lng}, ${t.lat}), 4326)::geography
        )
        ON CONFLICT DO NOTHING;
      `;
    }

    return NextResponse.json({ ok: true, count: toilets.length });

  } catch (e: any) {
    console.error('toilets POST error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
