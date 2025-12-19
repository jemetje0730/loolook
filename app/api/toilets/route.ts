import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');
    const isPublic = searchParams.get('public');

    if (mode === 'bounds') {
      const swLat = parseFloat(searchParams.get('swLat') || '');
      const swLng = parseFloat(searchParams.get('swLng') || '');
      const neLat = parseFloat(searchParams.get('neLat') || '');
      const neLng = parseFloat(searchParams.get('neLng') || '');

      if (isNaN(swLat) || isNaN(swLng) || isNaN(neLat) || isNaN(neLng)) {
        return NextResponse.json(
          { error: 'Invalid bounds parameters. Required: swLat, swLng, neLat, neLng' },
          { status: 400 },
        );
      }

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
          AND ST_Y(geom::geometry) BETWEEN ${swLat} AND ${neLat}
          AND ST_X(geom::geometry) BETWEEN ${swLng} AND ${neLng}
          ${isPublic !== null ? sql`AND is_public = ${isPublic === '1'}` : sql``}
      `;
      return NextResponse.json(rows);
    }

    if (mode === 'radius') {
      const lat = parseFloat(searchParams.get('lat') || '');
      const lng = parseFloat(searchParams.get('lng') || '');
      const radiusKm = parseFloat(searchParams.get('radius') || '');

      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
        return NextResponse.json(
          { error: 'Invalid radius parameters. Required: lat, lng, radius' },
          { status: 400 },
        );
      }

      const radiusMeters = radiusKm * 1000;

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
          AND ST_DWithin(
            geom,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
          ${isPublic !== null ? sql`AND is_public = ${isPublic === '1'}` : sql``}
        ORDER BY ST_Distance(
          geom,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )
      `;
      return NextResponse.json(rows);
    }

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
      { error: 'Invalid mode. Use ?mode=bounds, ?mode=radius, or ?mode=all' },
      { status: 400 },
    );
  } catch (e: any) {
    console.error('toilets GET error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
