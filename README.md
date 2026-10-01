# Sylvie Designs

An offline-first Android app for a tailor to record client measurements, track orders and
due dates, and keep payment balances. Built with Expo (React Native) and TypeScript.

## Features

- **Clients** – add, search, edit, delete; one-tap call and WhatsApp.
- **Measurements** – garment templates (shirt, trousers, dress, skirt, suit, other), dated history,
  pre-filled from the client's previous record, cm/inch toggle (stored precisely in cm).
- **Orders** – garment, details, due date, price, deposit, progress status
  (New → Cutting → Sewing → Fitting → Ready → Delivered), "ready" WhatsApp message.
- **Today dashboard** – overdue and upcoming orders, money still to collect.
- **Backup** – export all data to a JSON file (share via WhatsApp/Drive/email) and restore it.

All data is stored locally in SQLite. There is no server and no account.

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

## Development

```bash
npm install --legacy-peer-deps
npm start            # then press "a", or scan the QR code in Expo Go
npm run typecheck
npm run lint
npm test
```

### Previewing without an Android phone

```bash
npm run web          # opens http://localhost:8081 in your browser
```

Use the browser's device toolbar (F12, then Ctrl+Shift+M) to view it at phone size. Data is
stored in the browser. The web build is for previewing only; the real app is the Android APK.
Alternatively, install Android Studio and run an emulator, then press `a` after `npm start`.

> Note: `expo-sqlite` and the other native modules work in Expo Go. If you later add a module
> Expo Go does not include, use a development build.

## Building the APK for installation

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
