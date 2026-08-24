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
