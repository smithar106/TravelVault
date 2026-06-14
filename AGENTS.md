# TravelVault — Agent Guidelines

## Project Layout

### App Repo (`smithar106/TravelVault`)
```
/
├── api/       # Railway Node.js/Express backend (TypeScript)
├── app/       # React Native Expo frontend (TypeScript)
└── supabase/  # Database schema migration SQL
```

### Website Repo (`smithar106/TravelVault-Site`)
```
/
├── app/            # Next.js 14 App Router pages
├── components/     # Shared UI + section components
│   ├── sections/   # Hero, VsTripIt, Problem, HowItWorks, etc.
│   └── ui/         # Reusable UI primitives
├── public/         # Static assets
└── package.json
```

### Quiz Repo (`smithar106/TravelVault-Quiz`)
```
/
├── app/
│   ├── page.tsx           # Renders QuizShell
│   ├── layout.tsx         # Root layout + metadata
│   └── api/submit/route.ts # POST endpoint → Railway API
├── components/
│   ├── QuizShell.tsx      # State machine, transitions, progress bar
│   ├── steps/             # 9 step components (Hook → Email)
│   └── lib/supabase.ts    # Lazy Supabase client
└── package.json
```

## Commands

### Backend (`api/`)
```bash
cd api
npm install          # Install deps
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript → dist/
npm run start        # Run compiled JS from dist/
npx tsc --noEmit     # Type-check only (same as npm run typecheck)
```

### Frontend (`app/`)
```bash
cd app
npm install          # Install deps
npx expo start       # Start Expo dev server
npx expo start --ios # iOS simulator
npx tsc --noEmit     # Type-check
```

### Website (repo: `smithar106/TravelVault-Site`)

Next.js 14 App Router + TypeScript + Tailwind CSS + Framer Motion. Deployed to Vercel.

```bash
cd TravelVault-Site
npm install          # Install deps
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build (7 static routes)
npm run lint         # ESLint
npx tsc --noEmit     # Type-check
```

**Routes**: `/` `/features` `/pricing` `/faq` `/privacy` `/terms`

**Homepage sections**: Hero (animated phone mockup) → VsTripIt (comparison table) → Problem (3 pain cards) → HowItWorks (3-step flow) → Features (2x3 grid) → Testimonials (navy bg) → Pricing (toggle) → FAQ (accordion) → FinalCTA (app store badges)

**Key env vars**: `NEXT_PUBLIC_QUIZ_URL` `NEXT_PUBLIC_APP_STORE_URL` `NEXT_PUBLIC_PLAY_STORE_URL`

**Colors**: Teal `#0D6B6B`, Sand `#F5A623`, Navy `#1A1A2E`, Offwhite `#FAFAFA`

### Quiz (repo: `smithar106/TravelVault-Quiz`)

Next.js 14 + Framer Motion slide transitions + Supabase quiz_leads. Deployed to Vercel.

```bash
cd TravelVault-Quiz
npm install          # Install deps
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (3 routes)
npx tsc --noEmit     # Type-check
```

**7-step flow**: Hook (navy globe) → Interests (2x4 grid) → Pace (auto-advance) → Accommodation → Planning Style → Pain Point → Analyzing → Archetype reveal → Email capture → Supabase save → App Store redirect

**Archetypes**: Food Explorer, Culture Seeker, Adventure Sprinter, Luxury Traveler, Discoverer, Sun Chaser, Night Owl, Rejuvenator, Savvy Explorer, Curious Wanderer

**Key env vars**: `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` `TRAVELVAULT_API_URL` `NEXT_PUBLIC_APP_STORE_URL`

### Supabase
```bash
# Run schema.sql in Supabase SQL Editor or:
supabase db push     # If using Supabase CLI
```

## Environment Variables
Both `api/.env.example` and `app/app.json` (under `extra`) list required keys:
- `DEEPSEEK_API_KEY` — AI analysis
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` — database/auth
- `POSTMARK_API_KEY`, `POSTMARK_INBOUND_DOMAIN` — email forwarding
- `AVIATIONSTACK_API_KEY` — flight tracking
- `REVENUECAT_API_KEY` — subscriptions (app only)
- `POSTHOG_API_KEY` — analytics (app only)
- `TRAVELVAULT_QUIZ_URL` — quiz integration URL

## Architecture Notes

### API Routes
- `POST /api/quiz-complete` — No auth. Saves quiz data → returns deep link token
- `POST /api/webhooks/postmark-inbound` — Postmark forwards booking emails here. Identifies user by travelvault_email in To field. Calls DeepSeek to parse. Creates trip + booking + async guide gen.
- `POST /api/generate-destination-guide/:trip_id` — Auth. Calls DeepSeek with user profile + destination
- `GET/POST/DELETE /api/trips` — Full CRUD with auth
- `GET /api/trips/:id` — Trip + bookings + guide
- `GET /api/flight-status/:flight_number/:date` — AviationStack lookup
- `GET /api/travel-profile` / `POST /api/travel-profile/update` — Profile + AI personality
- `GET /api/documents` / `POST /api/documents/upload` / `DELETE /api/documents/:id`

### AI Integration
All AI calls go through `api/src/lib/deepseek.ts` — never call DeepSeek from the mobile app directly. The backend:
1. `parseBookingEmail()` — Extracts structured booking data from raw email text
2. `generateDestinationGuide()` — Creates full neighborhood guide + packing list
3. `generateTravelPersonality()` — 2-3 sentence personality summary
4. `generateNearbySuggestions()` — Contextual real-time suggestions during active trips

### Email Flow
1. User gets `firstname-random6@in.travelvault.app`
2. Forwards booking confirmation to that address
3. Postmark receives it, POSTs to `/api/webhooks/postmark-inbound`
4. Backend finds user by `travelvault_email` in To field
5. DeepSeek parses the booking → creates/updates trip → auto-generates guide

### Deep Link
- Scheme: `travelvault://`
- Quiz complete: `travelvault://quiz-complete?token=xxx`
- Handled in `app/_layout.tsx` via `expo-linking`

### Offline Support
- `app/src/lib/storage.ts` wraps Expo SecureStore
- Trip data should be cached to SQLite (via `expo-sqlite`) for offline access
- Flight status polls every 10 minutes when trip is active (`useFlightStatus` hook)

### Navigation
- Expo Router file-based routing
- `app/_layout.tsx` — Root stack (auth → tabs → detail → paywall)
- `app/(tabs)/_layout.tsx` — 4 bottom tabs: Trips, Vault, Profile, Settings
- `app/trip/[id].tsx` — Trip detail with 4 internal tabs (Timeline | Guide | Packing | Docs)

## Code Style
- TypeScript strict mode throughout
- Expo Router file-based routing conventions
- Supabase RLS on all tables (see `supabase/schema.sql`)
- Every async operation must have loading + error states
- No AI calls from mobile client — always proxy through Railway API
- Colors: Primary teal `#0D6B6B`, accent sand `#F5A623`, background `#FAFAFA`

## Testing
Currently no automated test suite. When adding:
- Backend: Use `vitest` or `jest` with `supertest` for API routes
- Frontend: Use `jest-expo` for component tests
- Test files should live alongside their source: `src/__tests__/` directories
