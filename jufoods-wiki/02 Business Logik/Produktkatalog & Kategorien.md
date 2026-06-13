# Produktkatalog & Kategorien

## Zwei Produkt-Typen

Jufoods hat zwei separate Datenbankstrukturen für Produkte:

| Typ | Tabelle | Für |
|---|---|---|
| **Reguläre Produkte** | `products` | Desserts, Cookies, Cheesecakes, Macarons |
| **Torten** | `torten_designs` + `torten_flavours` | Bestellbare Torten mit Design- und Füllungsauswahl |

Torten sind komplexer: Ein Design kann mehrere Füllungsoptionen haben (n:m über `design_flavour`).

---

## Kategorien & Unterkategorien

### torten

| Unterkategorie | Beschreibung |
|---|---|
| `feier` | Geburtstage, Jubiläen, allgemeine Feiern |
| `hochzeit` | Hochzeitstorten |
| `bento` | Kleine Bento-Torten im japanischen Stil |
| `zum-tee` | Kleine Torten, ideal zum Tee |

### desserts

| Unterkategorie | Beschreibung |
|---|---|
| `tarts` | Tartes |
| `cinabons` | Zimtschnecken |
| `kulichi` | Ukrainische Osterkuchen |
| `kapkeiky` | Cupcakes |
| `cake-pops` | Cake Pops |
| `mousse` | Mousse-Desserts |

### cheesecakes

| Unterkategorie | Beschreibung |
|---|---|
| `new-york` | New York Style |
| `san-sebastian` | San Sebastián (gebrannter Käsekuchen) |
| `cheesecake-on-a-stick` | Käsekuchen am Stiel |

### cookies

| Unterkategorie | Beschreibung |
|---|---|
| `chocolate` | Schokoladenplätzchen |
| `blondie-cookies` | Blondie-Variante |

Konfigurationsdatei: `apps/web/lib/subcategory-config.ts`

---

## Produktdetail-Seite

URL: `/[locale]/products/[slug]`

### Für reguläre Produkte:
- Produktbilder (Slider)
- Beschreibung, Zutaten, Allergene
- Design-Auswahl (aus `available_designs` JSONB)
- "In den Warenkorb"-Button

### Für Torten (`torten_designs`):
- Design-Informationen
- Liste verfügbarer Füllungen (`torten_flavours` via `design_flavour`)
- Füllungs-Auswahl mit Zutaten/Allergenen/Nährwerten
- Anpassungsoptionen (Personenzahl, Wunschdatum)

→ Aktuell in Überarbeitung — siehe [[../03 Projektmanagement/Roadmap|Roadmap]]

---

## Bilder

Alle Produktbilder liegen in Supabase Storage (Bucket `bilder`).

| Feld | Beschreibung |
|---|---|
| `image_url` | Hauptbild |
| `images_urls` | Array weiterer Bilder (für Slider) |

Fallback wenn kein Bild: `/public/placeholder-cake.svg`

URL-Normalisierung: `lib/image-utils.ts`

---

## Admin-Verwaltung

Produkte und Designs werden im Admin-Panel verwaltet:

| Komponente | Zweck |
|---|---|
| `admin-product-management.tsx` | CRUD für `products` |
| `admin-design-management.tsx` | CRUD für `torten_designs` |
| `admin-flavour-management.tsx` | CRUD für `torten_flavours` |

API-Endpunkte: `/api/products`, `/api/designs` → [[../Technik/API/Products & Designs API|Products & Designs API]]
