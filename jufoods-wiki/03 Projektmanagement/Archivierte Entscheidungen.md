# Archivierte Entscheidungen (ADR)

Wichtige Architektur- und Design-Entscheidungen mit Begründung.

---

## ADR-001: Separate Tabellen für Torten vs. Produkte

**Datum:** 2025-02  
**Status:** Umgesetzt

**Entscheidung:** Torten erhalten eigene Tabellen (`torten_designs`, `torten_flavours`) statt `products`.

**Begründung:** Torten haben eine fundamentell andere Struktur — ein Design kann mehrere Füllungsoptionen haben, Füllungen sind global geteilt (nicht design-spezifisch). Das passt nicht in das einfache `products`-Schema.

**Konsequenz:** Zwei Datenpfade für Produktdetail-Seiten (Torten vs. alles andere).

---

## ADR-002: Guest-first Bestellprozess

**Datum:** 2026-03  
**Status:** Umgesetzt

**Entscheidung:** Bestellungen sind ohne Account möglich. `customers`-Tabelle ist unabhängig von `users`.

**Begründung:** Niedrige Einstiegshürde für Erstkunden. Viele Käufer wollen keinen Account anlegen.

**Konsequenz:** Customer-Deduplizierung per normalisierter E-Mail. Verbindung zu `users` optional.

---

## ADR-003: Zustand (Zustand-Library) für Client-State

**Datum:** Projektstart  
**Status:** Umgesetzt

**Entscheidung:** Zustand statt Redux oder Context für Warenkorb/Favoriten.

**Begründung:** Minimal, kein Boilerplate, localStorage-Persistenz eingebaut. Für diesen Use-Case ausreichend.

---

## ADR-004: next-intl für Mehrsprachigkeit

**Datum:** Projektstart  
**Status:** Umgesetzt

**Entscheidung:** next-intl mit Locale-Prefix-Routing (`/de/...`, `/uk/...`).

**Begründung:** Natives Next.js-App-Router-Support, sauberes URL-Schema, SSR-kompatibel.

---

## ADR-005: Supabase als vollständiges Backend

**Datum:** Projektstart  
**Status:** Umgesetzt

**Entscheidung:** Supabase für Datenbank, Auth und Storage — remote-only.

**Begründung:** Schnelle Entwicklung, RLS für Security, kein eigener Auth-Server, kostengünstiges Hosting für diesen Scale.

---

## ADR-006: Webhook (fire-and-forget) für Bestellbenachrichtigungen

**Datum:** 2026-06  
**Status:** Umgesetzt

**Entscheidung:** Order-Benachrichtigungen via konfigurierbarem Webhook an externe Automation (n8n).

**Begründung:** Trennung von Order-Processing und Benachrichtigungslogik. n8n kann E-Mails, Slack, Telegram etc. übernehmen ohne App-Code zu ändern. Fehler beim Webhook blockieren nicht die Bestellbestätigung.

---

_Neue Entscheidungen am Anfang der Liste hinzufügen, mit Datum und Status._
