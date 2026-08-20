# LooLook

### Find a restroom when you need one.

LooLook is a location-based web and mobile app that helps people quickly find nearby public and free restrooms in Korea.

Built from a simple real-world problem: **finding a restroom can be unexpectedly difficult, especially when you're in an unfamiliar place or in an urgent situation.**

**Live:** https://loolook.vercel.app

---

## Why I Built This

Public restroom information exists across multiple datasets, but it is often fragmented, inconsistent, or difficult to access when you actually need it.

I wanted to build a simple experience where users could:

- Open the app
- See nearby restrooms immediately
- Filter based on their needs
- Navigate without dealing with scattered public datasets

The project was eventually launched as a real product, with both web and mobile versions.

---

## Real-World Usage

LooLook was not built only as a portfolio project.

The product was launched and used by real users.

I have also received direct feedback from users who used LooLook in urgent situations and found it genuinely helpful.

That experience was especially valuable because it allowed me to move beyond simply building features and start thinking about:

- What problems users actually care about
- How people use a product in real situations
- How product decisions change after user feedback

---

## Key Features

- Interactive Kakao Map with marker clustering
- Real-time user location
- Public and private restroom discovery
- Accessibility and facility filters
- Baby-changing table information
- Free restroom filtering
- Address and keyword search
- Korean, English, Chinese, and Japanese support
- User feedback and restroom reporting

---

## Data Pipeline

One of the main technical challenges was turning fragmented public restroom data into a clean, usable dataset.

The ingestion pipeline includes:

- CSV ingestion from multiple sources
- Automatic deduplication using name and address fingerprints
- Automatic coordinate completion through geocoding
- Address normalization
- Manual overrides for problematic records
- PostgreSQL + PostGIS for geospatial data

---

## Tech Stack

**Frontend**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Zustand

**Maps & Location**
- Kakao Maps JavaScript SDK
- Kakao Geocoding API
- Browser Geolocation API

**Backend & Data**
- Next.js Route Handlers
- PostgreSQL
- PostGIS
- Node.js data ingestion scripts

**Mobile**
- Capacitor
- iOS
- Android

---

## What I Learned

Building LooLook taught me more than how to build a map application.

Some of the biggest lessons were:

- Working with messy real-world public data
- Designing geospatial data pipelines
- Handling location-based UX
- Building and deploying a complete product
- Turning user feedback into product decisions

---

## Project Structure
```
loolook/
├── app/
│   ├── [locale]/        # Main application pages
│   └── api/             # Backend API routes
├── components/          # UI components
├── messages/            # i18n translation files
├── src/
│   ├── hooks/           # Map and location logic
│   └── store/           # State management
├── scripts/             # Data ingestion and processing
├── sql/                 # Database schema
├── types/               # Type definitions
└── package.json
```

## Local Development

```bash
npm install
npm run dev
```
