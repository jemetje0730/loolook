# LooLook Starter (Web-first → Hybrid App)

A minimal Next.js + Kakao Maps JS starter designed for fast MVP:
- Next.js App Router (TypeScript)
- Kakao Maps JS SDK (with clusterer)
- Bounds-based API using Postgres/PostGIS
- Simple ETL script to ingest public toilet data from a CSV and geocode via Kakao Local API
- Ready to wrap with Capacitor for iOS/Android

## Quick Start

1) **Install**

```bash
npm i
```

2) **Environment variables** — copy `.env.example` to `.env.local` and fill:

```
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key
KAKAO_REST_KEY=your_kakao_rest_key
DATABASE_URL=postgresql://user:pass@host:5432/loolook
```

3) **DB Setup (PostGIS)**
- Create a Postgres DB with PostGIS enabled.
- Apply schema:

```bash
psql $DATABASE_URL -f sql/schema.sql
```

4) **Run Dev**

```bash
npm run dev
```

5) **Ingest Data (optional to test)**

- Put a CSV at `data/public_toilets.csv` (headers should include `주소` or `address`, `명칭` or `name`).
- Run:

```bash
npx ts-node scripts/ingest_local_public.ts
```

> You can also insert a few manual rows using SQL to see pins immediately.

6) **Build & Deploy**
- Web: Deploy to Vercel (set env vars).
- App: Add Capacitor later (see bottom of this README).

## Folder Structure

```
app/
  page.tsx
  api/
    toilets/route.ts
components/
  MapView.tsx
  Filters.tsx
lib/
  db.ts
  bbox.ts
scripts/
  ingest_local_public.ts
sql/
  schema.sql
data/
  public_toilets.csv   (ignored by git)
.env.example
```

## Notes

- The API returns toilets within the current map bounds.
- Clusterer is enabled for performance.
- Extend filters by adding query params (e.g., `public=1`, `accessible=1`).

## Capacitor (Later)

```bash
npm i @capacitor/core @capacitor/cli
npx cap init loolook com.yourcompany.loolook
npm run build
npx cap add ios && npx cap add android
npx cap copy
npx cap open ios
npx cap open android
```

---
