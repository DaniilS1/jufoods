# 00 Redesign – Übersicht

> **Status:** Planung abgeschlossen · Phase 1 großteils umgesetzt (Katalog-Routen, Startseite, Playfair Display, Admin Dark-Sidebar + Master-Detail, Checkout, Konto-Status-Badges) · Rest sind gezielte Einzelpunkte, siehe Verifikations-Checklisten je Notiz — **Stand 2026-08-31, geprüft gegen den Code**
> **Mockups:** `Jufoods-2 2/Jufoods Desktop Mockup.dc.html` (5 Screens, 1280 px) · `Jufoods-2 2/Jufoods Design Mockup.dc.html` (10 Screens, 375 px)

---

## Ziel

Das Redesign verfolgt vier Kernziele:

1. **Startseite** — Eine echte Homepage einführen (heute ist `/[locale]` der Katalog).
2. **Katalog komplett neu gestalten** — Tabs abschaffen, stattdessen ein Zwei-Gruppen-Kartenraster (Torten / Desserts).
3. **Admin-Panel überarbeiten** — Dunkle Sidebar auf Desktop, Tab-Kacheln + aufklappbare Karten auf Mobil.
4. **Mobiloptimierung** — Alles auf 375 px konsequent testen; 44 px Touch-Targets, sichere Bereiche, kein reines Hover.

Das visuelle System ändert sich **nicht grundlegend** — es wird verfeinert: Die bestehenden `.theme-neutral`-Tokens werden präzisiert und **Playfair Display** als Serif-Schrift für Überschriften ergänzt.

---

## Festgelegte Entscheidungen (nicht mehr verhandelbar)

| Thema | Entscheidung |
|---|---|
| Preise, Anzahlung, 7 Status | **Out of Scope** → [[90 Phase 2 – Preise, Anzahlung & erweiterte Status (Backlog)]] |
| Größen (S/M/L) & Tier (Standard/Premium) | **Nicht umgesetzt** — bestehendes Personenanzahl-Feld + flache Geschmacksliste bleiben |
| Katalogtaxonomie | **Config-Schicht, keine Migration** — reale Datenbankwerte, neue `lib/catalogue-sections.ts` |
| Checkout-Felder | **Alle behalten** — nur visuell neu gestalten |

---

## Neue Informationsarchitektur / Routen

```
/[locale]                  →  Startseite (NEU)
/[locale]/catalog          →  Katalog-Übersicht (NEU, zwei Gruppen)
/[locale]/catalog/[section]→  Kategorie-Detail (NEU Route, ersetzt ?category-Param)
/[locale]/products         →  Redirect → /catalog  (bleibt)
/[locale]/products/[slug]  →  Produktdetail  (bleibt, restyled)
/[locale]/checkout         →  Checkout  (bleibt, restyled)
/[locale]/account          →  Konto  (bleibt, restyled)
/[locale]/admin            →  Admin  (bleibt, komplett neu gestaltet)
/[locale]/favorites        →  Favoriten  (bleibt, restyled)
/[locale]/about            →  Über uns  (bleibt, restyled)
/[locale]/contact          →  Kontakt  (bleibt, restyled)
/[locale]/login + auth     →  Auth-Seiten  (bleiben, restyled)
/[locale]/order-success    →  Bestellbestätigung  (bleibt, restyled)
```

### Katalog-Sections-Config (`lib/catalogue-sections.ts`)

Zwei Gruppen mit diesen Karten (Card-IDs = `section`-Parameter in der URL):

**Gruppe Torten**
| Section-ID | Query-Logik | Anzeigename (DE) |
|---|---|---|
| `feier` | `torten_designs` WHERE `sub_category = 'feier'` | Feiertorten |
| `hochzeit` | `torten_designs` WHERE `sub_category = 'hochzeit'` | Hochzeitstorten |
| `bento` | `torten_designs` WHERE `sub_category = 'bento'` | Bento Torten |
| `zum-tee` | `torten_designs` WHERE `sub_category = 'zum-tee'` | Zum Tee |
| `klassische` | `torten_designs` WHERE `classic = true` | Klassische Torten |

**Gruppe Desserts**
| Section-ID | Query-Logik | Anzeigename (DE) |
|---|---|---|
| `desserts` | `products` WHERE `category = 'desserts'` | Desserts |
| `cookies` | `products` WHERE `category = 'cookies'` | Cookies |
| `macarons` | `products` WHERE `category = 'macarons'` | Macarons |
| `cheesecakes` | `products` WHERE `category = 'cheesecakes'` | Cheesecakes |

---

## Alle Notizen in diesem Bereich

| Notiz | Thema |
|---|---|
| [[01 Design-System & Tokens]] | CSS-Tokens, Fonts, Spacing, Status-Badges |
| [[02 Navigation, AppShell, Header, Drawer & Footer]] | Globales Layout-Chrome |
| [[10 Startseite (Home)]] | Neue Startseite |
| [[11 Katalog – Übersicht]] | Zwei-Gruppen-Kachelraster |
| [[12 Katalog – Kategorie-Detail]] | Sidebar + Produktraster / Mobil-Stack |
| [[13 Produktdetail]] | Split-Layout Desktop, Bottom-Sheet Mobil |
| [[14 Bestellfluss – Bestellsheet & Warenkorb]] | TorteBestellenModal + ShoppingCart |
| [[15 Checkout]] | 3-Schritt-Wizard (Angaben/Übersicht/Bestätigt), echte Stepper-Primitive |
| [[16 Konto – Meine Bestellungen & Profil]] | Account-Bereich |
| [[17 Admin Panel]] | Dark Sidebar + Master-Detail |
| [[18 Auth & statische Seiten]] | Login, Register, About, Contact, … |
| [[90 Phase 2 – Preise, Anzahlung & erweiterte Status (Backlog)]] | Preismodell (nicht in Phase 1) |
| [[91 E-Commerce Audit (2026-09-01)]] | System-Audit: was fehlt für den Endnutzer (SEO, Recht, Fehlerseiten, Kontaktformular) |

---

## Phasenplan

### Phase 1 — Dieses Redesign
- Design-System-Tokens + Playfair Display
- Navigation + AppShell
- Startseite (neuer `/[locale]`)
- Katalog (neue Routen `/catalog`, `/catalog/[section]`)
- Produktdetail
- Bestellsheet + Warenkorb
- Checkout (restyle)
- Konto (restyle)
- Admin-Panel (neues Layout)
- Auth + statische Seiten (restyle)

### Phase 2 — Preismodell (Backlog)
Siehe [[90 Phase 2 – Preise, Anzahlung & erweiterte Status (Backlog)]]

---

## Verifikation

- [x] Alle 13 Notizen vorhanden, in Deutsch, mit Standard-Skeleton
- [x] `Home.md` enthält den Abschnitt `05 Redesign`
- [x] Alle `[[wikilinks]]` lösen sich in Obsidian auf
- [x] Jede Notiz referenziert konkrete Dateipfade + Mockup-Screens
- [x] Festgelegte Entscheidungen nirgends verletzt
