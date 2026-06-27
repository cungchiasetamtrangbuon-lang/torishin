# Torishin Revenue Sync

This project is a static frontend with an optional backend to sync daily revenue data across devices.

## Files

- `staff_daily.html` — staff daily revenue page.
- `api/sync.js` — Vercel serverless endpoint for sync.
- `server.js` — Node backend for Render/local use.
- `package.json` — start script for Node backend.
- `google_apps_script.gs` — legacy Google Sheets sync template (not required if using Render backend).

## Recommended deployment: Render

1. Create a new Render Web Service.
2. Connect your GitHub repo `torishin`.
3. Set the root directory to the repo root.
4. Set build command:
   ```bash
   npm install
   ```
5. Set start command:
   ```bash
   npm start
   ```
6. Deploy the service.
7. Copy the app URL, for example:
   ```text
   https://torishin-sync.onrender.com
   ```
8. Edit `staff_daily.html` and replace `<your-render-app>` with your app host:
   ```js
   const BACKEND_CONFIG = {
     url: 'https://torishin-sync.onrender.com/api/sync'
   };
   ```
9. Save and redeploy your frontend to GitHub Pages if needed.

## Local testing

Run the backend locally:
```bash
cd c:\torishin\torishin
npm start
```

Then open `staff_daily.html` locally and it will use `http://127.0.0.1:3000/api/sync`.

## How sync works

- `saveState()` writes to `localStorage` and also calls `saveToCloud()`.
- `saveToCloud()` POSTs the full state to the backend.
- `loadFromCloud()` GETs the latest saved state on page load and when the page becomes visible.

## Note

- GitHub Pages alone cannot sync data between browsers/devices because it only serves static files.
- Use the Render backend URL in `staff_daily.html` for real sync.
