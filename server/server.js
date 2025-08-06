const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { init, loadData, saveData, watchData } = require('./db');

// Simple in-memory storage for the shopping list data. The data is
// persisted in Firestore via db.js.
let appData = {
  lists: [],
  globalItems: [],
  categories: [],
  archivedLists: [],
  receipts: [],
  revision: 0
};

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

init();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve the static front‑end files (index.html, script.js, etc.)
app.use(express.static(path.join(__dirname, '..', 'shopping-list-app')));

// REST endpoint: GET /data – return the entire app state
app.get('/data', (req, res) => {
  res.json(appData);
});

// REST endpoint: PUT /data – replace the entire app state
app.put('/data', async (req, res) => {
  const newData = req.body;
  if (!newData || typeof newData !== 'object') {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  if (typeof newData.revision !== 'number' || newData.revision !== appData.revision) {
    res.status(409).json(appData);
    return;
  }
  appData = { ...newData, revision: appData.revision + 1 };
  await saveData(appData);
  io.emit('dataUpdated', appData);
  res.json({ message: 'Data updated', revision: appData.revision });
});

// REST endpoint: POST /data/clear – reset app state
app.post('/data/clear', async (req, res) => {
  appData = {
    lists: [],
    globalItems: [],
    categories: [],
    archivedLists: [],
    receipts: [],
    revision: appData.revision + 1
  };
  await saveData(appData);
  io.emit('dataUpdated', appData);
  res.json({ message: 'Data cleared' });
});

// WebSocket connection: send current data on connection
io.on('connection', socket => {
  socket.emit('dataUpdated', appData);
});

const PORT = process.env.PORT || 3000;

function startFirestoreListener() {
  watchData((key, items) => {
    appData[key] = items;
    appData.revision++;
    io.emit('dataUpdated', appData);
  });
}

loadData()
  .then(d => {
    appData = { ...d, revision: 0 };
    startFirestoreListener();
    httpServer.listen(PORT, () => {
      console.log(`Shopping List server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to load data from database', err);
    appData.revision = 0;
    startFirestoreListener();
    httpServer.listen(PORT, () => {
      console.log(`Shopping List server running on http://localhost:${PORT}`);
    });
  });
