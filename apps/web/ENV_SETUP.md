# Umgebungsvariablen Setup

## 📋 Benötigte Variablen

### ✅ **Pflicht (für Supabase)**

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Ihre Supabase Projekt-URL
   - Format: `https://xxxxx.supabase.co`
   - Wo finden: Supabase Dashboard → Project Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Ihr öffentlicher Supabase API Key
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Wo finden: Supabase Dashboard → Project Settings → API → anon/public key

3. **SUPABASE_SERVICE_ROLE_KEY** (für Admin-Uploads)
   - Ihr Service Role Key für Server-seitige Operationen
   - ⚠️ **WICHTIG:** Dieser Key umgeht RLS und sollte NUR auf dem Server verwendet werden!
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Wo finden: Supabase Dashboard → Project Settings → API → service_role key (geheim)
   - **NICHT** in `NEXT_PUBLIC_` setzen, da dieser Key nicht im Browser sichtbar sein sollte!

### 📧 **Optional (für E-Mail-Benachrichtigungen)**

4. **SMTP_HOST**
   - SMTP Server Adresse
   - Beispiele:
     - Gmail: `smtp.gmail.com`
     - Outlook: `smtp-mail.outlook.com`
     - SendGrid: `smtp.sendgrid.net`
     - Mailgun: `smtp.mailgun.org`

5. **SMTP_PORT**
   - SMTP Port (meist 587 für TLS oder 465 für SSL)
   - Gmail: `587`
   - Outlook: `587`

6. **SMTP_USER**
   - Ihre E-Mail-Adresse für den SMTP-Server
   - Beispiel: `your-email@gmail.com`

7. **SMTP_PASS**
   - Ihr SMTP-Passwort oder App-Passwort
   - **Wichtig bei Gmail:** Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort!
   - Gmail App-Passwort erstellen: https://myaccount.google.com/apppasswords

8. **SMTP_FROM**
   - Absender-E-Mail-Adresse für Bestellbestätigungen
   - Beispiel: `noreply@jufoods.com`

9. **ORDER_EMAIL**
   - E-Mail-Adresse, an die Bestellungen gesendet werden
   - Beispiel: `orders@jufoods.com`

## 🚀 Setup-Anleitung

1. Kopieren Sie die `.env.example` Datei:
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. Öffnen Sie `.env.local` und fügen Sie Ihre Werte ein

3. **Für Supabase:**
   - Erstellen Sie ein Projekt auf https://supabase.com
   - Gehen Sie zu Project Settings → API
   - Kopieren Sie die URL, den anon key und den service_role key (für Admin-Uploads)
   - ⚠️ Der service_role key sollte nur in `.env.local` (Server) gespeichert werden, nicht in `NEXT_PUBLIC_*`

4. **Für E-Mail (optional):**
   - Falls Sie Gmail verwenden, erstellen Sie ein App-Passwort:
     1. Gehen Sie zu https://myaccount.google.com/apppasswords
     2. Erstellen Sie ein neues App-Passwort
     3. Verwenden Sie dieses als `SMTP_PASS`

## ⚠️ Wichtige Hinweise

- `.env.local` ist in `.gitignore` und wird nicht ins Repository committet
- Variablen mit `NEXT_PUBLIC_` sind öffentlich im Browser sichtbar
- E-Mail-Konfiguration ist optional - die App funktioniert auch ohne, Bestellungen werden trotzdem in der Datenbank gespeichert

