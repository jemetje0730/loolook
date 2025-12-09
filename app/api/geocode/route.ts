import { NextRequest, NextResponse } from 'next/server';

const REST_KEY = process.env.KAKAO_REST_KEY!;

// 한국 대략 경계 (오류 좌표 필터용)
const KR = { minLat: 33, maxLat: 39, minLng: 124, maxLng: 132 };
const inRange = (v: number, min: number, max: number) =>
  Number.isFinite(v) && v >= min && v <= max;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return NextResponse.json({ error: 'q required' }, { status: 400 });
    }
    if (!REST_KEY) {
      return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
    }

    const headers = { Authorization: `KakaoAK ${REST_KEY}` };

    // 1) 키워드 검색 (역/공원/장소 이름 등)
    let resp = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=1`,
      { headers, cache: 'no-store' }
    );
    let data = await resp.json();

    if (!data?.documents?.[0]) {
      // 2) 주소 검색
      resp = await fetch(
        `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}&size=1`,
        { headers, cache: 'no-store' }
      );
      data = await resp.json();
    }

    const doc = data?.documents?.[0];
    if (!doc) {
      return NextResponse.json({ error: 'no result' }, { status: 404 });
    }

    // Kakao는 x=lng, y=lat
    const lng = Number(doc.x ?? doc.address?.x ?? doc.road_address?.x);
    const lat = Number(doc.y ?? doc.address?.y ?? doc.road_address?.y);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      !inRange(lat, KR.minLat, KR.maxLat) ||
      !inRange(lng, KR.minLng, KR.maxLng)
    ) {
      return NextResponse.json({ error: 'invalid geocode' }, { status: 500 });
    }

    return NextResponse.json({
      lat,
      lng,
      name: doc.place_name || doc.address_name || q,
    });
  } catch (e) {
    console.error('[/api/geocode] error:', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
