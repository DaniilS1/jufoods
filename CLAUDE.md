# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Jufoods — Next.js 14 (App Router) e-commerce shop for handmade cakes and desserts. Stack: TypeScript, Tailwind CSS, Shadcn UI, Supabase (auth + Postgres), Zustand, next-intl (de/uk), React Hook Form + Zod.

## Package manager & workspace

Uses **pnpm**. The main app lives in `apps/web/`. All commands below run from there unless stated otherwise.

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # ESLint (next/core-web-vitals)
pnpm db:generate  # regenerate TypeScript types from Supabase schema
pnpm db:migrate   # apply pending migrations to the remote Supabase project
pnpm db:studio    # open Supabase Studio in the browser
```

## Environment variables

Required in `apps/web/.env` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ORDER_WEBHOOK_URL          # optional — webhook for order notifications
ORDER_WEBHOOK_TIMEOUT_MS   # optional — 2000–30000 ms, default 8000
```

Supabase is **remote only** — do not run `supabase start` or assume a local instance.

## i18n — critical rule

All user-visible strings must be added to **both** translation files:
- `apps/web/messages/de.json` (German — default locale)
- `apps/web/messages/uk.json` (Ukrainian)

Never add a translation key to only one file.

All app routes are locale-prefixed: `/de/...` and `/uk/...`. The middleware (`apps/web/middleware.ts`) handles locale detection and redirection; API routes (`/api/*`) are excluded.

## Code style

- TypeScript strict mode. Path alias `@/*` maps to `apps/web/`.
- No Prettier — formatting is ESLint only (Next.js defaults).
- Styling: Tailwind CSS with custom HSL CSS variables defined in `apps/web/app/globals.css`. Use the custom theme tokens (`primary`, `secondary`, `accent`, etc.) rather than raw Tailwind color classes.
- UI components: Shadcn UI (`apps/web/components/ui/`). Add new primitives there via the shadcn CLI rather than writing from scratch.
- Run `pnpm db:generate` after any schema migration to keep TypeScript types in sync.

## Database

Schema reference: `db_schema.md`. Migrations live in `apps/web/supabase/migrations/`. Key tables: `products`, `torten_designs`, `torten_flavours`, `orders`, `customers`, `users`, `custom_designs`.

## Subdirectory CLAUDE.md

Per-module instructions can be added as `apps/web/CLAUDE.md` for app-specific details if needed.
