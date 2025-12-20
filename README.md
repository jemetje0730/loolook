# LooLook — Toilet Map for Korea

A modern, mobile-friendly map service that helps users quickly find nearby private/public toilets.
Built with Next.js 16, Kakao Maps SDK, TypeScript, and a fully automated geospatial ingestion pipeline.

## Features

- **Interactive Kakao Map**
  - Smooth marker rendering with clustering
  - Real-time GPS tracking
  - No marker flickering when zooming or panning
  - Works on all mobile browsers and desktop

- **Multilingual Support (i18n)**
  - 4 languages: Korean (default), English, Chinese, Japanese
  - UI translations for filters, search, and detail panels
  - Auto-translation of toilet data (name, address, category) to English for non-Korean languages
  - Language switcher in navigation
  - Powered by next-intl

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

- **User Feedback System**
  - Multilingual feedback form
  - Report new toilets
  - Correct information
  - Bug reports and feature suggestions

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
- Next.js 16 (App Router)
- React 19
- TypeScript
- Kakao Maps JavaScript SDK
- next-intl (internationalization)
- TailwindCSS
- Zustand (state management)

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
│   ├── [locale]/              # Locale-based routing
│   │   ├── (info)/
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   └── feedback/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       ├── contact/
│       ├── feedback/
│       ├── geocode/
│       │   └── route.ts       # GET /api/geocode?q=...
│       ├── stats/
│       └── toilets/
│           └── route.ts       # GET/POST /api/toilets
├── components/
│   ├── DetailPanel.tsx        # Toilet details with auto-translation
│   ├── LanguageSwitcher.tsx   # Language selection dropdown
│   ├── MapView.tsx
│   └── TopNav.tsx
├── messages/                  # i18n translation files
│   ├── ko.json               # Korean (default)
│   ├── en.json               # English
│   ├── zh.json               # Chinese
│   └── ja.json               # Japanese
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
│   ├── ts/
│   │   ├── add_one.ts
│   │   ├── apply_address_overrides.ts
│   │   ├── fill_missing_geom.ts
│   │   └── ingest_multi.ts
│   ├── sh/                    # Shell scripts
│   └── sql/                   # SQL scripts
├── sql/
│   └── schema.sql             # Database Schema (PostgreSQL + PostGIS)
├── types/
│   ├── kakao.d.ts             # Kakao Maps SDK types
│   └── toilet.d.ts            # Toilet data types
├── i18n.ts                    # next-intl configuration
├── middleware.ts              # Locale routing middleware
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Database Schema (PostgreSQL + PostGIS)
```sql
CREATE TABLE toilets (
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
);
```

## API Endpoints

### GET /api/toilets?mode=all
- Returns all toilets with coordinates, optimized for client-side rendering.

### GET /api/geocode?q=...
- Server-side address/keyword geocoder using Kakao API.

### POST /api/toilets
- Insert custom toilet records (used by admin tool or future contributions).

### POST /api/feedback
- Submit user feedback (toilet reports, corrections, bugs, suggestions).

### POST /api/contact
- Submit contact messages.

### GET /api/stats
- Returns statistics about toilets in the database.

## Internationalization (i18n)

### Supported Languages
- **Korean (ko)**: Default language, always loads first
- **English (en)**: Full UI translation + auto-translated toilet data
- **Chinese (zh)**: Full UI translation + auto-translated toilet data
- **Japanese (ja)**: Full UI translation + auto-translated toilet data

### Translation Features
- UI elements (filters, search, buttons) are fully translated
- Toilet data (name, address, category) is auto-translated to English for non-Korean languages
- Translation uses Google Translate API
- Loading state prevents flicker during translation
- About and Contact pages remain Korean-only
- Feedback page is fully multilingual

### Adding a New Language
1. Add locale to `i18n.ts`:
   ```typescript
   export const locales = ['ko', 'en', 'zh', 'ja', 'new-locale'] as const;
   ```
2. Create translation file in `messages/new-locale.json`
3. Copy structure from `messages/en.json` and translate

## Deployment (Vercel)

### Command
```bash
npx vercel --prod
```

### Required Environment Variables
```env
DATABASE_URL=postgres://...
KAKAO_REST_KEY=your_rest_key
NEXT_PUBLIC_KAKAO_JS_KEY=your_js_key
```

### URLs
- Local: `http://localhost:3000`
- Production: `https://loolook.vercel.app`

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
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
- `feat`: Add new feature
- `fix`: Fix a bug
- `docs`: Documentation changes
- `test`: Add or update test code
- `refactor`: Code refactoring
- `build`: Modify build files
- `chore`: Minor changes
- `rename`: Rename file
- `remove`: Delete file
- `release`: Version release
