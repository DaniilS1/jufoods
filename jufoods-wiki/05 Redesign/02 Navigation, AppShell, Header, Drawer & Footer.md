# 02 Navigation, AppShell, Header, Drawer & Footer

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:** Desktop Screen 00–04 (Header) · Mobile Screen 00–09 (Header + Drawer)
> **Abhängigkeit:** [[01 Design-System & Tokens]] muss zuerst umgesetzt sein

---

## Ziel

Das globale Layout-Chrome restylen, sodass es dem Mockup entspricht:

- **Desktop-Header:** Logo links · Navigation (Katalog + 2–3 Seiten) zentriert · Icons (Suche, Favoriten, Warenkorb, Account) rechts · 64 px Höhe · weißer Hintergrund mit 1 px Border.
- **Mobil-Header:** Hamburger + Logo links · Favoriten + Warenkorb + Account rechts · 56 px Höhe.
- **Drawer (Mobil):** gleiche Funktion, neues visuelles Design.
- **Footer:** Marken-Beschreibung + Kategorie-Links + Kontakt.

Die bestehende **5-Kategorien-Nav in der Header-Unterzeile** wird abgeschafft. Navigation zeigt stattdessen: **Katalog** (→ `/catalog`) + **Über uns** + **Kontakt** (Desktop) und im Drawer für Mobil.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/components/app-shell.tsx` | Wrapper: Header + main + Footer + ShoppingCart + NavigationDrawer |
| `apps/web/components/header.tsx` | Sticky Header, 2 Zeilen: Top (Logo/Icons) + Bottom (Kategorien-Nav) |
| `apps/web/components/navigation-drawer.tsx` | Linke Drawer-Navigation (Vaul) |
| `apps/web/components/footer.tsx` | 4-Spalten-Footer |
| `apps/web/components/logo.tsx` | Logo-Bild (IMG_4472.PNG, next/image) |
| `apps/web/components/search-bar.tsx` | Suchfeld (Desktop, Header Top-Zeile) |
| `apps/web/components/admin-tabs.tsx` | Wird im Header auf Admin-Seiten gerendert |

---

## Ziel-Layout

### Desktop-Header (1280 px, 64 px Höhe)

```
[Logo + "Jufood.s"]    [Katalog] [Über uns] [Kontakt]    [🔍] [♡] [🛒²] [J-Avatar]
← 48 px padding                flex:1 center                        → 48 px padding
```

- Logo: `IMG_4472.PNG` 40×40 px rund + `font-display text-lg font-bold text-foreground`.
- Aktive Nav-Seite: `bg-primary/12 rounded-lg font-semibold border-b-2 border-primary`.
- Icons: 40×40 px runde Ghost-Buttons (`variant="ghost" size="icon"`).
- Warenkorb-Badge: 16×16 px, `bg-primary text-white text-[9px]`.
- Account-Avatar: 38×38 px rund, `bg-primary/18 text-primary font-bold`.
- `/admin`-Seiten: Header bleibt, die Admin-Sidebar im Seiteninhalt übernimmt die Sub-Navigation (Admin-Tabs werden aus dem Header entfernt).

### Mobil-Header (375 px, 56 px Höhe)

```
[☰ Hamburger] [Logo rund 36px]     [♡] [🛒²] [J-Avatar]
← 16 px padding                              → 16 px padding
```

Keine Kategorie-Zeile im Header auf Mobil. Alles über Drawer.

### Drawer (Mobil)

Dunkler Header-Bereich: `bg-secondary` (= `#3B2A2A`) mit Logo + Benutzername.

Nav-Links (Vaul left-drawer):
1. Startseite → `/[locale]`
2. Katalog → `/[locale]/catalog`
3. Torten → `/[locale]/catalog/feier` (direkt in die erste Torten-Section)
4. Über uns → `/[locale]/about`
5. Kontakt → `/[locale]/contact`
6. Favoriten → `/[locale]/favorites`
7. Mein Konto / Meine Bestellungen → `/[locale]/account`
8. Admin (nur wenn `role === 'admin'`) → `/[locale]/admin`

