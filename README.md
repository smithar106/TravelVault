# TravelVault

An AI-powered travel companion that organizes trips automatically and learns your travel style over time.

## Project Structure

```
├── app/          # React Native Expo frontend
├── api/          # Railway Node.js/Express backend
└── supabase/     # Database schema migrations
```

## Quick Start

### Backend (API)

```bash
cd api
cp .env.example .env    # Fill in API keys
npm install
npm run dev
```

### Frontend (App)

```bash
cd app
npm install
npx expo start
```

## Environment Variables

See `.env.example` in both `api/` and `app/` directories.

## Tech Stack

- **Frontend**: React Native with Expo SDK 51+
- **Backend**: Node.js/Express on Railway
- **Database**: Supabase (PostgreSQL)
- **AI**: DeepSeek API
- **Email**: Postmark Inbound Webhooks
- **Flight Data**: AviationStack API
- **Subscriptions**: RevenueCat
- **Analytics**: PostHog
