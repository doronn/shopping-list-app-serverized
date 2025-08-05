const admin = require('firebase-admin');

let db;

function init() {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8')
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  db = admin.firestore();
}

async function loadCollection(name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map(doc => doc.data());
}

async function clearCollection(name) {
  const snapshot = await db.collection(name).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

async function loadData() {
  return {
    lists: await loadCollection('lists'),
    globalItems: await loadCollection('items'),
    categories: await loadCollection('categories'),
    archivedLists: await loadCollection('archivedLists'),
    receipts: await loadCollection('receipts')
  };
}

async function saveData(data) {
  // Clear existing documents
  await Promise.all([
    clearCollection('lists'),
    clearCollection('items'),
    clearCollection('categories'),
    clearCollection('archivedLists'),
    clearCollection('receipts')
  ]);

  const batch = db.batch();
  data.lists.forEach(item =>
    batch.set(db.collection('lists').doc(item.id), item)
  );
  data.globalItems.forEach(item =>
    batch.set(db.collection('items').doc(item.id), item)
  );
  data.categories.forEach(item =>
    batch.set(db.collection('categories').doc(item.id), item)
  );
  data.archivedLists.forEach(item =>
    batch.set(db.collection('archivedLists').doc(item.id), item)
  );
  data.receipts.forEach(item =>
    batch.set(db.collection('receipts').doc(item.id), item)
  );
  await batch.commit();
}

function watchCollection(collection, key, onChange) {
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
