const admin = require('firebase-admin');

let db;

function init() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!encoded) {
    console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not provided; using in-memory storage only');
    return;
  }
  try {
    const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
  } catch (err) {
    console.error('Failed to initialise Firestore', err);
  }
}

async function loadCollection(name) {
  if (!db) return [];
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map(doc => doc.data());
}

// Replace the entire collection in a single batch so snapshot listeners
// don't observe a momentary empty state during updates.
async function saveCollection(name, items) {
  if (!db) return;
  const coll = db.collection(name);
  const snapshot = await coll.get();
  const batch = db.batch();
  const newIds = new Set(items.map(i => i.id));

  snapshot.docs.forEach(doc => {
    if (!newIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  items.forEach(item => {
    batch.set(coll.doc(item.id), item);
  });

  await batch.commit();
}

async function loadData() {
  if (!db) {
    return {
      lists: [],
      globalItems: [],
      categories: [],
      archivedLists: [],
      receipts: []
    };
  }
  return {
    lists: await loadCollection('lists'),
    globalItems: await loadCollection('items'),
    categories: await loadCollection('categories'),
    archivedLists: await loadCollection('archivedLists'),
    receipts: await loadCollection('receipts')
  };
}

async function saveData(data) {
  if (!db) return;
  await Promise.all([
    saveCollection('lists', data.lists),
    saveCollection('items', data.globalItems),
    saveCollection('categories', data.categories),
    saveCollection('archivedLists', data.archivedLists),
    saveCollection('receipts', data.receipts)
  ]);
}

function watchCollection(collection, key, onChange) {
  if (!db) return () => {};
  return db.collection(collection).onSnapshot(snapshot => {
    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data || typeof data !== 'object' || data.id !== doc.id) {
        console.error(`Corrupted document in ${collection}: ${doc.id}`);
        return;
      }
      items.push(data);
    });
    onChange(key, items);
  }, err => {
    console.error(`Listener error for ${collection}`, err);
  });
}

function watchData(onChange) {
  if (!db) return () => {};
  const unsubscribers = [
    watchCollection('lists', 'lists', onChange),
    watchCollection('items', 'globalItems', onChange),
    watchCollection('categories', 'categories', onChange),
    watchCollection('archivedLists', 'archivedLists', onChange),
    watchCollection('receipts', 'receipts', onChange)
  ];
  return () => unsubscribers.forEach(unsub => unsub());
}

module.exports = { init, loadData, saveData, watchData };
