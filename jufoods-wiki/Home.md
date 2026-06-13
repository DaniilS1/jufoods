# Jufoods Wiki

Online-Shop für handgemachte Torten und Desserts — internes Wissensportal.

---

## Navigation

### 🔧 [[01 Technik/Architektur/Tech-Stack|Technik]]
| | |
|---|---|
| [[01 Technik/Architektur/Tech-Stack\|Tech-Stack]] | Alle verwendeten Technologien & Versionen |
| [[01 Technik/Architektur/Ordnerstruktur\|Ordnerstruktur]] | Verzeichnisbaum der App |
| [[01 Technik/Architektur/Routing & Seiten\|Routing & Seiten]] | Alle Seiten und API-Routen |
| [[01 Technik/Datenbank/Schema Überblick\|Datenbankschema]] | Tabellen, Beziehungen, RLS |
| [[01 Technik/API/API Überblick\|API Überblick]] | Alle Endpoints auf einen Blick |
| [[01 Technik/State Management\|State Management]] | Zustand-Stores (Cart, Favorites, UI) |
| [[01 Technik/i18n & Lokalisierung\|i18n & Lokalisierung]] | Mehrsprachigkeit (DE/UK) |
| [[01 Technik/Setup/Dev Setup\|Dev Setup]] | Lokale Entwicklungsumgebung |

### 🧠 [[02 Business Logik/Bestellprozess|Business Logik]]
| | |
|---|---|
| [[02 Business Logik/Bestellprozess\|Bestellprozess]] | End-to-End Order Flow |
| [[02 Business Logik/Produktkatalog & Kategorien\|Produktkatalog]] | Kategorien, Designs, Sorten |
| [[02 Business Logik/Warenkorb\|Warenkorb]] | Cart-Logik |
| [[02 Business Logik/Authentifizierung & Rollen\|Auth & Rollen]] | Login, Roles, Admin-Zugang |
| [[02 Business Logik/Admin-Panel\|Admin-Panel]] | Verwaltungsoberfläche |

### 📋 [[03 Projektmanagement/Roadmap|Projektmanagement]]
| | |
|---|---|
| [[03 Projektmanagement/Roadmap\|Roadmap (DE)]] | Module & offene Aufgaben |
| [[03 Projektmanagement/Roadmap (RU)\|Roadmap (RU)]] | То же на русском |
| [[03 Projektmanagement/Abgeschlossene Features\|Abgeschlossene Features]] | Was bereits fertig ist |
| [[03 Projektmanagement/Aktueller Sprint\|Aktueller Sprint]] | Laufende Aufgaben |
| [[03 Projektmanagement/Archivierte Entscheidungen\|Entscheidungen (ADR)]] | Architektur-Entscheide |

### 🎨 [[05 Redesign/00 Redesign – Übersicht|Redesign]]
| | |
|---|---|
| [[05 Redesign/00 Redesign – Übersicht\|Redesign-Übersicht]] | Ziele, Entscheidungen, Routen-IA |
| [[05 Redesign/01 Design-System & Tokens\|Design-System & Tokens]] | Farben, Fonts, Spacing, Shadows |
| [[05 Redesign/02 Navigation, AppShell, Header, Drawer & Footer\|Navigation & AppShell]] | Header, Drawer, Footer |
| [[05 Redesign/10 Startseite (Home)\|Startseite (Home)]] | Neue Hero-Startseite |
| [[05 Redesign/11 Katalog – Übersicht\|Katalog-Übersicht]] | Zwei-Gruppen-Kachelraster |
| [[05 Redesign/12 Katalog – Kategorie-Detail\|Katalog-Detail]] | Sidebar + Produktraster |
| [[05 Redesign/13 Produktdetail\|Produktdetail]] | Split-Layout + Tabs |
| [[05 Redesign/14 Bestellfluss – Bestellsheet & Warenkorb\|Bestellsheet & Warenkorb]] | TorteBestellenModal + ShoppingCart |
| [[05 Redesign/15 Checkout\|Checkout]] | 5-Schritt-Wizard restyled |
| [[05 Redesign/16 Konto – Meine Bestellungen & Profil\|Konto & Bestellungen]] | Account-Bereich |
| [[05 Redesign/17 Admin Panel\|Admin Panel]] | Dark Sidebar + Master-Detail |
| [[05 Redesign/18 Auth & statische Seiten\|Auth & statische Seiten]] | Login, About, Contact, … |
| [[05 Redesign/90 Phase 2 – Preise, Anzahlung & erweiterte Status (Backlog)\|Phase 2 Backlog]] | Preismodell (nicht Phase 1) |

### 🐛 [[04 Issues/Bugs|Issues]]
| | |
|---|---|
| [[04 Issues/Bugs\|Bugs]] | Bekannte Fehler |
| [[04 Issues/Features\|Features]] | Feature-Requests |
| [[04 Issues/Verbesserungen\|Verbesserungen]] | Tech-Debt & Optimierungen |

---

## Kurzreferenz

```bash
# Dev-Server starten (aus apps/web/)
pnpm dev

# Linting
pnpm lint

# DB-Typen neu generieren (nach Schema-Änderungen)
pnpm db:generate

# Migrationen anwenden
pnpm db:migrate

# Supabase Studio öffnen
pnpm db:studio
```

> **Wichtig:** Bei jedem neuen UI-Text immer **beide** Sprachdateien aktualisieren:
> `apps/web/messages/de.json` und `apps/web/messages/uk.json`
