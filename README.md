# LooLook — Toilet Map for Korea

A modern, mobile-friendly map service that helps users quickly find nearby private/public toilets.  
Built with Next.js 15, Kakao Maps SDK, TypeScript, and a fully automated geospatial ingestion pipeline.

## Features

- **Interactive Kakao Map**
  - Smooth marker rendering with clustering
  - Real-time GPS tracking
  - No marker flickering when zooming or panning
  - Works on all mobile browsers and desktop

- **Toilet Filters**
  - Male toilet
  - Female toilet
  - Accessible toilet
  - Baby-changing table

- **Real-time My Location**
  - Accurate position overlay
  - Fixed-radius blue circle
  - Compass orientation support
  - Restores previous location using sessionStorage
  - Works instantly without reloading the map

- **Search**
  - Address search via Kakao geocoder
  - Keyword / POI search support
  - Smooth map recentering without extra markers

## Geospatial Data Pipeline

Automated ingestion pipeline to generate clean toilet data:
- CSV ingestion from multiple sources
- Automatic deduplication using fingerprint (name + address)
- Missing coordinates auto-filled using Kakao geocoder
- Address normalization
- Manual overrides via `overrides_address.csv`
- Final optimized dataset served via `/api/toilets?mode=all`

## Tech Stack

### Frontend
- Next.js 15
- React 18
- TypeScript
- Kakao Maps JavaScript SDK
- TailwindCSS
- Zustand

### Backend
- Next.js Route Handlers
- PostgreSQL
- PostGIS
- Node.js ingestion scripts
- CSV, geocoding, address override system

### DevOps
- Vercel (production + preview)
- GitHub
- Environment variables (REST API & DB URL)
- Automated CI/CD via Vercel

## Project Structure
# LooLook — Toilet Map for Korea

A modern, mobile-friendly map service that helps users quickly find nearby private/public toilets.  
Built with Next.js 15, Kakao Maps SDK, TypeScript, and a fully automated geospatial ingestion pipeline.

## Features

- **Interactive Kakao Map**
  - Smooth marker rendering with clustering
  - Real-time GPS tracking
  - No marker flickering when zooming or panning
  - Works on all mobile browsers and desktop

- **Toilet Filters**
  - Male toilet
  - Female toilet
  - Accessible (disabled) toilet
  - Baby-changing table
  - Gender-neutral
  - Free toilets
  - Filters do not recenter the map

- **Real-time My Location**
  - Accurate position overlay
  - Fixed-radius blue circle
  - Compass orientation support
  - Restores previous location using sessionStorage
  - Works instantly without reloading the map

- **Search**
  - Address search via Kakao geocoder
  - Keyword / POI search support
  - Smooth map recentering without extra markers

## Geospatial Data Pipeline

Automated ingestion pipeline to generate clean toilet data:
- CSV ingestion from multiple sources
- Automatic deduplication using fingerprint (name + address)
- Missing coordinates auto-filled using Kakao geocoder
- Address normalization
- Manual overrides via `overrides_address.csv`
- Final optimized dataset served via `/api/toilets?mode=all`

## Tech Stack

### Frontend
- Next.js 15
- React 18
- TypeScript
- Kakao Maps JavaScript SDK
- TailwindCSS
- Zustand

### Backend
- Next.js Route Handlers
- PostgreSQL
- PostGIS
- Node.js ingestion scripts
- CSV, geocoding, address override system

### DevOps
- Vercel (production + preview)
- GitHub
- Environment variables (REST API & DB URL)
- Automated CI/CD via Vercel

## Project Structure
```
loolook/
├── app/
│   ├── api/
│   │   ├── geocode/
│   │   │   └── route.ts  # GET /api/geocode?q=...
│   │   └── toilets/
│   │       └── route.ts  # GET/POST /api/toilets
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DetailPanel.tsx
│   ├── MapView.tsx
│   └── TopNav.tsx
├── src/
│   ├── hooks/
│   │   ├── useClusterer.ts
│   │   ├── useKakaoLoader.ts
│   │   ├── useKakaoMap.ts
│   │   ├── useMyLocation.ts
│   │   └── useToiletMarkers.ts
│   └── store/
│       └── useMapStore.ts
├── scripts/
│   ├── add_one.ts
│   ├── apply_address_overrides.ts
│   ├── fill_missing_geom.ts
│   └── ingest_multi.ts
├── sql/
│   └── schema.sql        # Database Schema (PostgreSQL + PostGIS)
├── types/
│   ├── kakao.d.ts         # Kakao Maps SDK types
│   └── toilet.d.ts        # Toilet data types
├── next.config.js
├── package.json
└── tsconfig.json
```

## Database Schema (PostgreSQL + PostGIS)
```bash
id SERIAL PRIMARY KEY,
name TEXT,
address TEXT,
geom GEOGRAPHY(POINT, 4326),
is_public BOOLEAN,
category TEXT,
phone TEXT,
open_time TEXT,
male_toilet TEXT,
female_toilet TEXT,
male_disabled TEXT,
female_disabled TEXT,
male_child TEXT,
female_child TEXT,
emergency_bell BOOLEAN,
cctv BOOLEAN,
baby_change BOOLEAN
```

## API Endpoints

### GET /api/toilets?mode=all
- Returns all toilets with coordinates, optimized for client-side rendering.

### GET /api/geocode?q=...
- Server-side address/keyword geocoder using Kakao API.

### POST /api/toilets
- Insert custom toilet records (used by admin tool or future contributions).

## Deployment (Vercel)
### Command
```
npx vercel --prod
```
### Required Environment Variable
```
DATABASE_URL=postgres://...
KAKAO_REST_KEY=your_rest_key

localhost:3000
yourproject.vercel.app
```

## Local Development
``` bash
npm install
npm run dev
```

## License

MIT License

Copyright (c) 2025 LooLook

Permission is hereby granted, free of charge, to any person obtaining a copy 
of this software and associated documentation files (the "Software"), to deal 
in the Software without restriction, including without limitation the rights 
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
copies of the Software, and to permit persons to whom the Software is furnished 
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.

## Commit Style
- feat: Add new feature
- fix: Fix a bug
- docs: Documentation changes
- test: Add or update test code
- refactor: Code refactoring
- build: Modify build files
- chore: Minor changes
- rename: Rename file
- remove: Delete file
- release: Version release