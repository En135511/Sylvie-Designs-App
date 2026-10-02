# Sylvie Designs

An offline-first Android app for a tailor to record client measurements, track orders and
due dates, and keep payment balances. Built with Expo (React Native) and TypeScript.

## Features

- **Clients** – add, search, edit, delete; one-tap call and WhatsApp.
- **Measurements** – garment templates (shirt, trousers, dress, skirt, suit, other), dated history,
  pre-filled from the client's previous record, cm/inch toggle (stored precisely in cm).
- **Choose measurements** (switch: "Choose measurements") – Settings gets a list of ~35
  measurements grouped by body area, each with a switch (plus "Basic set" / "Select all"). Only
  the switched-on ones appear on the measurement form, limited to those that suit the garment;
  "Other" shows all of them. Saved values are never deleted when a measurement is switched off.
- **Orders** – garment, details, due date, price, deposit, progress status
  (New → Cutting → Sewing → Fitting → Ready → Delivered), "ready" WhatsApp message.
- **Today dashboard** – overdue and upcoming orders, money still to collect.
- **Schools & classes** (switch: "Schools & classes") – schools contain classes, classes contain
  students. Paste a whole class list to add every student at once, measure student after student
  with "Save & next student", see "12 of 40 measured" per garment, search students, and export a
  class sheet as CSV (opens in Excel / Google Sheets). Students are hidden from the main Clients
  list unless searched for, so hundreds of them don't bury ordinary clients.
- **Backup** – export all data to a JSON file (share via WhatsApp/Drive/email) and restore it.

All data is stored locally in SQLite. There is no server and no account.

## Hidden feature switches

Only clients and basic measurements are always on. Everything else is switched on from inside
Settings:

1. Open **Settings** and tap the **"Version"** line at the bottom **7 times quickly**.
2. A switch labelled **Advanced** appears (and stays, even after restarting the app).
3. Turn **Advanced** on to reveal the **Feature switches** list; turn it off to hide the list
   again. Hiding the list never turns features off, and no data is ever deleted.

Features are declared in `src/features/flags/features.ts`; to add one, add an entry there and wrap
the UI with `useFlag('yourKey')`.

## Project structure

```
app/                  Screens (expo-router, file-based routing)
  (tabs)/             Today, Clients, Orders, Settings
  client/ order/ measurement/
src/
  domain/             Types and garment/measurement catalogue (pure)
  db/                 SQLite migrations and repositories (one per table)
  features/backup/    Backup format (pure, tested) and export/import
  components/         Shared UI building blocks
  hooks/              Data and settings hooks
  utils/              Pure helpers (units, money, dates, phone) with tests
  theme/              Colours, spacing, sizes
```

Design rules: screens never write SQL (they call repositories); pure logic lives in `domain/`
and `utils/` and is unit tested; schema changes are append-only migrations in
`src/db/migrations.ts`; money is integer minor units; dates are local `YYYY-MM-DD` strings.

## Design and quality

- One design system (`src/theme`, `src/components`): colour tokens that pass WCAG AA contrast
  (enforced by a test), 48 px touch targets, icons, avatars, a floating add button, sticky Save
  bars above the keyboard, and a custom app icon and splash screen.
- Tests (`npm test`): pure logic, plus integration tests that run every repository, the
  migrations (including upgrading a v1 database) and a full backup/restore round trip against a
  real SQLite engine.
- Audits used while building: type-check, lint, an Android bundle export, and a scripted browser
  walk-through of every screen at two phone sizes that checks for horizontal overflow, small tap
  targets, unnamed controls and console errors.

## Development

```bash
npm install --legacy-peer-deps
npm start            # then press "a", or scan the QR code in Expo Go
npm run typecheck
npm run lint
npm test
```

### Trying it on an iPhone (no Apple account needed)

The real app is Android-only, but you can test it live on an iPhone with the free **Expo Go** app
from the App Store:

```bash
npm start            # prints a QR code
```

Scan the QR code with the iPhone camera (phone and computer on the same Wi-Fi). If it can't
connect, use `npx expo start --tunnel` instead. Data stays inside Expo Go, so it is separate from
anything on the web preview.

### Previewing without an Android phone

> Not seeing recent changes? Run `git pull`, then `npm install --legacy-peer-deps`, then
> `npm run preview:web`. This builds a fresh copy and serves it, so no old cache is involved.
> Settings shows the app version at the bottom: it should read **1.1.0** or higher.

```bash
npm run web          # opens http://localhost:8081 in your browser
```

Use the browser's device toolbar (F12, then Ctrl+Shift+M) to view it at phone size. Data is
stored in the browser. The web build is for previewing only; the real app is the Android APK.
Alternatively, install Android Studio and run an emulator, then press `a` after `npm start`.

> Note: `expo-sqlite` and the other native modules work in Expo Go. If you later add a module
> Expo Go does not include, use a development build.

## Building the APK for installation

The repo's `.npmrc` sets `legacy-peer-deps=true`. Keep it: the cloud build runs `npm ci`, which
must resolve packages the same way the lock file was created, or it fails with "package.json and
package-lock.json are not in sync".

Requires a free [Expo](https://expo.dev) account.

```bash
npm install -g eas-cli
eas login
eas build:configure          # first time only
npm run build:apk            # cloud build, produces an .apk download link
```

Send the downloaded `.apk` to the phone (WhatsApp, Drive, USB). On the phone, open it and allow
"Install unknown apps" for the app you opened it from. To update, build a new APK and install it
over the old one: data is kept as long as the app is signed with the same key (EAS keeps it for
you).

## Roadmap

Reference photos per client/order, due-date reminder notifications, PDF measurement sheet,
optional cloud sync.
