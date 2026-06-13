
**For: Design Agent | Site: jufoods-sweets.com**

-----

## 0. Overview & Goal

The site’s primary job is conversion: **visitor → buyer**. Not a brochure — a shop.

**Core user flow:**

> Customer arrives → finds product → submits order → receives price calculation → pays deposit → order confirmed.

Design must be clean, image-forward, and frictionless. No heavy text, no complex navigation trees.

-----

## 1. Existing Design System (Extract from App Screenshot)

The app already has an established look. The design agent **must extend this system**, not replace it.

### 1.1 Color Palette (from screenshot)

|Role                  |Description           |Approximate Hex      |
|----------------------|----------------------|---------------------|
|Background            |Warm blush/rose white |`#F5EDEA`            |
|Surface/Card          |White                 |`#FFFFFF`            |
|Primary Text          |Dark warm brown       |`#3B2A2A`            |
|Secondary Text / Label|Muted rose-brown      |`#9B7B7B`            |
|Accent / Badge        |Dusty mauve/rose      |`#C4A0A0`            |
|Border / Divider      |Soft rose-grey        |`#E8DADA`            |
|Active Tab Pill       |White pill on blush bg|`#FFFFFF` with shadow|
|Icon tint             |Warm brown            |`#7A5C5C`            |

### 1.2 Typography (inferred from screenshot)

- **Category label** (e.g., “TORTEN”): Small caps or uppercase, tracking wide, muted rose-brown, ~11px
- **Product name**: Bold serif or semi-bold, dark brown, ~22px
- **Description**: Regular weight, warm grey, ~14px
- **Tab labels**: Medium weight, ~13–14px

### 1.3 Existing Components (reuse these)

**Navigation tabs** — horizontal scrollable pill row

- Active: white pill with subtle shadow
- Inactive: text-only, no background
- Icons + label
- Scrolls horizontally on mobile

**Product card** — 2-column grid

- Square/tall image fills top, rounded corners (~12px)
- Floating heart icon (wishlist) top-right of image
- Below image: small all-caps category label, bold product name (truncated with …), short description (truncated)
- Card has white background, soft shadow

**Header bar**

- Hamburger menu (left) → Logo (center-left, round) → Wishlist icon + cart icon + user avatar (right)
- Cart shows badge count

**Sub-filter row** (below main tabs)

- Pill buttons: “All”, “Thematic”, “Wedding”, “Bento”, etc.
- Active pill: outlined/bordered

**Toggle filter** (Designs / Flavours toggle)

- Two-button toggle strip, centered above grid

**Floating action button** — bottom-right corner, rose/mauve

- Contains + and ∨ icons

-----

## 2. Site Structure (All Pages)

```
/                          → Home
/cakes                     → Cakes section
  /cakes/birthday          → Birthday Cakes gallery
  /cakes/occasions         → Special Occasions (order form only, no gallery)
  /cakes/bento             → Bento Cakes gallery
  /cakes/tiered            → Tiered / Wedding Cakes gallery
  /cakes/classic           → Classic Cakes (fixed price, by weight)
/desserts                  → Desserts section
  /desserts/macarons       → Macarons
  /desserts/cookies        → Cookies
  /desserts/tubochky       → Tubochky (cream rolls)
  /desserts/zephyr         → Zephyr (marshmallow)
  /desserts/pavlova        → Pavlova
/flavours                  → Flavour catalogue
/cart                      → Cart
/account                   → Customer account (orders, statuses)
/admin                     → Admin panel (owner only)
```

-----

## 3. Page-by-Page Specification

-----

### 3.1 Home Page `/`

**Purpose:** Orient the visitor instantly, send them to the right section.

**Header (sticky, all pages):**

- Logo: Jufood.s — large, round, centered-left (existing style)
- Left: hamburger menu
- Right: Wishlist heart + Cart (with badge) + Login/Avatar
- Contact strip above header (desktop only): phone, email, Instagram, Facebook

**Hero Section:**
Two large photo-buttons side by side, full width:

