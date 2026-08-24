# Glow Diary

A mobile-first work tracker for a freelance makeup artist: log bookings, manage a
calendar of worked/reserved dates, and track payments. Google Sheets is the
database; Google Apps Script is the API layer.

## Project structure

```
glow-diary/
  src/            React + TypeScript frontend (Vite)
  apps-script/    Google Apps Script backend (Code.gs) + setup README
```

## Frontend setup

```bash
cd glow-diary
npm install
npm run dev
```

The app runs immediately with an in-memory mock dataset — no backend required
to try it out. A "Demo mode" banner shows at the top when this fallback is active.

### Connecting the real backend

1. Follow [`apps-script/README.md`](./apps-script/README.md) to create the
   Sheet, paste in `Code.gs`, and deploy it as a Web App.
2. Copy `.env.example` to `.env` in the `glow-diary` root:

   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXX/exec
   ```

3. Restart `npm run dev`. The mock banner disappears once the URL is set and
   the app is live-reading/writing your Sheet.

## Environment variables

| Variable                | Description                                             |
| ------------------------ | -------------------------------------------------------- |
| `VITE_APPS_SCRIPT_URL`   | Deployed Apps Script Web App URL. Omit to use mock data. |

`.env` is git-ignored — it holds your real Apps Script URL and is never pushed.
`.env.example` is the committed template; copy it to `.env` locally and fill in the real value.

## Deploying

### Push to GitHub

```bash
git add .
git commit -m "Deploy setup"
git push -u origin master
```

(`.env` won't be included — it's in `.gitignore`.)

### Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Vercel auto-detects Vite (`vercel.json` in this repo pins the build command
   `npm run build` and output directory `dist` as a fallback).
3. Before the first deploy (or after, under **Project → Settings → Environment
   Variables**), add:

   | Key | Value |
   | --- | --- |
   | `VITE_APPS_SCRIPT_URL` | your deployed Apps Script Web App URL |

   Without this, the deployed app runs in mock/demo mode — same as local dev
   without a `.env`.
4. Deploy. Any push to the connected branch redeploys automatically; changing
   the env var requires a redeploy (**Deployments → ⋯ → Redeploy**) to take effect.

## Tech stack

- Vite + React 18 + TypeScript (strict)
- React Context + hooks for shared state (no Redux)
- `react-router-dom` (hash routing) for view switching
- `lucide-react` icons
- Plain CSS with CSS variables for design tokens (see `src/index.css`)
- Google Sheets + Apps Script as the backend

## Views

- **Logs** — chronological list of bookings grouped by date, add/edit via a
  bottom-sheet form, swipe-to-delete style trailing delete action.
- **Calendar** — month grid with Worked/Reserved/Mixed day states, tap a date
  to see its bookings, reserve empty future dates, convert a reservation to a
  completed job.
- **Payments** — earnings summary cards, monthly or per-client breakdown,
  one-tap "Mark as Paid" on pending items.
