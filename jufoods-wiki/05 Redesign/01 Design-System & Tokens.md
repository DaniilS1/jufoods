# 01 Design-System & Tokens

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:** Farbwerte aus `Jufoods Desktop Mockup.dc.html` Footer + Inline-Styles

---

## Ziel

Die bestehenden CSS-Custom-Properties im aktiven **`.theme-neutral`**-Block präzisieren, sodass sie exakt den Mockup-Farben entsprechen. Playfair Display als Serif-Schrift ergänzen. Spacing, Radius und Shadow-Scale explizit festschreiben. Barrierefreiheit sicherstellen (Kontrast ≥ 4,5:1 für Fließtext).

---

## Aktueller Stand (Dateien)

| Datei | Relevanz |
|---|---|
| `apps/web/app/globals.css:85–105` | Aktiver Token-Block `.theme-neutral` |
| `apps/web/app/globals.css:8–34` | Shadcn-Default `:root` (grau, nicht aktiv) |
| `apps/web/app/layout.tsx:2–15` | Nur Inter geladen; `className="theme-neutral"` auf `<html>` |
| `apps/web/tailwind.config.ts:21–63` | Alle Farben → `hsl(var(--*))`, kein `fontFamily`-Override |
| `apps/web/components.json` | `baseColor: neutral`, `style: new-york` |

---

## Ziel-Tokens

### CSS Custom Properties — `.theme-neutral` in `globals.css`

```css
.theme-neutral {
  /* Hintergründe */
  --background:        17 33% 94%;   /* #F5EDEA — warmes Cremeweiß */
  --card:              0  0% 100%;   /* #FFFFFF — Karten */
  --popover:           0  0% 100%;

  /* Text */
  --foreground:        0 17% 20%;    /* #3B2A2A — dunkles Dunkelbraun */
  --card-foreground:   0 17% 20%;
  --popover-foreground:0 17% 20%;

  /* Primär (Rose/Mauve) */
  --primary:           0 23% 70%;   /* #C4A0A0 */
  --primary-foreground:0  0% 100%;  /* weiß auf primary */

  /* Sekundär (dunkles Braun — Admin-Sidebar) */
  --secondary:         0 17% 20%;   /* #3B2A2A */
  --secondary-foreground: 0 0% 100%;

  /* Gedämpft */
  --muted:             17 20% 91%;  /* #EDE5E2 — sehr helles Cremegrau */
  --muted-foreground:  0 14% 54%;   /* #9B7B7B */

  /* Akzent = primary */
  --accent:            0 23% 70%;
  --accent-foreground: 0  0% 100%;

  /* Ränder & Inputs */
  --border:            0 23% 88%;   /* #E8DADA */
  --input:             0 23% 88%;
  --ring:              0 23% 70%;   /* = primary */

  /* Destruktiv */
  --destructive:       0 63% 41%;
  --destructive-foreground: 0 0% 100%;

  /* Radius */
  --radius: 0.75rem;  /* 12 px — passt zu border-radius:14px im Mockup */
}
```

### Nicht-Token-Akzente (nur inline in Hero-Komponenten verwenden)

```
Torten-Hero-Hintergrund:  #C4907A  (bg-[#C4907A])
Desserts-Hero-Hintergrund:#8FB8A2  (bg-[#8FB8A2])
Warnhinweis-Bg:           #F5E6C8  / text #7B5E00
Grüner Status (Bestätigt):#C8E6C9  / text #2E7D32
```

---

## Typografie

### Schriften laden — `apps/web/app/layout.tsx`

```ts
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

// Auf <body> bzw. <html>:
// className={`${inter.variable} ${playfair.variable} theme-neutral`}
```

### `tailwind.config.ts` — `theme.extend`

```ts
fontFamily: {
  sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
  serif:   ['var(--font-playfair)', 'Georgia', 'serif'],
  display: ['var(--font-playfair)', 'Georgia', 'serif'],
},
```

### Typografische Skala (Tailwind-Klassen)

| Rolle | Klasse | Gewicht | Schrift |
|---|---|---|---|
| Hero-Heading H1/H2 | `text-4xl lg:text-5xl` | `font-bold` (700) | `font-display` |
| Section-Heading H2 | `text-2xl lg:text-3xl` | `font-bold` | `font-display` |
| Card-Heading H3 | `text-lg lg:text-xl` | `font-semibold` (600) | `font-display` |
| Fließtext Body | `text-sm lg:text-base` | `font-normal` | `font-sans` |
| Label / Overline | `text-xs tracking-widest uppercase` | `font-bold` | `font-sans` |
| Button-Text | `text-sm` | `font-semibold` | `font-sans` |

