# Entwicklungsumgebung einrichten

## Voraussetzungen

- **Node.js** 18+
- **pnpm** (Package Manager)
- Zugang zum **Supabase-Projekt** (URL + Keys)

## Setup-Schritte

```bash
# 1. Repository klonen
git clone https://github.com/DaniilS1/jufoods.git
cd jufoods

# 2. Dependencies installieren
pnpm install

# 3. Umgebungsvariablen setzen
cd apps/web
cp .env.example .env
# .env mit echten Werten befüllen (siehe Umgebungsvariablen)

# 4. Datenbank-Typen generieren
pnpm db:generate

# 5. Dev-Server starten
pnpm dev
```

→ App läuft auf **http://localhost:3000**

> Supabase ist remote-only. Kein `supabase start` nötig.

## Nützliche Befehle

```bash
pnpm dev              # Dev-Server (Hot Reload)
pnpm build            # Production Build
pnpm start            # Production Server lokal starten
pnpm lint             # ESLint ausführen
pnpm db:generate      # TypeScript-Typen neu generieren
pnpm db:migrate       # Migrationen auf Remote-DB anwenden
pnpm db:studio        # Supabase Studio im Browser öffnen
```

> Alle Befehle aus `apps/web/` ausführen.

## Bekannte Hinweise

- **Erster Build:** Kann 2–3 Minuten dauern (Admin-Module + i18n-Loading)
- **TypeScript-Typen:** Nach Datenbankänderungen immer `pnpm db:generate` ausführen — `lib/database.types.ts` ist auto-generiert
- **Schreibrechte:** Sicherstellen, dass `.next/`, `.next/types/` und `next-env.d.ts` beschreibbar sind

## Umgebungsvariablen

Vollständige Dokumentation: [[Umgebungsvariablen]]

## Troubleshooting

Häufige Probleme & Lösungen: `TROUBLESHOOTING.md` im Repository-Root (auf Deutsch).
