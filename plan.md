# Plan for Torten Design/Flavor Redesign

1. Database
- Maintain dedicated tables `torten_designs` (one row per design, inkl. Unterkategorie) und `torten_flavours` (zentrale Geschmacksprofile). Keine Join-Tabelle mehr; jeder Geschmack gilt global.
- Migriere bestehende Torten aus `products` nach `torten_designs`; alle anderen Kategorien verbleiben in `products`.
- Aktualisiere Policies/Indizes nur soweit nötig.

2. Server/Data Layer
- Produktdetail (`app/[locale]/products/[slug]/page.tsx`) soll für Torten ausschließlich aus `torten_designs` lesen (plus Shared-Flavour-Daten, falls benötigt).
- Gemeinsame Typen in `types/` und Supabase-Helpern anpassen.
- Routing weiter über Design-Slug.

3. Frontend (Torten)
- Detailansicht zeigt Designinformationen, listet globale Flavours nur informativ; kein designbezogener Selector mehr.
- Katalog/Favoriten/Search verwenden Designdaten anstelle alter `products`-Einträge.
- Warenkorb speichert nur noch Design-ID + ggf. ausgewählten globalen Geschmack (falls UI erneut benötigt).

4. Admin
- CRUD-Formulare für `torten_designs` (mit Subkategorie-Auswahl) und `torten_flavours` getrennt pflegen – keine Zuordnungslogik erforderlich.
- Nicht-Torten-Workflow unverändert.

5. Tests & Docs
- Seeds/Mocks aktualisieren.
- Lokalisierungen (DE/UK) für neue Torten-Subkategorien sicherstellen.
- Migration/Deployment-Notizen ohne Join-Tabelle dokumentieren.
.