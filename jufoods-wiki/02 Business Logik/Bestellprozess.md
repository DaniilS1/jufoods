# Bestellprozess

End-to-End-Ablauf einer Bestellung — vom Warenkorb bis zur Bestätigung.

---

## Überblick

```
Produkt auswählen
    ↓
Warenkorb (Zustand, localStorage)
    ↓
Checkout-Seite (/[locale]/checkout)
    ↓
5-stufiges Formular ausfüllen
    ↓
POST /api/orders
    ↓
Customer anlegen/aktualisieren
    ↓
Order in DB speichern (status: pending)
    ↓
Webhook → n8n (fire-and-forget)
    ↓
Redirect → /order-success
```

---

## Schritt 1: Warenkorb

Nutzer fügt Produkte mit Design-Auswahl zum Warenkorb hinzu. State wird im `localStorage` persistiert (Zustand-Store).

Jede Warenkorb-Position besteht aus:
- `productId` + `designId` (eindeutige Kombination)
- `quantity`, `personCount`, `deliveryDate`, `remarks`

→ Siehe [[../Technik/State Management|State Management]]

---

## Schritt 2: Checkout-Formular (5 Stufen)

Komponente: `components/checkout-client.tsx`

| Stufe | Inhalt |
|---|---|
| **1 — Kundendaten** | Anrede, Vor-/Nachname, E-Mail, Telefon, Wohnort |
| **2 — Bestelldetails** | Anlass, Wunschdatum/-uhrzeit, Bemerkungen |
| **3 — Lieferung** | Abholung oder Lieferung; Lieferadresse |
| **4 — Zusatzinfo** | WhatsApp/Telegram-Einwilligung, alternativer Messenger |
| **5 — Zusammenfassung** | Bestellübersicht vor Absenden |

---

## Schritt 3: Server-Verarbeitung (`POST /api/orders`)

1. **Validierung** — `items` nicht leer, E-Mail oder Name vorhanden
2. **E-Mail normalisieren** — `trim().toLowerCase()`
3. **Customer lookup** — Suche per `email_normalized` in `customers`-Tabelle
4. **Customer anlegen oder aktualisieren:**
   - Neu → `INSERT` mit Name, E-Mail, Telefon, Wohnort
   - Vorhanden → `order_count++`, `last_order_at = now()`
5. **Order anlegen** — `INSERT` in `orders` mit `status = 'pending'`
6. **Line-Items anreichern** — Produkt- und Designnamen per DB-Query auflösen
7. **Webhook feuern** — POST an `ORDER_WEBHOOK_URL` (fire-and-forget)
8. **Antwort** — `{ success: true, orderId }`

→ Technische Details: [[../Technik/API/Orders API|Orders API]]

---

## Schritt 4: Webhook-Benachrichtigung

Wenn `ORDER_WEBHOOK_URL` konfiguriert ist, sendet der Server das vollständige Bestell-Payload an den Webhook (typisch: n8n für automatisierte E-Mails, Slack-Nachrichten etc.).

Das Webhook-Payload enthält:
- Vollständigen Order-Datensatz
- Angereicherte Line-Items (mit aufgelösten Namen)
- Locale (für lokalisierte Benachrichtigungen)

Fehler/Timeout beim Webhook blockieren **nicht** die Bestellbestätigung.

---

## Schritt 5: Bestellbestätigung

Nach erfolgreichem API-Call → Redirect zu `/[locale]/order-success`.

Der Warenkorb wird geleert (`clearCart()`).

---

## Bestellstatus-Lifecycle

```
pending → confirmed → completed
            ↓
         cancelled
```

| Status | Wer setzt es | Bedeutung |
|---|---|---|
| `pending` | System (automatisch) | Neu eingegangen |
| `confirmed` | Admin | Bestätigt, in Bearbeitung |
| `completed` | Admin | Fertig & übergeben |
| `cancelled` | Admin | Storniert |

Status-Update: `PATCH /api/admin/orders/[id]` → [[../Technik/API/Admin API|Admin API]]

---

## Gast vs. eingeloggter Nutzer

| | Gast | Eingeloggt |
|---|---|---|
| Bestellen | ✅ | ✅ |
| Customer-Eintrag | Wird automatisch angelegt | Wird mit `user_id` verknüpft |
| Bestellhistorie im Account | ❌ | ✅ (`/api/account/orders`) |
| Custom-Design hochladen | Anonym via `/api/custom-designs` | Gespeichert in Account |