---

## Spacing-System

**Basis: 4 px / 8 px**

| Bezeichnung | Tailwind | px |
|---|---|---|
| `space-1` | `p-1` / `gap-1` | 4 |
| `space-2` | `p-2` / `gap-2` | 8 |
| `space-3` | `p-3` / `gap-3` | 12 |
| `space-4` | `p-4` / `gap-4` | 16 |
| `space-6` | `p-6` / `gap-6` | 24 |
| `space-8` | `p-8` / `gap-8` | 32 |
| `space-12` | `p-12` / `gap-12` | 48 |

Vertikaler Abstand zwischen Sektionen: `gap-16` (64 px).
Horizontaler Padding auf Desktop: `px-12` (48 px). Auf Mobil: `px-3` (12 px).

---

## Border-Radius-Skala

```
rounded-sm   → 6 px  (subcategory-pills)
rounded      → 8–9 px (Buttons)
rounded-md   → 10 px (Cards-inner, select)
rounded-lg   → 12 px (ProductCard, Warenkorb-Item)
rounded-xl   → 14 px (grosse Kategorie-Karten)
rounded-2xl  → 16 px (Haupt-Hero-Karten)
rounded-full → 999px (Badges, Avatare)
```

---

## Shadow-Skala

```
shadow-sm    → 0 2px 8px rgba(59,42,42,0.07)   (ProductCard)
shadow       → 0 3px 12px rgba(59,42,42,0.10)  (Kategorie-Karte)
shadow-md    → 0 4px 20px rgba(59,42,42,0.13)  (hover)
shadow-lg    → 0 20px 60px rgba(59,42,42,0.28) (Modals, Mockup-Screens)
shadow-xl    → 0 24px 64px rgba(59,42,42,0.26) (Desktop-Screens)
```

---

## Status-Badge-Farben (Orders)

Wiederverwendung aus `components/account/recent-orders.tsx`:

| Status | Badge-Bg | Badge-Text |
|---|---|---|
| `pending` | `#F5E6C8` | `#7B5E00` |
| `confirmed` | `#C8E6C9` | `#2E7D32` |
| `completed` | `#E8E8E8` | `#555555` |
| `cancelled` | `#FFCDD2` | `#C62828` |

---

## Mobile-Regeln (cross-cutting)

- **Touch-Targets ≥ 44 px** (`min-h-[44px] min-w-[44px]`) für alle klickbaren Elemente.
- **`min-h-dvh`** statt `min-h-screen` (100vh schlägt auf mobilen Browsern mit Adressleiste fehl).
- **`touch-action: manipulation`** auf Buttons, um 300 ms Tap-Delay zu vermeiden → `touch-manipulation` Tailwind-Klasse.
- **Kein hover-only** — alle Interaktionszustände müssen auch per Tap auslösbar sein.
- **Safe Area Insets** für fixed Bottom-Bars: `pb-[env(safe-area-inset-bottom)]`.
- **16 px Mindestschriftgröße** im Fließtext auf Mobil (iOS verhindert Auto-Zoom).

---

## Shadcn-Komponenten (bereits vorhanden, wiederverwenden)

`button` · `badge` · `card` · `dialog` · `drawer` · `dropdown-menu` · `input` · `label` ·
`select` · `separator` · `switch` · `table` · `tabs` / `tabs-animated` · `textarea` ·
`tooltip` · `calendar` · `checkbox` · `radio-group` · `scroll-area` · `avatar`

Neue ggf. per `npx shadcn@latest add <name>` hinzufügen, nicht manuell schreiben.

---

## i18n-Keys (keine neuen — Tokens sind code-only)

---

## Offene Punkte

- [ ] Kontrast `#C4A0A0` auf `#FFFFFF` prüfen → ~2,8:1 → **nicht** für Fließtext verwenden, nur für Buttons mit weißem Text bei genug Hintergrundgröße.
- [ ] `--radius: 0.75rem` bricht `rounded-lg/md/sm` Kalkulation → in `tailwind.config.ts` prüfen.
- [x] Playfair Display Cyrillic-Subset für Ukrainisch sicherstellen.

---

## Abnahme/Verifikation

- [x] `pnpm build` ohne Fehler nach Token-Änderung
- [ ] Visueller Vergleich `globals.css` Tokens vs. Mockup-Farbwerte (Firefox DevTools Eyedropper)
- [x] Playfair Display in Headings auf Desktop + Mobil sichtbar
- [x] Alle Status-Badges in `recent-orders.tsx` korrekt eingefärbt
- [x] `pnpm lint` ohne Fehler