- 🎂 **Cakes** — tapping navigates to `/cakes`
- 🍰 **Desserts** — tapping navigates to `/desserts`

Each button: tall card with full-bleed photo, overlay gradient at bottom, label in bold white text centered.

**About Section (below hero):**

- Short text: who is the baker, what she makes, her location
- Keep to 3–4 sentences max
- Soft background, no heavy design

**How to Order:**
Simple 4-step flow (icon + one-line text each):

1. Browse the catalogue
2. Choose your product and fill in the form
3. Receive a price quote from us
4. Pay the deposit to confirm

**Footer** (see section 3.9)

-----

### 3.2 Cakes Section `/cakes`

**Layout:** Uses existing tab/filter system from screenshot.

**Main category tabs** (horizontal scroll row, existing pill style):

- 🎂 Birthday
- 🎉 Occasions
- 🏆 Bento
- 💍 Tiered / Wedding
- ☕ Classic

**Sub-filter row** (when in Birthday tab):

- All | Children’s | Women’s | Men’s

**Toggle** (existing Design/Flavour toggle):

- Designs → shows photo gallery grid
- Flavours → shows flavour cards with details

**Product card grid:** 2-column, existing card component (photo + category label + name + short description + heart)

**Tapping a card:** Opens product detail modal or page (see 3.5)

-----

### 3.3 Birthday Cakes `/cakes/birthday`

Gallery of birthday cakes in 2-column grid.

Sub-filters: All / Children’s / Women’s / Men’s

Each card shows: photo, name. On tap → product detail with order button.

-----

### 3.4 Special Occasions `/cakes/occasions`

**No gallery** (limited photos available). Instead: a single page with a description and an order form.

**Text block (Ukrainian, keep as-is):**

> “I will gladly make a custom cake for any important occasion:
> Mother’s Day, Father’s Day, Christening, First Communion, Graduation, First Day of School (Einschulung), Gender Reveal Party, Corporate Event, Anniversary, Easter, Christmas, New Year, Valentine’s Day, Family Celebration, and any other event special to you.”

**Order form fields:**

- Filling / Flavour (dropdown or text)
- Number of guests
- Cake design / description (text area)
- Event date (date picker)
- Pick-up date & time (date + time picker)
- Delivery method: Self-pickup / Delivery (if delivery → address field)
- Preferred contact: WhatsApp / Telegram / Email (radio)
- Photo upload (reference image, optional)
- Comment (text area)

**After submission:**
Show status badge: **“Awaiting price calculation”**

-----

### 3.5 Bento Cakes `/cakes/bento`

Separate gallery of bento cakes. Same layout as birthday cakes. Same order flow on tap.

-----

### 3.6 Tiered / Wedding Cakes `/cakes/tiered`

Gallery only — no sub-categories needed.

-----

### 3.7 Classic Cakes `/cakes/classic`

Cakes without custom design. Treated like a flavour/menu catalogue.

Available items (fixed menu):

1. Honey Cake (Medivnyk)
2. Napoleon
3. Kyiv Cake
4. Esterházy
5. Kyiv-style Cake

Each item: photo + name + fixed price displayed.

**Size selector for items 1, 2, 3:**

- S → 1 kg
- M → 2 kg
- L → 3 kg

**Order button:** “Order” → mini-form: size, pick-up date & time, comment.

-----

### 3.8 Product Detail / Order Flow (Modal or Page)

Triggered by tapping any cake card (except Classic and Occasions).

**Layout:**

- Large photo at top
- Name (full, not truncated)
- Description / composition / allergens / nutrition info (KBZHU) — in a collapsible or tab format
- “Order” button

**Two interaction points on card:**

- Tap the **photo** → view full info (description, ingredients, allergens, nutrition)
- Tap **“Order”** button (below photo) → opens order form

**Order form (for custom cakes):**

- Flavour (Standard 12 options / Premium 6 options — selector, no prices shown)
- Size:
  - Standard flavours: S (5–6 persons) / M (10–12) / L (15–20)
  - Premium flavours: M only (10–12 persons)
