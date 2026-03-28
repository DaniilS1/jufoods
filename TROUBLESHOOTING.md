## Next.js dev server läuft nicht oder hängt lange

1. **Port freimachen**
   - Prüfe, ob bereits ein Prozess auf Port `3000/3001` läuft:
     ```bash
     lsof -i :3000
     lsof -i :3001
     ```
   - Beende den Prozess oder passe den Port mit `PORT=4000 pnpm run dev`.

2. **Build nicht unterbrechen**
   - Der erste Compile kann 2‑3 Minuten dauern, weil Admin‑Module, Supabase und alle Lokalisierungen geladen werden.
   - Terminal offen lassen, bis `✓ Ready` erscheint oder eine Fehlermeldung geloggt wird.

3. **Cache zurücksetzen**
   ```bash
   rm -rf .next
   pnpm store prune
   pnpm install
   pnpm run dev
   ```
   - Löscht defekte Artefakte und installiert Abhängigkeiten frisch.

4. **Dateirechte prüfen**
   - Next muss in `.next/types`, `.next`, `next-env.d.ts` schreiben können.
   - Falls nötig: `chmod -R u+rw .next next-env.d.ts`.

5. **Logs aktiv beobachten**
   - Mit `NEXT_TELEMETRY_DISABLED=1 pnpm run dev --turbo` mehr Feedback erhalten.
   - Erst nach vollständigem Log-Durchlauf bewerten, ob weiterer Fehler besteht.

## Paketinstallation schlägt fehl

1. **Korruptes `node_modules` entfernen**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
2. **Zugriffsrechte**
   - Bei „Operation not permitted“: `sudo rm -rf node_modules` oder Besitz übernehmen: `sudo chown -R $(whoami) node_modules`.

3. **Defekte `package.json`**
   - Sicherstellen, dass `apps/web/package.json` gültiges JSON enthält (siehe Repository-Version).

## Fehlende Übersetzungen

1. **Leere Sprachdatei**
   - `messages/uk.json` darf nicht leer sein. Mindestens Dummy-Inhalt aus `messages/de.json` kopieren.
   - Nach Änderungen Server neu starten.

## CSS / globals.css ENOENT

1. **Pfad prüfen**
   - Verifiziere, dass `apps/web/app/globals.css` existiert.
2. **Importe**
   - `app/layout.tsx` muss `import './globals.css'` behalten.

## Allgemeine Tipps

- **Geduld:** Große Komponenten verursachen lange Cold Builds.
- **Keine parallelen Next-Prozesse:** Nur einen `pnpm run dev` gleichzeitig starten.
- **Terminal-Logs teilen:** Bei Supportanfragen immer die vollständige Fehlermeldung anhängen.


old text color: #735959