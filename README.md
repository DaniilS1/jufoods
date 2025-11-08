# Jufoods Online Shop

Ein moderner Online-Shop für Torten und Desserts, gebaut mit Next.js, React, Tailwind CSS, Shadcn UI und Supabase.

## Features

- 🛍️ Produktkatalog mit Kategorien (Torten, Desserts)
- 🎨 Design-Auswahl für Torten
- 🛒 Warenkorb-Funktionalität
- ❤️ Favoriten-System
- 🌍 Mehrsprachigkeit (Deutsch, Ukrainisch)
- 👤 Optionale Benutzerregistrierung
- 📧 E-Mail-Benachrichtigungen bei Bestellungen
- 📱 Responsive Design

## Technologie-Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Styling:** Tailwind CSS mit benutzerdefiniertem Theme (Karamell, Kaffee, Vanille)
- **UI Components:** Shadcn UI (Radix UI)
- **i18n:** next-intl
- **State Management:** Zustand
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Email:** Nodemailer

## Setup

### Voraussetzungen

- Node.js 18+ 
- pnpm
- Supabase CLI (optional, für lokale Entwicklung)

### Installation

1. Repository klonen und in das Verzeichnis wechseln:

```bash
cd webapp
```

2. Dependencies installieren:

```bash
pnpm install
```

3. Umgebungsvariablen konfigurieren:

```bash
cd apps/web
cp .env.example .env.local
```

Bearbeiten Sie `.env.local` und fügen Sie Ihre Supabase-Credentials ein:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SMTP Konfiguration (später)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_password
SMTP_FROM=noreply@jufoods.com
ORDER_EMAIL=orders@jufoods.com
```

### Supabase Setup

1. Supabase CLI installieren (falls noch nicht installiert):

```bash
npm install -g supabase
```

2. Supabase-Projekt initialisieren (falls lokal):

```bash
cd apps/web
supabase init
```

3. Datenbank-Migrationen ausführen:

```bash
pnpm db:migrate
```

4. (Optional) Supabase Studio starten:

```bash
pnpm db:studio
```

### Entwicklung

Starten Sie den Entwicklungsserver:

```bash
pnpm dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) verfügbar.

### Build

Produktions-Build erstellen:

```bash
pnpm build
```

Produktions-Server starten:

```bash
pnpm start
```

## Projektstruktur

```
webapp/
├── apps/
│   └── web/                 # Next.js Anwendung
│       ├── app/             # App Router Seiten
│       ├── components/      # React Komponenten
│       ├── stores/          # Zustand Stores
│       ├── lib/             # Utilities und Konfiguration
│       ├── data/            # Produktdaten (JSON)
│       ├── messages/        # i18n Übersetzungen
│       └── supabase/        # Supabase Konfiguration & Migrationen
└── packages/                # Shared Packages
```

## Datenbank-Schema

### Tabellen

- **products**: Produktinformationen
- **orders**: Bestellungen
- **users**: Benutzer (über Supabase Auth)

Siehe `apps/web/supabase/migrations/` für das vollständige Schema.

## Features im Detail

### Produktkatalog

- Kategorien: Torten, Desserts
- Produktkarten mit Bildern, Namen, Beschreibungen
- Favoriten-Funktion
- Filterung nach Kategorien

### Produktdetailseite

- Großes Produktbild
- Design-Auswahl (Radio-Buttons)
- Zutatenliste
- Allergene
- "In den Warenkorb"-Funktion

### Warenkorb

- Sidebar/Drawer für Warenkorb
- Mengenänderung
- Artikel entfernen
- Zur Kasse

### Checkout

- Pflichtfelder: Name, E-Mail
- Optionale Felder: Telefon, Adresse, Notizen
- Bestellübersicht
- E-Mail-Benachrichtigung (bei konfiguriertem SMTP)

### Authentifizierung

- Optionale Registrierung/Anmeldung
- Gast-Checkout möglich
- Benutzer können ihre Bestellungen einsehen

## Nächste Schritte

1. Supabase-Projekt erstellen und Credentials konfigurieren
2. SMTP-Konfiguration für E-Mail-Benachrichtigungen einrichten
3. Produktbilder hochladen (derzeit Platzhalter)
4. Weitere Produkte zum `products.json` hinzufügen
5. Produktdaten von JSON zu Supabase migrieren

## Lizenz

Proprietär




