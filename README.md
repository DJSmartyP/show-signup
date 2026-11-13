# Show Signup — PPEC

Compact 09:00–midnight event sign-ups, hosted on **GitHub Pages** with **Firebase Firestore** for shared bookings.

- PPEC logo, purple, gold and cream styling.
- Three expandable sections: 9am–2pm, 2pm–7pm, 7pm–midnight.
- Available/taken slots with counts, show title, premise and contributor.
- 30- or 60-minute bookings, with transactions and rules preventing clashes.
- Live schedule updates across browsers.
- Anonymous Firebase sign-in happens when booking; no contributor registration form.
- Contributors can withdraw their own shows from the same browser.

## Firebase setup (required before real bookings)

1. Choose/create a Firebase project and register a Web app.
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Create a **Cloud Firestore Standard edition** database in production mode. Select the region before creating it.
4. Publish `firestore.rules` in the database Rules tab, or run `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID` with the Firebase CLI.
5. Replace `null` in `public/firebase-config.js` with the Web app's public `firebaseConfig` object. Never put service-account credentials in this file.
6. Add `djsmartyp.github.io` under Authentication authorised domains. If the API key has HTTP referrer restrictions, allow `https://djsmartyp.github.io/*`.

The rules apply only to `ppecShowSignup` and `ppecShowSlots`; they do not grant access to other collections. On a project already used by other apps, merge these collection rules into the existing ruleset instead of replacing its existing rules.

Firebase configuration has **not yet been supplied**. The site intentionally disables sign-ups and hides apparent availability until it can load the shared schedule.

## GitHub Pages

Set repository **Settings → Pages → Source → GitHub Actions**. The workflow in `.github/workflows/pages.yml` builds and publishes the `dist` folder on pushes to `main`.

Expected URL after a successful deployment: `https://djsmartyp.github.io/show-signup/`.

## Development

```sh
npm ci
npm run dev
npm run build
```

Node 22.13+ is required. This version is a static Vite/React app; no Worker or D1 service is needed.

## Files

- `src/App.tsx`: schedule and form.
- `src/firebase.ts`: realtime reads, anonymous identity and atomic bookings.
- `src/style.css`: PPEC branding.
- `public/firebase-config.js`: public Firebase Web app configuration.
- `firestore.rules`: ownership, validation and consistent slot reservation rules.

## Notes

A 60-minute show occupies both half-hour rows, including when it crosses a section boundary. The time ranges are for a single event day; no event date was supplied. Anonymous ownership persists through Firebase's browser session storage; clearing site data removes the ability to withdraw earlier bookings. Public schedule records include the contributor's chosen name/handle and show details.