- Pick-up date & time
- Photo upload (reference or custom idea)
- Comment

**Pricing note** (shown instead of price):

> “Price depends on the number of guests, chosen flavour, and decoration.”

**Flavour tiers:**

- ⭐ Premium (6 flavours) — no price shown
- ✅ Standard (12 flavours) — no price shown

-----

### 3.9 Desserts Section `/desserts`

**Category tabs** (horizontal scroll, existing pill style):

- Macarons
- Cookies
- Tubochky (Cream Rolls)
- Zephyr (Marshmallow)
- Pavlova

**For Macarons, Cookies, Zephyr:** Multiple flavours available → shown within the product card (flavour selector chips or dropdown inside the card or on detail page).

**For Tubochky and Pavlova:** No sub-flavours needed — one product card each, flavours listed as text inside the card.

**Dessert product card:**

- Photo
- Name
- Description
- Quantity per box (e.g., “12 pieces per box”)
- “Add to cart” button

Desserts can be added directly to cart (no manual price calculation needed — prices are fixed or visible).

-----

### 3.10 Cart `/cart`

**Supports mixed cart:** cakes + desserts simultaneously.

**Behaviour:**

- Desserts: price calculated immediately, shown in cart total
- Custom cakes: added to cart with status **“Awaiting price calculation”** — no price shown until admin responds

**Cart item row:**

- Product photo (small thumbnail)
- Name + chosen parameters (size, flavour, date)
- Quantity control (for desserts)
- Remove button

**Cart total:**

- Desserts: subtotal shown
- Cakes: “Price TBD” label
- CTA: “Submit Order”

**After order submission:**
Full order status displayed: **“Awaiting price calculation”**

If **desserts only** in cart → option to pay immediately or place pre-order.

-----

### 3.11 Customer Account `/account`

Requires login / registration.

**Sections:**

- **My Orders** — list of past and active orders
- Each order shows:
  - Order ID
  - Date placed
  - Items ordered
  - Chosen parameters
  - Status badge (see statuses below)
  - Price (once calculated)

**Order Statuses:**

- 🕐 Awaiting price calculation
- 💬 Price sent — awaiting confirmation
- 💳 Awaiting deposit
- ✅ Confirmed (deposit received)
- 🎂 In production
- 📦 Ready for pickup / Delivery arranged
- ✔️ Completed

-----

### 3.12 Admin Panel `/admin`

Owner-only, password-protected.

**Order list view — per order shows:**

- Customer name
- Phone number
- Email
- Preferred contact method
- Pick-up / delivery date
- Order composition (products + parameters)
- Customer comments
- Uploaded reference photos (downloadable)
- Current status

**Admin actions per order:**

- Change order status (dropdown)
- Enter calculated price
- Mark deposit as received
- Add internal notes

**Simplified alternative** (if technically complex): Use a Google Sheet / Notion database connected via webhook, where each new order auto-populates a row. Admin updates the row, customer is notified by email/WhatsApp. This is the fallback option — note it in implementation.

-----

### 3.13 Footer (All Pages)

Displayed on every page, same style.

**Columns (desktop) / stacked (mobile):**

**Contact:**

- Phone (clickable)
- Email (clickable)
- Instagram icon + link
- Facebook icon + link

**About:**

- Short bio: who the baker is, what Jufood.s makes
- Description of services

**How to Order:**

- 4-step summary

**Legal (bottom bar):**

- Impressum (link)
- Datenschutz / Privacy Policy (link)
- © Jufood.s 2025

-----

## 4. Navigation Map

```
Header (sticky, all pages):
  [☰] [Logo] .............. [♡] [🛒 1] [👤]

Main section tabs (horizontal scroll):
  [🎂 Cakes] [🍰 Desserts] [🍪 Cookies] [○ Macarons] ...

Sub-category row (context-sensitive):
  Cakes selected → [All] [Birthday] [Occasions] [Bento] [Tiered] [Classic]
  Desserts selected → [All] [Macarons] [Cookies] [Tubochky] [Zephyr] [Pavlova]

Design/Flavour toggle (Cakes section only):
  [ Designs ] [ Flavours ]
```

