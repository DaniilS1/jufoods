# Admin-Interface Setup

## 📋 Übersicht

Das Admin-Interface ermöglicht es, Produkte einfach über eine Web-Oberfläche zu verwalten, ohne manuelle SQL-Befehle ausführen zu müssen.

## 🚀 Features

- ✅ Produkte erstellen mit allen Feldern
- ✅ Bilder hochladen zu Supabase Storage
- ✅ Mehrere Designs pro Produkt
- ✅ Zutaten und Allergene verwalten
- ✅ Produktliste anzeigen
- ✅ Zweisprachig (Ukrainisch/Deutsch)

## 📍 Zugriff

Die Admin-Seite ist unter `/admin` verfügbar (z.B. `http://localhost:3000/de/admin`).

**Hinweis:** Aktuell ist die Seite für alle zugänglich. Für Produktion sollten Sie Authentifizierung hinzufügen.

## 🗄️ Supabase Storage Setup

### 1. Storage Bucket erstellen

Führen Sie die Migration aus oder erstellen Sie den Bucket manuell:

```sql
-- Migration ausführen
pnpm db:migrate

-- Oder manuell im Supabase Dashboard:
-- Storage → Create Bucket
-- Name: "bilder"
-- Public: Ja
-- File size limit: 50MB
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
```

### 2. Storage Policies (bereits in Migration enthalten)

Die Migration `20240103000000_create_storage_bucket.sql` erstellt:
- Öffentlichen Lesezugriff
- Upload-Rechte für authentifizierte Benutzer
- Update/Delete-Rechte für authentifizierte Benutzer

### 3. Manuelle Erstellung im Dashboard

Falls Sie die Migration nicht verwenden:

1. Gehen Sie zu **Supabase Dashboard → Storage**
2. Klicken Sie auf **"New bucket"**
3. Name: `bilder`
4. **Public bucket**: ✅ Aktiviert
5. **File size limit**: 50MB (optional)
6. **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

### 4. Storage Policies einrichten

Gehen Sie zu **Storage → Policies → bilder** und erstellen Sie:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public Access for bilder bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'bilder');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload to bilder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bilder');
```

**Policy 3: Authenticated Update**
```sql
CREATE POLICY "Authenticated users can update bilder"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bilder');
```

**Policy 4: Authenticated Delete**
```sql
CREATE POLICY "Authenticated users can delete bilder"
ON storage.objects FOR DELETE
USING (bucket_id = 'bilder');
```

**Wichtig:** Für öffentlichen Upload (ohne Authentifizierung) können Sie die Policies anpassen:

```sql
-- Öffentlicher Upload (für alle)
CREATE POLICY "Anyone can upload to bilder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bilder');
```

## 📝 Produkt erstellen

### Schritt-für-Schritt

1. **Kategorie auswählen**: Torten oder Desserts
2. **Namen eingeben**: Ukrainisch und Deutsch (Pflichtfelder)
3. **Beschreibungen**: Optional, aber empfohlen
4. **Bild hochladen**:
   - Klicken Sie auf "Datei auswählen"
   - Wählen Sie ein Bild (JPG, PNG, WebP)
   - Das Bild wird automatisch hochgeladen und die URL eingefügt
5. **Zutaten hinzufügen**:
   - Klicken Sie auf "Hinzufügen" bei Zutaten
   - Geben Sie jede Zutat ein
   - Entfernen Sie leere Einträge
6. **Allergene hinzufügen**: Gleiche Vorgehensweise wie bei Zutaten
7. **Designs hinzufügen** (optional):
   - Design ID (z.B. "classic", "elegant")
   - Namen auf Ukrainisch und Deutsch
   - Design-Bild hochladen
8. **Produkt speichern**: Klicken Sie auf "Produkt erstellen"

### Automatische Slug-Generierung

Der Slug wird automatisch aus dem deutschen Namen generiert:
- "Zitronen-Mohn-Torte" → "zitronen-mohn-torte"
- Sonderzeichen werden entfernt
- Leerzeichen werden durch Bindestriche ersetzt

## 🖼️ Bild-Upload

### Unterstützte Formate
- JPEG/JPG
- PNG
- WebP
- GIF

### Dateigröße
- Maximal: 50MB (konfigurierbar)

### Ordnerstruktur
- Produktbilder: `products/`
- Design-Bilder: `designs/`

### Bild-URLs

Nach dem Upload erhalten Sie eine öffentliche URL wie:
```
https://[project].supabase.co/storage/v1/object/public/bilder/products/1234567890_abc123.jpg
```

Diese URL wird automatisch in das Formular eingefügt.

## 📋 Produktliste

Die Produktliste zeigt:
- Produktbild (falls vorhanden)
- Name (Deutsch/Ukrainisch)
- Kategorie
- Beschreibung
- Bearbeiten/Löschen Buttons (noch zu implementieren)

## 🔒 Sicherheit

**Aktuell:** Die Admin-Seite ist für alle zugänglich.

**Für Produktion empfohlen:**
1. Authentifizierung hinzufügen
2. Admin-Rolle prüfen
3. Middleware für Admin-Routen

Beispiel-Middleware:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Prüfe Authentifizierung
    // Prüfe Admin-Rolle
  }
}
```

## 🐛 Fehlerbehebung

### "Bucket not found"
- Stellen Sie sicher, dass der Bucket "bilder" existiert
- Prüfen Sie die Supabase Storage-Konfiguration

### "Upload failed"
- Prüfen Sie die Storage Policies
- Stellen Sie sicher, dass der Bucket öffentlich ist
- Prüfen Sie die Dateigröße (max. 50MB)

### "Product creation failed"
- Prüfen Sie, ob alle Pflichtfelder ausgefüllt sind
- Prüfen Sie die Datenbankverbindung
- Prüfen Sie die RLS-Policies

## 📚 Nächste Schritte

- [ ] Bearbeiten-Funktion implementieren
- [ ] Löschen-Funktion implementieren
- [ ] Authentifizierung hinzufügen
- [ ] Admin-Rolle implementieren
- [ ] Bulk-Import Funktion
- [ ] Produkt-Vorschau
- [ ] Bild-Galerie für Designs

