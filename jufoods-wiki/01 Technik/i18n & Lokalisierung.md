# i18n & Lokalisierung

## Überblick

Mehrsprachigkeit wird über **next-intl** umgesetzt. Zwei Sprachen werden unterstützt:

| Locale | Sprache | Standard? |
|---|---|---|
| `de` | Deutsch | ✅ Ja |
| `uk` | Ukrainisch | Nein |

Alle App-Seiten sind locale-gepräfixt: `/de/...` und `/uk/...`.

---

## ⚠️ Kritische Regel

> **Jeder neue UI-Text muss in BEIDEN Sprachdateien hinzugefügt werden.**
>
> `apps/web/messages/de.json`  
> `apps/web/messages/uk.json`
>
> Niemals nur eine Datei aktualisieren.

---

## Übersetzungsdateien

| Datei | Größe | Inhalt |
|---|---|---|
| `messages/de.json` | ~590 Zeilen | Deutsche Übersetzungen |
| `messages/uk.json` | ~594 Zeilen | Ukrainische Übersetzungen |

### Wichtige Namespaces

| Namespace | Beschreibung |
|---|---|
| `common.*` | Allgemeine UI (cart, login, logout, favorites, ...) |
| `nav.*` | Navigation (catalog, about, contact, Kategorienamen) |
| `product.*` | Produktseite (flavour, ingredients, allergens, design selection) |
| `cart.*` | Warenkorb-Sidebar |
| `order.*` | Checkout-Formular, Felder, Validierungsmeldungen |
| `contactConsent.*` | WhatsApp/Telegram-Opt-In-Texte |

---

## Implementierung

### Konfiguration (`i18n.ts`)

```typescript
export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale)) notFound()
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
```

### Server-Komponenten

```typescript
import { getTranslations } from 'next-intl/server'

// In einer async Server-Komponente:
const t = await getTranslations('product')
return <h1>{t('title')}</h1>
```

### Client-Komponenten

```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('cart')
  return <button>{t('addToCart')}</button>
}
```

---

## Middleware-Routing

`apps/web/middleware.ts` erkennt die Nutzersprache und leitet um:

1. Locale aus URL-Pfad prüfen
2. Falls fehlt: aus `Accept-Language`-Header oder Cookie lesen
3. Redirect zu `/de/...` oder `/uk/...`
4. Ausnahmen (kein Redirect): `/api/*`, `/_next/*`, statische Dateien

---

## Sprache im Admin-Panel & DB

- Produkte haben `name_de` / `name_uk`, `description_de` / `description_uk`, etc. — beide Felder müssen immer befüllt werden
- Nutzer können eine bevorzugte Sprache in `settings.preferred_language` speichern
- Webhooks enthalten den `locale`-Parameter, damit externe Systeme (n8n) lokalisierte E-Mails versenden können

---

## Sprachauswahl im Frontend

Komponente: `components/language-switcher.tsx` — Wechselt zwischen `/de/...` und `/uk/...` mit gleicher Pfad-Struktur.
