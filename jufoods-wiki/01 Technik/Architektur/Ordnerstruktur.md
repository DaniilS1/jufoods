# Ordnerstruktur

## Repository Root

```
jufoods/
├── apps/
│   └── web/                    ← Haupt-App (Next.js)
├── jufoods-wiki/               ← Dieses Wiki (Obsidian Vault)
├── README.md                   ← Projekt-Doku (Deutsch)
├── TROUBLESHOOTING.md          ← Häufige Probleme & Lösungen
├── plan.md                     ← Aktuelle Entwicklungsplanung
├── db_schema.md                ← Datenbankschema-Referenz
├── ADMIN_SETUP.md
├── DESIGNS_SETUP.md
├── SUPABASE_SETUP.md
├── ENV_SETUP.md
└── DIAGNOSTIC_REPORT.md
```

## apps/web/ — Haupt-Applikation

```
apps/web/
├── app/                        ← Next.js App Router
│   ├── [locale]/               ← Lokalisierte Seiten (de, uk)
│   │   ├── page.tsx            ← Homepage
│   │   ├── layout.tsx          ← Locale-Layout
│   │   ├── products/           ← Produktkatalog
│   │   ├── checkout/           ← Bestellprozess
│   │   ├── order-success/      ← Bestellbestätigung
│   │   ├── favorites/          ← Favoriten
│   │   ├── about/              ← Über uns
│   │   ├── contact/            ← Kontakt
│   │   ├── login/              ← Anmelden
│   │   ├── register/           ← Registrieren
│   │   ├── forgot-password/    ← Passwort vergessen
│   │   ├── reset-password/     ← Passwort zurücksetzen
│   │   ├── account/            ← Kundenkonto
│   │   └── admin/              ← Admin-Panel (geschützt)
│   ├── api/                    ← API Routes (Server-side)
│   │   ├── products/           ← GET/POST /api/products
│   │   ├── designs/            ← GET/POST/PUT/DELETE /api/designs
│   │   ├── orders/             ← POST /api/orders
│   │   ├── custom-designs/     ← POST /api/custom-designs
│   │   ├── upload/             ← POST /api/upload
│   │   ├── auth/               ← Auth-Callbacks
│   │   ├── admin/              ← Admin-Endpoints (geschützt)
│   │   └── account/            ← Account-Endpoints (auth required)
│   ├── layout.tsx              ← Root Layout
│   └── globals.css             ← Globale Styles & CSS-Variablen
│
├── components/                 ← React-Komponenten (~41 Verzeichnisse)
│   ├── ui/                     ← Shadcn UI Basis-Komponenten
│   ├── shadcn-studio/          ← Vorgefertigte Component Blocks
│   ├── account/                ← Konto-Verwaltung
│   ├── admin-*.tsx             ← Admin-Verwaltungskomponenten
│   ├── checkout-client.tsx     ← Mehrstufiges Checkout-Formular
│   ├── shopping-cart.tsx       ← Warenkorb-Sidebar
│   ├── product-card.tsx        ← Produktkarte
│   ├── design-selector.tsx     ← Torten-Design-Auswahl
│   ├── flavour-selector.tsx    ← Füllungs-Auswahl
│   └── ...
│
├── lib/                        ← Utilities & Helpers
│   ├── supabase/               ← Supabase-Clients
│   │   ├── server.ts           ← SSR-Client (Session-aware)
│   │   ├── client.ts           ← Browser-Client
│   │   ├── admin.ts            ← Service-Role-Client (RLS-bypass)
│   │   ├── require-admin.ts    ← Admin-Auth-Middleware
│   │   └── account.ts          ← Account-Helper-Funktionen
│   ├── orders/                 ← Bestelllogik
│   │   └── order-types.ts      ← TypeScript-Typen für Orders
│   ├── database.types.ts       ← Auto-generiert via pnpm db:generate
│   ├── subcategory-config.ts   ← Kategorien & Unterkategorien
│   ├── image-utils.ts          ← Supabase Storage URL-Normalisierung
│   └── utils.ts                ← Allgemeine Utilities (cn, etc.)
│
├── stores/                     ← Zustand State Management
│   ├── cart-store.ts           ← Warenkorb (localStorage-persisted)
│   ├── favorites-store.ts      ← Favoriten (localStorage-persisted)
│   └── ui-store.ts             ← UI-State (nicht persistiert)
│
├── types/                      ← TypeScript-Typdefinitionen
│   └── product.ts              ← Product, FlavorOption, DesignOption
│
├── hooks/                      ← Custom React Hooks
│   └── use-pagination.ts       ← Pagination-Hook
│
├── messages/                   ← i18n-Übersetzungen
│   ├── de.json                 ← Deutsch (~590 Zeilen)
│   └── uk.json                 ← Ukrainisch (~594 Zeilen)
│
├── supabase/                   ← Datenbank
│   ├── config.toml             ← Supabase-Konfiguration
│   └── migrations/             ← SQL-Migrationsdateien (19+)
│
├── public/                     ← Statische Assets
│   └── placeholder-cake.svg    ← Fallback-Bild
│
├── data/                       ← Statische Produktdaten
├── email-templates/            ← E-Mail-Templates
│
├── .env.example                ← Beispiel-Umgebungsvariablen
├── .env                        ← Lokale Umgebungsvariablen (gitignored)
├── package.json                ← Dependencies & Scripts
├── tsconfig.json               ← TypeScript-Konfiguration
├── tailwind.config.ts          ← Tailwind-Theme
├── next.config.js              ← Next.js-Konfiguration
├── middleware.ts               ← i18n-Routing-Middleware
├── i18n.ts                     ← i18n-Konfiguration
└── .eslintrc.json              ← ESLint-Konfiguration
```

## Wichtige Konventionen

- **Path Alias:** `@/*` → Wurzel von `apps/web/`
- **Supabase-Typen:** `lib/database.types.ts` ist auto-generiert — nie manuell bearbeiten, immer `pnpm db:generate` ausführen
- **Neue UI-Komponenten:** über `shadcn CLI` zu `components/ui/` hinzufügen, nicht von Grund auf neu schreiben
- **Admin-Komponenten:** Benennungskonvention `admin-*.tsx` im `components/`-Verzeichnis
