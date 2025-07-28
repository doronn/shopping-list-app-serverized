const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Simple in‑memory storage for the shopping list data.  On startup we
// initialise from a JSON file if it exists.  In a production system you
// might replace this with a database.
const DATA_FILE = path.join(__dirname, 'data.json');
let appData = {
  lists: [],
  globalItems: [],
  categories: [],
  archivedLists: [],
  receipts: []
};

function loadDataFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      appData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load data file', err);
  }
}

function saveDataToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appData, null, 2));
  } catch (err) {
    console.error('Failed to save data file', err);
  }
}

// Initialise data on startup
loadDataFromDisk();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve the static front‑end files (index.html, script.js, etc.)
app.use(express.static(path.join(__dirname, '..', 'shopping-list-app')));

// REST endpoint: GET /data – return the entire app state
app.get('/data', (req, res) => {
  res.json(appData);
});

// REST endpoint: PUT /data – replace the entire app state
app.put('/data', (req, res) => {
  const newData = req.body;
  if (!newData || typeof newData !== 'object') {
    res.status(400).json({ message: 'Invalid data' });
    return;
  }
  appData = newData;
  saveDataToDisk();
  // Broadcast to all connected clients that data has changed
  io.emit('dataUpdated', appData);
  res.json({ message: 'Data updated' });
});

// REST endpoint: POST /data/clear – reset app state
app.post('/data/clear', (req, res) => {
  appData = {
    lists: [],
    globalItems: [],
    categories: [],
    archivedLists: [],
    receipts: []
  };
  saveDataToDisk();
  io.emit('dataUpdated', appData);
  res.json({ message: 'Data cleared' });
});

// WebSocket connection: send current data on connection
io.on('connection', socket => {
  socket.emit('dataUpdated', appData);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Shopping List server running on http://localhost:${PORT}`);
});