const admin = require('firebase-admin');

let db;
let isFirebaseEnabled = false;

function init() {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set. Running without Firebase persistence.');
      return;
    }

    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountJson, 'base64').toString('utf8')
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = admin.firestore();
    isFirebaseEnabled = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Firebase:', error.message);
    console.warn('Running without Firebase persistence.');
    isFirebaseEnabled = false;
  }
}

async function loadCollection(name) {
  if (!isFirebaseEnabled) {
    return [];
  }

  try {
    const snapshot = await db.collection(name).get();
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error(`Failed to load collection ${name}:`, error);
    return [];
  }
}

// Replace the entire collection in a single batch so snapshot listeners
// don't observe a momentary empty state during updates.
async function saveCollection(name, items) {
  if (!isFirebaseEnabled) {
    console.log(`Would save ${items.length} items to collection ${name} (Firebase disabled)`);
    return;
  }

  try {
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
  } catch (error) {
    console.error(`Failed to save collection ${name}:`, error);
  }
}

async function loadData() {
  if (!isFirebaseEnabled) {
    console.log('Loading empty data (Firebase disabled)');
    return {
      lists: [],
      globalItems: [],
      categories: [],
      archivedLists: [],
      receipts: []
    };
  }

  try {
    return {
      lists: await loadCollection('lists'),
      globalItems: await loadCollection('items'),
      categories: await loadCollection('categories'),
      archivedLists: await loadCollection('archivedLists'),
      receipts: await loadCollection('receipts')
    };
  } catch (error) {
    console.error('Failed to load data from Firebase:', error);
    return {
      lists: [],
      globalItems: [],
      categories: [],
      archivedLists: [],
      receipts: []
    };
  }
}

async function saveData(data) {
  if (!isFirebaseEnabled) {
    console.log('Would save data to Firebase (Firebase disabled)');
    return;
  }

  try {
    await Promise.all([
      saveCollection('lists', data.lists),
      saveCollection('items', data.globalItems),
      saveCollection('categories', data.categories),
      saveCollection('archivedLists', data.archivedLists),
      saveCollection('receipts', data.receipts)
    ]);
  } catch (error) {
    console.error('Failed to save data to Firebase:', error);
  }
}

function watchCollection(collection, key, onChange) {
  if (!isFirebaseEnabled) {
    console.log(`Would watch collection ${collection} (Firebase disabled)`);
    return () => {}; // Return empty unsubscriber
  }

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
  if (!isFirebaseEnabled) {
    console.log('Would watch data changes (Firebase disabled)');
    return () => {}; // Return empty unsubscriber
  }

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
