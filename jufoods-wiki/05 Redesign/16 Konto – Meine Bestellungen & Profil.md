# 16 Konto – Meine Bestellungen & Profil

> **Elternotiz:** [[00 Redesign – Übersicht]]
> **Mockup-Referenz:**
> - Mobile Screen 09 — „Meine Bestellungen"
> - Desktop: kein eigener Account-Screen im Mockup — Design-System anwenden

---

## Ziel

Den Account-Bereich restylen:

- **Meine Bestellungen** → Status-Filter-Chips + aufklappbare Bestellkarten (exakt Screen 09).
- **Profil / Passwort / Designs** → Token-konform restyled, mobilfreundlich.

---

## Aktueller Stand (Dateien)

| Datei | Funktion |
|---|---|
| `apps/web/app/[locale]/account/page.tsx` | Server-Guard: redirect → login; rendert AccountClient |
| `apps/web/components/account/account-client.tsx` | Sidebar-Nav (Desktop) / Horizontal-Nav (Mobil) + 4 Abschnitte |
| `apps/web/components/account/recent-orders.tsx` | Bestell-Liste mit Status-Badges |
| `apps/web/components/account/profile-form.tsx` | Profil-Formular (Name, Telefon, Einstellungen) |
| `apps/web/components/account/password-form.tsx` | Passwort ändern |
| `apps/web/components/account/design-upload.tsx` | Eigene Designs hochladen (custom_designs) |

---

## Ziel-Layout

### Mobile — Screen 09: Meine Bestellungen (375 px)

```
[HEADER 56px: ← | Meine Bestellungen | Avatar]
[Filter-Chips: 🕐 Preis ausstehend | ✅ Bestätigt | 🎂 Produktion | 📦 Abholbereit]
  ← horizontal scrollbar, ohne scrollbar-thumb
┌────────────────────────────────────────┐
│  JF-2025-001          [✅ Bestätigt]   │
│  Sommergarten                          │  ← Playfair
│  M · Vanille & Erdbeere               │
│  📅 15.07.2025                        │  [Preis / –]  [∨]
├────────────────────────────────────────┤  ← aufgeklappt:
│  (Detailzeilen: Produkt, Größe…)       │
└────────────────────────────────────────┘
```

**Filter-Chips:**
```tsx
const statusChips = [
  { status: 'pending',   label: '🕐 Preis ausstehend', bg: '#F5E6C8', color: '#7B5E00' },
  { status: 'confirmed', label: '✅ Bestätigt',        bg: '#C8E6C9', color: '#2E7D32' },
  // 'in_production', 'ready_for_pickup' → Phase 2 (neue Status)
  // Phase 1 filter: pending / confirmed / completed / cancelled
  { status: 'completed', label: '✔️ Abgeschlossen',    bg: '#E8E8E8', color: '#555555' },
  { status: 'cancelled', label: '✖ Storniert',         bg: '#FFCDD2', color: '#C62828' },
]
```

Klick auf Chip → filtert Liste (client-seitiger State in `account-client.tsx` oder
`recent-orders.tsx`).

**Bestell-Karte:**
- `bg-white border border-border rounded-2xl overflow-hidden shadow-sm`
- Summary-Zeile (immer sichtbar): Order-ID + Status-Badge + Produktname + Parameter + Datum + ggf. Preis + Chevron `▾/▴`.
- `onClick` → `isExpanded` toggeln.
- Expanded-Bereich (Phase 1):

```
Produkt:       [Produktname]
Größe / Pers.: [Personenanzahl / Flavour]
Abholdatum:    [Datum]
Preis:         [–]  ← kein Preis in Phase 1
```

### Desktop

Sidebar-Navigation (4 Tabs: Profil / Passwort / Designs / Bestellungen) bleibt links.
Inhaltsbereich rechts: Bestellungen-Abschnitt erhält Status-Filter-Chips + aufklappbare Karten (wie Mobil).
Profil/Passwort/Designs: Token-konform restyled.

---

## Komponenten (ändern)

### `recent-orders.tsx` — Änderungen

1. **Status-Filter-Chips** als horizontale scrollbare Zeile über der Liste.
2. **Filter-State:** `useState<string | null>(null)` für aktiven Status-Filter.
3. **Aufklappbare Karten** statt aktuelle Tabellenzeilen (Toggle per `expandedOrderId`-State).
4. **Status-Badge-Farben** aus [[01 Design-System & Tokens]].
5. **Kein Preis** (Phase 1) — Preis-Spalte zeigt „–".

### `account-client.tsx` — Änderungen

- Sidebar (Desktop): Token-Farben; aktiver Tab `bg-primary/15 text-foreground font-semibold`.
- Horizontal-Nav (Mobil): als Pills-Zeile mit horizontalem Scroll.
- Layout: `min-h-dvh`, mobile-safe-area-Padding.

### `profile-form.tsx`, `password-form.tsx`, `design-upload.tsx` — Restyle

- Input-Felder: `min-h-[44px]`, `border-input`, `rounded-lg`.
- Submit-Button: `bg-primary text-white`.
- Labels: immer sichtbar.
- Error-Messages: unter dem Feld.

---

## i18n-Keys

```jsonc
"account": {
  "orders": {
    "filterAll":     "Alle",
    "expandDetails": "Details",
    "collapseDetails":"Schließen"
  },
  "orderStatus": {
    "pending":   "🕐 Preis ausstehend",
    "confirmed": "✅ Bestätigt",
    "completed": "✔️ Abgeschlossen",
    "cancelled": "✖ Storniert"
  }
}
```

---

## Offene Punkte

- [x] Status-Chips `in_production` / `ready_for_pickup` → nicht in Phase 1 (DB kennt diese Status nicht). Bewusst weggelassen, in Phase 2 nachrüsten.
- [ ] Paginierung der Bestell-Liste bei vielen Bestellungen?
- [ ] Design-Upload-Abschnitt: visuell restyled, Funktionalität unverändert.
- [ ] Avatar-Initials im Header-Avatar: aus `full_name` ableiten.

---

## Abnahme/Verifikation

- [x] `/[locale]/account` → redirect zu `/login` wenn nicht eingeloggt
- [x] Eingeloggt: Account-Client lädt korrekt
- [x] Status-Filter-Chips filtern Bestellliste
- [x] Bestellkarte: aufklappbar, zeigt Detailzeilen
- [x] Status-Badges korrekt eingefärbt (pending=#F5E6C8, confirmed=#C8E6C9, …)
- [x] Mobil: alle Felder 44px Höhe, horizontale Chip-Scrollbar
- [x] Profil speichern funktioniert (API `account/profile`)
- [x] Passwort ändern funktioniert (API `account/password`)
- [x] `pnpm lint` + `pnpm build` ohne Fehler
