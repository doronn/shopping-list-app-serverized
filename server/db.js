const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(DB_PATH);

function init() {
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS lists (id TEXT PRIMARY KEY, data TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, data TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS archivedLists (id TEXT PRIMARY KEY, data TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, data TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT)');
  });
}

function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve();
    });
  });
}

async function loadData() {
  const data = { lists: [], globalItems: [], categories: [], archivedLists: [], receipts: [] };
  const listRows = await all('SELECT data FROM lists');
  data.lists = listRows.map(r => JSON.parse(r.data));
  const itemRows = await all('SELECT data FROM items');
  data.globalItems = itemRows.map(r => JSON.parse(r.data));
  const catRows = await all('SELECT data FROM categories');
  data.categories = catRows.map(r => JSON.parse(r.data));
  const archRows = await all('SELECT data FROM archivedLists');
  data.archivedLists = archRows.map(r => JSON.parse(r.data));
  const receiptRows = await all('SELECT data FROM receipts');
  data.receipts = receiptRows.map(r => JSON.parse(r.data));
  return data;
}

async function saveData(data) {
  await run('DELETE FROM lists');
  for (const l of data.lists) {
    await run('INSERT INTO lists(id,data) VALUES (?,?)', [l.id, JSON.stringify(l)]);
  }
  await run('DELETE FROM items');
  for (const i of data.globalItems) {
    await run('INSERT INTO items(id,data) VALUES (?,?)', [i.id, JSON.stringify(i)]);
  }
  await run('DELETE FROM categories');
  for (const c of data.categories) {
    await run('INSERT INTO categories(id,data) VALUES (?,?)', [c.id, JSON.stringify(c)]);
  }
  await run('DELETE FROM archivedLists');
  for (const a of data.archivedLists) {
    await run('INSERT INTO archivedLists(id,data) VALUES (?,?)', [a.id, JSON.stringify(a)]);
  }
  await run('DELETE FROM receipts');
  for (const r of data.receipts) {
    await run('INSERT INTO receipts(id,data) VALUES (?,?)', [r.id, JSON.stringify(r)]);
  }
}

module.exports = { db, init, loadData, saveData };