-----

## 5. Key UX Rules

1. **Photos first.** Every category and product is anchored by a photo, not text.
2. **One primary action per screen.** Don’t show two heavy CTAs at once.
3. **No price until calculated.** Custom cake cards never show a price — only the note about quote-based pricing.
4. **Flavour info on tap.** Tapping the cake photo opens info. Tapping “Order” opens the order form. These are two distinct interactions.
5. **Status always visible.** After any order submission, the customer sees a clear status badge.
6. **Cart is always accessible.** Sticky header with cart badge at all times.
7. **Mobile first.** All layouts must work on 375px width as the primary target. Navigation must scroll horizontally, not wrap.
8. **No form fatigue.** Order forms use dropdowns, date pickers, and radio buttons — not free text where avoidable.

-----

## 6. Design Tokens (extend existing system)

```
--color-bg:          #F5EDEA   /* blush background */
--color-surface:     #FFFFFF   /* card / modal background */
--color-border:      #E8DADA   /* dividers */
--color-text-primary:#3B2A2A   /* headings, product names */
--color-text-muted:  #9B7B7B   /* labels, descriptions */
--color-accent:      #C4A0A0   /* buttons, badges, active states */
--color-accent-dark: #A07878   /* hover / pressed state */
--color-status-wait: #F5E6C8   /* awaiting calculation badge bg */
--color-status-ok:   #C8E6C9   /* confirmed badge bg */

--radius-card:   12px
--radius-pill:   999px
--radius-modal:  20px

--shadow-card:   0 2px 8px rgba(59,42,42,0.08)
--shadow-header: 0 1px 4px rgba(59,42,42,0.06)

--font-display:  [existing serif/bold — match screenshot]
--font-body:     [existing regular — match screenshot]
--font-label:    uppercase, letter-spacing: 0.08em, 11px
```

-----

## 7. Page Templates Summary

|Page     |Layout                                |Key Components                  |
|---------|--------------------------------------|--------------------------------|
|Home     |Hero 2-col buttons + about + how-to   |Photo buttons, footer           |
|Cakes    |Tab + sub-filter + toggle + 2-col grid|Existing nav system             |
|Birthday |2-col grid with sub-filters           |Product cards                   |
|Occasions|Full-width form page                  |Text block + order form         |
|Bento    |2-col grid                            |Product cards                   |
|Tiered   |2-col grid                            |Product cards                   |
|Classic  |List/grid with price + size           |Price label, size selector      |
|Desserts |Tab + 2-col grid                      |Product cards with “Add to cart”|
|Cart     |Full-width list                       |Cart rows, status, submit CTA   |
|Account  |List of orders                        |Status badges, order details    |
|Admin    |Table/list of all orders              |Status editor, price input      |
|Footer   |3-col (desktop) / stack (mobile)      |Contacts, about, legal          |

-----

## 8. Component Inventory (Reuse from Existing App)

|Component                     |Used on                          |
|------------------------------|---------------------------------|
|Sticky header bar             |All pages                        |
|Horizontal scroll tab row     |Cakes, Desserts                  |
|Sub-filter pill row           |Cakes (context-sensitive)        |
|Design/Flavour toggle         |Cakes section                    |
|Product card (2-col grid)     |All product listings             |
|Heart/wishlist overlay        |All product cards                |
|Floating action button (+ / ∨)|Product listing pages            |
|Order form (modal or page)    |All orderable products           |
|Status badge                  |Cart, Account, after order submit|
|Cart badge on header          |All pages                        |
|Date + time picker            |All order forms                  |
|Photo upload field            |Custom cake order forms          |
|Admin order table             |Admin panel only                 |

-----

*This specification is complete and self-contained. The design agent should use the existing visual system as the foundation and extend it consistently across all new pages.*