Sprache-Switcher (DE/UK) am unteren Rand.
Eingeloggt: Account-Dropdown mit Name + Avatar + Abmelden.
Gast: Login / Registrieren.

### Footer

4-Spalten-Grid auf Desktop, gestapelt auf Mobil:
- **Spalte 1:** Logo + kurze Beschreibung + Social-Links (Facebook, Instagram).
- **Spalte 2:** Katalog — Links zu allen Torten-Sections + Desserts.
- **Spalte 3:** Seiten — Über uns, Kontakt, Favoriten.
- **Spalte 4:** Kontakt — E-Mail, Telefon, Standort München.
- Bottom-Bar: `© Jufood.s 2025` + `<LanguageSwitcher>` + Datenschutz/Impressum-Links.

---

## Komponenten (ändern / neu)

### `header.tsx` — Änderungen

1. **Bottom-Zeile (Kategorien-Nav) entfernen.** Die `?category=`-Links fallen weg, da der Katalog jetzt eigene Routen hat.
2. **Top-Zeile anpassen:** Logo-Größe, neue Nav-Links (Katalog, Über uns, Kontakt), Active-State per `usePathname`.
3. **`<AdminTabs>` aus dem Header entfernen.** Admin-Navigation in Sidebar des Admin-Panels.
4. Checkout-Seite: minimaler Header (Logo + zurück-Pfeil) bleibt wie heute.

### `navigation-drawer.tsx` — Änderungen

- Neue Link-Liste (s. oben).
- Dunkler Header-Bereich mit `bg-secondary`.
- `usePathname` für aktiven Link-Status.

### `footer.tsx` — Änderungen

- Spalte 2 verlinkt jetzt `/catalog/{section-id}` statt `/?category=...`.
- Inhaltliche Anpassungen an neue IA.

### `logo.tsx` — keine Änderungen nötig

### `app-shell.tsx` — minimal

Dev-Banner kann bleiben; keine strukturellen Änderungen.

---

## i18n-Keys

Neue Keys (beide Dateien `messages/de.json` + `messages/uk.json`):

```jsonc
"nav": {
  "catalog":  "Katalog",          // existiert ggf. schon als nav.products
  "home":     "Startseite",
  "about":    "Über uns",
  "contact":  "Kontakt",
  "favorites":"Favoriten",
  "account":  "Mein Konto",
  "admin":    "Admin-Panel",
  "logout":   "Abmelden",
  "login":    "Anmelden",
  "register": "Registrieren"
}
```

---

## Offene Punkte

- [x] Entscheiden ob Admin-Seiten noch den vollen Header erhalten oder einen reduzierten (nur Logo + Logout). → Admin-Seiten erhalten vollen Header, eigene Sidebar-Navigation im Inhalt.
- [ ] `<SearchBar>` auf Mobil: Im Drawer oder als eigener Screen? Mockup zeigt in der Katalog-Übersicht ein Suchfeld → vorerst nur in der Desktop-Header-Zeile + im Katalog.
- [x] Breakpoint `lg:` (1024 px) oder `xl:` (1280 px) für Desktop-Header-Nav? → `lg:` umgesetzt.

---

## Abnahme/Verifikation

- [x] Desktop: Header mit Logo + 3 Nav-Links + 4 Icons korrekt zentriert
- [x] Mobil (375 px): Hamburger + Logo + 3 Icons sichtbar; keine 2. Header-Zeile
- [x] Aktiver Nav-Link visuell hervorgehoben (Startseite, Katalog, Über uns, Kontakt)
- [x] Drawer öffnet und zeigt alle Links; Sprach-Switcher funktioniert
- [x] Admin-Seiten: keine AdminTabs im Header; Sidebar-Navigation im Inhalt
- [ ] Checkout-Seite: minimaler Header
- [x] Footer: alle Spalten sichtbar; Kategorie-Links zeigen auf `/catalog/[section]`
- [x] `pnpm lint` ohne Fehler
