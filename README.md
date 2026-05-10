# VTU Super Learning Platform

An AI-assisted learning platform for VTU students, built as a Cloudflare Pages app with a Hono API and Cloudflare D1 database.

The app includes student and admin workflows for branches, subjects, resources, quizzes, AI study help, placement preparation, daily challenges, study planning, announcements, notifications, analytics, gamification, and exam countdowns.

## Tech Stack

- Vite 6
- Hono 4
- TypeScript
- Cloudflare Pages
- Cloudflare D1
- Wrangler 4
- Static frontend served from `public/index.html` and `public/static/app.js`

## Project Structure

```txt
webapp/
  migrations/          D1 schema, seed data, and database migrations
  public/              Static frontend assets
    index.html
    static/app.js
    static/style.css
  src/
    index.tsx          Hono app entrypoint and route registration
    middleware/auth.ts JWT and auth middleware
    routes/            API route modules
  package.json         NPM scripts and dependencies
  wrangler.jsonc       Cloudflare Pages and D1 configuration
```

## Prerequisites

- Node.js 18 or newer
- npm
- Cloudflare account
- Wrangler login for deployment and remote D1 work

Install dependencies:

```bash
npm install
```

## Local Development

Start the Vite development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the built Cloudflare Pages app locally:

```bash
npm run preview
```

Run the Pages preview on `0.0.0.0:3000`:

```bash
npm run dev:sandbox
```

## Database Setup

The app uses a D1 database named `vtu-platform-db`, bound as `DB` in `wrangler.jsonc`.

Apply local migrations:

```bash
npm run db:migrate:local
```

Seed local demo data:

```bash
npm run db:seed
```

Reset the local D1 database, then migrate and seed again:

```bash
npm run db:reset
```

For remote production D1, run Wrangler directly:

```bash
npx wrangler d1 migrations apply vtu-platform-db --remote
npx wrangler d1 execute vtu-platform-db --remote --file=./migrations/seed.sql
```

## Environment Variables

The app can run with the local AI knowledge base without external API keys.

Optional Cloudflare secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

When `OPENAI_API_KEY` is available, `/api/ai/chat` tries OpenAI first and falls back to the local VTU knowledge base if the request fails.

Important production note: `src/middleware/auth.ts` currently contains a hardcoded JWT secret for demo use. Replace it with a Cloudflare secret before production use.

## Deployment

Build and deploy to Cloudflare Pages:

```bash
npm run deploy
```

The deploy script runs:

```bash
npm run build && wrangler pages deploy dist
```

The Pages output directory is configured in `wrangler.jsonc`:

```json
"pages_build_output_dir": "./dist"
```

## API Overview

Base API prefix:

```txt
/api
```

Main route groups:

```txt
/api/auth
/api/branches
/api/subjects
/api/resources
/api/quiz
/api/ai
/api/users
/api/gamification
/api/placement
/api/planner
/api/notifications
/api/analytics
/api/announcements
/api/challenge
/api/exams
```

Health check:

```txt
GET /api/health
```

Authentication endpoints:

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Authenticated requests should include:

```txt
Authorization: Bearer <token>
```

## Demo Data

Seed data creates sample branches, subjects, quizzes, resources, announcements, placement questions, daily challenges, exam countdowns, notifications, and demo users.

Check `migrations/seed.sql` for the current demo credentials. Rotate or remove seeded credentials before deploying a real production instance.

## NPM Scripts

```txt
npm run dev               Start Vite dev server
npm run build             Build the app
npm run preview           Preview built app with Wrangler Pages
npm run dev:sandbox       Preview built app on 0.0.0.0:3000
npm run deploy            Build and deploy to Cloudflare Pages
npm run db:migrate:local  Apply D1 migrations locally
npm run db:seed           Seed local D1 data
npm run db:reset          Reset local D1 state, migrate, and seed
npm run cf-typegen        Generate Cloudflare binding types
```

## Type Generation

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```

Use the generated bindings with Hono when needed:

```ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

## Production Checklist

- Replace hardcoded JWT secret with an environment secret.
- Set `OPENAI_API_KEY` if remote AI responses are required.
- Apply all D1 migrations to the remote database.
- Seed only safe production data.
- Confirm the D1 database id in `wrangler.jsonc`.
- Run `npm run build` before deploying.
- Review CORS settings in `src/index.tsx` before public release.

