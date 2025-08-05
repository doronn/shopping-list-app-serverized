# Shopping List App (Serverized)

This repository contains a simple shopping list web application and a small Node.js backend. The frontend is a vanilla JavaScript single page app while the backend exposes REST and WebSocket APIs for persistence and real‑time updates.

## Project Structure

- **shopping-list-app/** – HTML, CSS and JS for the client application.
- **server/** – Express server that stores data in Firestore and serves the frontend files.
- **package-lock.json** – placeholder for the root (no dependencies).

## Getting Started

1. Install [Node.js](https://nodejs.org/) (version 18 or newer).
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
3. Provide Firestore credentials via the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable containing a base64‑encoded service account JSON. Start the server:
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`.

When the frontend loads it attempts to use the backend via `DataService`. If the server cannot be reached the app falls back to `localStorage`.

## Features

- Manage multiple shopping lists and a global catalogue of items.
- Direct links (`?list=<id>`) open a specific list immediately.
- List details can be toggled to full screen and this preference is saved locally.
- Items and categories are reorderable; categories may be collapsed or checked in bulk.
- Checked items appear in a dedicated section at the bottom of each list.
- English and Hebrew translations with right‑to‑left support.
- Optional import/export tools and receipt upload UI.
- Real‑time synchronisation between browser tabs when connected to the server.

## Development Notes

- The server keeps its data in Firestore and mirrors it in memory. Changes made directly in Firestore are watched and broadcast to connected clients.
- Static files are served from the `shopping-list-app` directory.
- WebSocket updates are broadcast using Socket.IO on every data change.
- The client code lives in `shopping-list-app/script.js` and uses `dataService.js` to abstract storage.

## Clearing Data

Send a POST request to `/data/clear` or use the "Clear All Data" button in the Settings page to reset the stored data.

## License

This project is provided as-is without any specific license.
