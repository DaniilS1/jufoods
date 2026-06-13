# Tech Stack

## Core Framework

| Technology | Version | Role |
|---|---|---|
| **Next.js** | 14.2.35 | Full-stack React framework (App Router) |
| **React** | 18.2.0 | UI library |
| **TypeScript** | 5.3.3 | Type-safe development |
| **Node.js** | 18+ | Runtime |

## Backend & Database

| Technology | Version | Role |
|---|---|---|
| **Supabase** | 2.39.0 | PostgreSQL database, Auth, Storage |
| **Supabase SSR** | 0.8.0 | Server-side session handling |

Supabase wird **remote only** betrieben — kein lokaler `supabase start`.

## Styling & UI

| Technology | Version | Role |
|---|---|---|
| **Tailwind CSS** | 3.4.1 | Utility-first styling |
| **Shadcn UI** | — | Component library (built on Radix UI) |
| **Radix UI** | various | Headless accessible primitives |
| **Lucide React** | 0.312.0 | Icon set |
| **next-themes** | 0.4.6 | Dark/light mode |
| **Embla Carousel** | 8.6.0 | Image carousel/slider |
| **tailwindcss-animate** | — | Animation utilities |

### Custom Color System

Das Theme verwendet HSL CSS-Variablen, definiert in `apps/web/app/globals.css`.

| Variable | Beschreibung |
|---|---|
| `--primary` | Hauptfarbe (Caramel/Pfirsich `#E9D4CF`) |
| `--secondary` | Sekundärfarbe |
| `--accent` | Akzentfarbe |
| `--destructive` | Fehler/Löschen (rot) |
| `--muted` | Gedämpfte Töne |
| `--card` | Karten-Hintergrund |
| `--popover` | Popover-Hintergrund |

Immer Theme-Tokens verwenden (`bg-primary`, `text-accent`, etc.) — **keine** direkten Tailwind-Farbklassen.

## State Management

| Technology | Version | Role |
|---|---|---|
| **Zustand** | 4.4.7 | Client-side state (Cart, Favorites, UI) |

Stores werden im `localStorage` persistiert (außer UI-Store). Siehe [[../State Management|State Management]].

## Forms & Validation

| Technology | Version | Role |
|---|---|---|
| **React Hook Form** | 7.49.3 | Form state management |
| **Zod** | 3.22.4 | Schema validation |

## Internationalization

| Technology | Version | Role |
|---|---|---|
| **next-intl** | 3.5.0 | i18n (DE/UK) |

Unterstützte Sprachen: Deutsch (`de`, default), Ukrainisch (`uk`). Siehe [[../i18n & Lokalisierung|i18n & Lokalisierung]].

## Data Fetching

| Technology | Version | Role |
|---|---|---|
| **TanStack React Query** | 5.59.16 | Server state & caching |
| **TanStack React Table** | 8.21.3 | Data tables (admin) |

## Rich Text

| Technology | Version | Role |
|---|---|---|
| **TipTap** | 3.20.2 | Rich text editor (admin descriptions) |

## Notifications

| Technology | Version | Role |
|---|---|---|
| **Sonner** | 2.0.7 | Toast notifications |

## Package Manager

**pnpm** — alle Befehle aus `apps/web/` ausführen.

```bash
pnpm install          # Dependencies installieren
pnpm dev              # Dev-Server (localhost:3000)
pnpm build            # Production build
pnpm start            # Production server starten
pnpm lint             # ESLint (next/core-web-vitals)
pnpm db:generate      # Supabase TypeScript-Typen generieren → lib/database.types.ts
pnpm db:migrate       # Migrationen auf remote DB anwenden
pnpm db:studio        # Supabase Studio öffnen
```
