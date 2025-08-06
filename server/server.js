const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { init, loadData, saveData, watchData } = require('./db');

// Enhanced in-memory storage with operational tracking
let appData = {
  lists: [],
  globalItems: [],
  categories: [],
  archivedLists: [],
  receipts: [],
  revision: 0,
  lastModified: new Date().toISOString(),
  operations: [], // Track recent operations for conflict resolution
  checksum: null // Data integrity verification
};

// Track connected users and their activity
const connectedUsers = new Map();
const activeEditors = new Map(); // Track who's editing what
const pendingOperations = new Map(); // Track operations awaiting confirmation

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000
});

init();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve the static front‑end files
app.use(express.static(path.join(__dirname, '..', 'shopping-list-app')));

// Enhanced utility functions for data merging and validation
function validateDataStructure(data) {
  if (!data || typeof data !== 'object') return false;

  const requiredFields = ['lists', 'globalItems', 'categories', 'archivedLists', 'receipts'];
  for (const field of requiredFields) {
    if (!Array.isArray(data[field])) return false;
  }

  // Validate each list has required fields and structure
  for (const list of data.lists) {
    if (!list.id || !list.name || !Array.isArray(list.items)) return false;
    for (const item of list.items) {
      if (!item.id || !item.globalItemId) return false;
      if (typeof item.quantity !== 'number' || item.quantity <= 0) return false;
    }
  }

  // Validate global items
  for (const item of data.globalItems) {
    if (!item.id || !item.name || !item.categoryId) return false;
    if (typeof item.estimatedPrice !== 'number' || item.estimatedPrice < 0) return false;
  }

  return true;
}

function generateChecksum(data) {
  const crypto = require('crypto');
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}


function applyOperation(operation, targetData = appData) {
  const { type, path, data } = operation;

  try {
    switch (type) {
      case 'create':
        if (path === 'lists') {
          targetData.lists.push(data);
        } else if (path === 'globalItems') {
          targetData.globalItems.push(data);
        } else if (path === 'categories') {
          targetData.categories.push(data);
        } else if (path.startsWith('lists/')) {
          const listId = path.split('/')[1];
          const list = targetData.lists.find(l => l.id === listId);
          if (list && path.endsWith('/items')) {
            list.items.push(data);
          }
        }
        break;

      case 'update':
        if (path.startsWith('lists/')) {
          const parts = path.split('/');
          const listId = parts[1];
          const list = targetData.lists.find(l => l.id === listId);
          if (list) {
            if (parts.length === 2) {
              Object.assign(list, data);
            } else if (parts[2] === 'items') {
              const itemId = parts[3];
              const item = list.items.find(i => i.id === itemId);
              if (item) {
                Object.assign(item, data);
              }
            }
          }
        } else if (path.startsWith('globalItems/')) {
          const itemId = path.split('/')[1];
          const item = targetData.globalItems.find(i => i.id === itemId);
          if (item) {
            Object.assign(item, data);
          }
        }
        break;

      case 'delete':
        if (path.startsWith('lists/')) {
          const parts = path.split('/');
          const listId = parts[1];
          if (parts.length === 2) {
            targetData.lists = targetData.lists.filter(l => l.id !== listId);
          } else if (parts[2] === 'items') {
            const itemId = parts[3];
            const list = targetData.lists.find(l => l.id === listId);
            if (list) {
              list.items = list.items.filter(i => i.id !== itemId);
            }
          }
        } else if (path.startsWith('globalItems/')) {
          const itemId = path.split('/')[1];
          targetData.globalItems = targetData.globalItems.filter(i => i.id !== itemId);
        }
        break;

      default:
        console.error(`Unknown operation type: ${type}`);
        return false;
    }

    return true;
  } catch (error) {
    console.error('Error applying operation:', error);
    return false;
  }
}

function resolveConflicts(baseData, clientData, serverData) {
  // Implement three-way merge algorithm
  const resolved = JSON.parse(JSON.stringify(serverData)); // Start with server state

  // Merge lists with conflict detection
  resolved.lists = mergeListsWithConflictDetection(
    baseData.lists || [],
    clientData.lists || [],
    serverData.lists || []
  );

  // Merge global items
  resolved.globalItems = mergeArraysById(
    clientData.globalItems || [],
    serverData.globalItems || [],
    'id'
  );

  // Merge categories (server wins for structural changes)
  resolved.categories = serverData.categories || [];

  return resolved;
}

function mergeListsWithConflictDetection(baseLists, clientLists, serverLists) {
  const merged = [];

  // Create maps for efficient lookup
  const baseMap = new Map(baseLists.map(l => [l.id, l]));
  const clientMap = new Map(clientLists.map(l => [l.id, l]));
  const serverMap = new Map(serverLists.map(l => [l.id, l]));

  // Get all unique list IDs
  const allIds = new Set([
    ...baseLists.map(l => l.id),
    ...clientLists.map(l => l.id),
    ...serverLists.map(l => l.id)
  ]);

  for (const id of allIds) {
    const baseList = baseMap.get(id);
    const clientList = clientMap.get(id);
    const serverList = serverMap.get(id);

    if (!clientList && !serverList) {
      // List deleted by both - skip
    } else if (!clientList) {
      // List exists on server only
      merged.push(serverList);
    } else if (!serverList) {
      // List exists on client only
      merged.push(clientList);
    } else {
      // List exists on both - merge
      const mergedList = mergeList(baseList, clientList, serverList);
      merged.push(mergedList);
    }
  }

  return merged;
}

function mergeList(baseList, clientList, serverList) {
  const merged = {
    id: clientList.id,
    name: clientList.name, // Prefer client name changes
    items: [],
    isCompleted: serverList.isCompleted, // Server wins for completion state
    completedAt: serverList.completedAt,
    createdAt: baseList?.createdAt || clientList.createdAt || serverList.createdAt,
    updatedAt: new Date().toISOString()
  };

  // Merge items using three-way merge
  merged.items = mergeItemsThreeWay(
    baseList?.items || [],
    clientList.items || [],
    serverList.items || []
  );

  return merged;
}

function mergeItemsThreeWay(baseItems, clientItems, serverItems) {
  const merged = [];

  // Create maps for efficient lookup
  const clientMap = new Map(clientItems.map(i => [i.id, i]));
  const serverMap = new Map(serverItems.map(i => [i.id, i]));

  // Get all unique item IDs
  const allIds = new Set([
    ...baseItems.map(i => i.id),
    ...clientItems.map(i => i.id),
    ...serverItems.map(i => i.id)
  ]);

  for (const id of allIds) {
    const clientItem = clientMap.get(id);
    const serverItem = serverMap.get(id);

    if (!clientItem && !serverItem) {
      // Item deleted by both - skip
    } else if (!clientItem) {
      // Item exists on server only
      merged.push(serverItem);
    } else if (!serverItem) {
      // Item exists on client only
      merged.push(clientItem);
    } else {
      // Item exists on both - merge properties
      const mergedItem = {
        ...serverItem,
        // Prefer client changes for user-modifiable fields
        quantity: clientItem.quantity,
        notes: clientItem.notes || serverItem.notes,
        actualPrice: clientItem.actualPrice !== undefined ? clientItem.actualPrice : serverItem.actualPrice,
        // Server wins for structural changes
        isChecked: serverItem.isChecked,
        globalItemId: serverItem.globalItemId
      };
      merged.push(mergedItem);
    }
  }

  return merged;
}

function mergeArraysById(clientArray, serverArray, idField) {
  const clientMap = new Map(clientArray.map(item => [item[idField], item]));

  // Start with server items
  const result = [...serverArray];

  // Add or update with client changes
  for (const [id, clientItem] of clientMap) {
    const existingIndex = result.findIndex(item => item[idField] === id);
    if (existingIndex >= 0) {
      // Merge existing item (prefer client changes for user-editable fields)
      result[existingIndex] = {
        ...result[existingIndex],
        ...clientItem,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new item from client
      result.push({
        ...clientItem,
        createdAt: clientItem.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  return result;
}

// Enhanced data integrity and rollback
function createDataSnapshot() {
  return {
    data: JSON.parse(JSON.stringify(appData)),
    timestamp: new Date().toISOString(),
    checksum: generateChecksum(appData)
  };
}

const dataSnapshots = [];
const MAX_SNAPSHOTS = 10;

function saveSnapshot() {
  const snapshot = createDataSnapshot();
  dataSnapshots.push(snapshot);

  if (dataSnapshots.length > MAX_SNAPSHOTS) {
    dataSnapshots.shift();
  }
}

function rollbackToSnapshot(index = -1) {
  const snapshot = dataSnapshots[index] || dataSnapshots[dataSnapshots.length - 1];
  if (snapshot) {
    appData = JSON.parse(JSON.stringify(snapshot.data));
    appData.revision += 1;
    appData.lastModified = new Date().toISOString();
    return true;
  }
  return false;
}

// REST endpoint: GET /data – return the entire app state
app.get('/data', (req, res) => {
  res.json({
    ...appData,
    connectedUsers: Array.from(connectedUsers.values()),
    activeEditors: Object.fromEntries(activeEditors)
  });
});

// Enhanced REST endpoint: PUT /data with better conflict resolution
app.put('/data', async (req, res) => {
  const { clientId, changeId, baseRevision, operations: clientOps, ...newData } = req.body || {};

  if (!validateDataStructure(newData)) {
    return res.status(400).json({ message: 'Invalid data structure' });
  }

  try {
    let mergedData;

    if (baseRevision != null && baseRevision < appData.revision) {
      // Client is behind - attempt to merge changes
      console.log(`Conflict detected: client revision ${baseRevision}, server revision ${appData.revision}`);
      mergedData = mergeOperations(baseRevision, clientOps || [], newData, clientId);

      // Return merged data for client to review
      return res.status(409).json({
        ...mergedData,
        revision: appData.revision,
        message: 'Conflicts resolved through merge'
      });
    } else {
      // Normal update
      mergedData = { ...newData };
    }

    // Update server data
    const oldRevision = appData.revision;
    appData = {
      ...mergedData,
      revision: oldRevision + 1,
      lastModified: new Date().toISOString(),
      operations: appData.operations || []
    };

    // Track this operation
    if (clientOps && clientOps.length > 0) {
      appData.operations.push(...clientOps.map(op => ({
        ...op,
        revision: appData.revision,
        serverTimestamp: Date.now()
      })));

      // Keep only recent operations (last 100)
      appData.operations = appData.operations.slice(-100);
    }

    await saveData(appData);

    // Broadcast to all clients except sender
    io.emit('dataUpdated', {
      data: appData,
      clientId,
      changeId,
      operations: clientOps
    });

    res.json({
      message: 'Data updated successfully',
      revision: appData.revision,
      timestamp: appData.lastModified
    });

  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// New endpoint for granular operations
app.post('/operations', async (req, res) => {
  const { operations, clientId } = req.body || {};

  if (!Array.isArray(operations) || !clientId) {
    return res.status(400).json({ message: 'Invalid operations data' });
  }

  try {
    // Apply operations one by one
    for (const op of operations) {
      applyOperation(op);
      appData.operations.push(op);
    }

    appData.revision += operations.length;
    appData.lastModified = new Date().toISOString();

    // Keep only recent operations
    appData.operations = appData.operations.slice(-100);

    await saveData(appData);

    // Broadcast operations to other clients
    io.emit('operationsApplied', {
      operations,
      clientId,
      revision: appData.revision
    });

    res.json({
      message: 'Operations applied successfully',
      revision: appData.revision
    });

  } catch (error) {
    console.error('Error applying operations:', error);
    res.status(500).json({ message: 'Failed to apply operations' });
  }
});

// Enhanced user presence tracking
app.post('/presence', (req, res) => {
  const { clientId, userId, action, listId, itemId } = req.body || {};

  if (!clientId) {
    return res.status(400).json({ message: 'Client ID required' });
  }

  const user = connectedUsers.get(clientId) || {
    id: clientId,
    userId: userId || `User-${clientId.slice(-8)}`,
    connectedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  user.lastActivity = new Date().toISOString();
  connectedUsers.set(clientId, user);

  if (action === 'editStart' && listId) {
    const key = itemId ? `${listId}/${itemId}` : listId;
    activeEditors.set(key, {
      clientId,
      userId: user.userId,
      startedAt: new Date().toISOString()
    });
  } else if (action === 'editEnd' && listId) {
    const key = itemId ? `${listId}/${itemId}` : listId;
    activeEditors.delete(key);
  }

  // Broadcast presence update
  io.emit('presenceUpdate', {
    connectedUsers: Array.from(connectedUsers.values()),
    activeEditors: Object.fromEntries(activeEditors)
  });

  res.json({ message: 'Presence updated' });
});

// REST endpoint: POST /data/clear – reset app state
app.post('/data/clear', async (req, res) => {
  appData = {
    lists: [],
    globalItems: [],
    categories: [],
    archivedLists: [],
    receipts: [],
    revision: appData.revision + 1,
    lastModified: new Date().toISOString(),
    operations: []
  };
  await saveData(appData);
  io.emit('dataUpdated', { data: appData });
  res.json({ message: 'Data cleared' });
});

// Enhanced WebSocket connection handling
io.on('connection', socket => {
  const clientId = socket.handshake.query.clientId || socket.id;

  console.log(`Client connected: ${clientId}`);

  // Send initial data
  socket.emit('dataUpdated', {
    data: appData,
    connectedUsers: Array.from(connectedUsers.values()),
    activeEditors: Object.fromEntries(activeEditors)
  });

  // Handle real-time operations
  socket.on('operation', (operation) => {
    try {
      const op = { ...operation, serverTimestamp: Date.now() };
      applyOperation(op);
      appData.operations.push(op);
      appData.revision++;

      // Broadcast to other clients
      socket.broadcast.emit('operationReceived', op);
    } catch (error) {
      console.error('Error handling operation:', error);
      socket.emit('operationError', { error: error.message });
    }
  });

  // Handle presence updates
  socket.on('presence', (data) => {
    const user = {
      id: clientId,
      ...data,
      lastActivity: new Date().toISOString()
    };
    connectedUsers.set(clientId, user);

    io.emit('presenceUpdate', {
      connectedUsers: Array.from(connectedUsers.values()),
      activeEditors: Object.fromEntries(activeEditors)
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${clientId}`);
    connectedUsers.delete(clientId);

    // Remove from active editors
    for (const [key, editor] of activeEditors) {
      if (editor.clientId === clientId) {
        activeEditors.delete(key);
      }
    }

    io.emit('presenceUpdate', {
      connectedUsers: Array.from(connectedUsers.values()),
      activeEditors: Object.fromEntries(activeEditors)
    });
  });
});

const PORT = process.env.PORT || 3000;

function startFirestoreListener() {
  watchData((key, items) => {
    appData[key] = items;
    appData.revision++;
    appData.lastModified = new Date().toISOString();
    io.emit('dataUpdated', { data: appData, source: 'firestore' });
  });
}

loadData()
  .then(d => {
    appData = {
      ...d,
      revision: 0,
      lastModified: new Date().toISOString(),
      operations: []
    };
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

// ...existing code...
function mergeOperations(baseRevision, operations, newData, clientId) {
  // Create a working copy of current server data
  const conflictingOps = appData.operations.filter(op =>
    op.revision > baseRevision && op.clientId !== clientId
  );

  if (conflictingOps.length === 0) {
    // No conflicts, use client data directly
    return newData;
  }

  // Implement intelligent merging based on operation types
  console.log(`Merging ${conflictingOps.length} conflicting operations`);

  // Use three-way merge with the base revision data
  const baseData = getDataAtRevision(baseRevision) || appData;
  return resolveConflicts(baseData, newData, appData);
}

function getDataAtRevision(revision) {
  // Try to reconstruct data at specific revision from snapshots
  const snapshot = dataSnapshots.find(s =>
    s.data.revision <= revision
  );
  return snapshot ? snapshot.data : null;
}

// Enhanced endpoints for better conflict handling
app.post('/data/merge', async (req, res) => {
  const { clientData, baseRevision, clientId } = req.body || {};

  if (!validateDataStructure(clientData)) {
    return res.status(400).json({ message: 'Invalid client data structure' });
  }

  try {
    // Save current state before attempting merge
    saveSnapshot();

    const baseData = getDataAtRevision(baseRevision) || appData;
    const mergedData = resolveConflicts(baseData, clientData, appData);

    // Validate merged result
    if (!validateDataStructure(mergedData)) {
      return res.status(409).json({
        message: 'Merge resulted in invalid data structure',
        suggestion: 'manual_resolution_required'
      });
    }

    // Apply merged data
    const oldRevision = appData.revision;
    appData = {
      ...mergedData,
      revision: oldRevision + 1,
      lastModified: new Date().toISOString(),
      operations: appData.operations,
      checksum: generateChecksum(mergedData)
    };

    await saveData(appData);

    // Broadcast merged result
    io.emit('dataUpdated', {
      data: appData,
      clientId,
      mergeResult: true
    });

    res.json({
      message: 'Data merged successfully',
      revision: appData.revision,
      conflicts: [], // Could include conflict details
      mergedData: appData
    });

  } catch (error) {
    console.error('Error during merge:', error);

    // Attempt rollback on merge failure
    if (rollbackToSnapshot()) {
      console.log('Rolled back to previous snapshot');
    }

    res.status(500).json({
      message: 'Merge failed, rolled back to previous state',
      error: error.message
    });
  }
});

// Endpoint for getting conflict details
app.post('/data/conflicts', (req, res) => {
  const { clientData, baseRevision } = req.body || {};

  try {
    const baseData = getDataAtRevision(baseRevision) || appData;
    const conflicts = detectConflicts(baseData, clientData, appData);

    res.json({
      conflicts,
      canAutoResolve: conflicts.every(c => c.autoResolvable),
      suggestedResolution: conflicts.length > 0 ? 'merge' : 'direct_apply'
    });

  } catch (error) {
    res.status(500).json({ message: 'Error detecting conflicts' });
  }
});

function detectConflicts(baseData, clientData, serverData) {
  const conflicts = [];

  // Check for list conflicts
  const clientListMap = new Map((clientData.lists || []).map(l => [l.id, l]));
  const serverListMap = new Map((serverData.lists || []).map(l => [l.id, l]));
  const baseListMap = new Map((baseData.lists || []).map(l => [l.id, l]));

  for (const [listId, clientList] of clientListMap) {
    const serverList = serverListMap.get(listId);
    const baseList = baseListMap.get(listId);

    if (serverList && baseList) {
      // Check if both client and server modified the same list
      const clientModified = JSON.stringify(clientList) !== JSON.stringify(baseList);
      const serverModified = JSON.stringify(serverList) !== JSON.stringify(baseList);

      if (clientModified && serverModified) {
        conflicts.push({
          type: 'list_modification',
          listId,
          clientVersion: clientList,
          serverVersion: serverList,
          baseVersion: baseList,
          autoResolvable: isListConflictAutoResolvable(clientList, serverList, baseList)
        });
      }
    }
  }

  // Check for item conflicts within lists
  for (const [listId, clientList] of clientListMap) {
    const serverList = serverListMap.get(listId);
    if (serverList) {
      const itemConflicts = detectItemConflicts(clientList.items, serverList.items, listId);
      conflicts.push(...itemConflicts);
    }
  }

  return conflicts;
}

function isListConflictAutoResolvable(clientList, serverList, baseList) {
  // Simple heuristic: auto-resolvable if only one side changed the name
  // and the other side only changed items
  const clientNameChanged = clientList.name !== baseList.name;
  const serverNameChanged = serverList.name !== baseList.name;

  if (clientNameChanged && serverNameChanged) {
    return false; // Both changed name - needs manual resolution
  }

  return true; // Can merge automatically
}

function detectItemConflicts(clientItems, serverItems, listId) {
  const conflicts = [];
  const clientItemMap = new Map(clientItems.map(i => [i.id, i]));
  const serverItemMap = new Map(serverItems.map(i => [i.id, i]));

  for (const [itemId, clientItem] of clientItemMap) {
    const serverItem = serverItemMap.get(itemId);
    if (serverItem) {
      // Check for conflicting modifications
      const hasConflict = (
        clientItem.quantity !== serverItem.quantity ||
        clientItem.isChecked !== serverItem.isChecked
      );

      if (hasConflict) {
        conflicts.push({
          type: 'item_modification',
          listId,
          itemId,
          clientVersion: clientItem,
          serverVersion: serverItem,
          autoResolvable: clientItem.isChecked === serverItem.isChecked // Only quantity conflicts are auto-resolvable
        });
      }
    }
  }

  return conflicts;
}

// Enhanced rollback endpoint
app.post('/data/rollback', async (req, res) => {
  const { snapshotIndex, reason } = req.body || {};

  try {
    const success = rollbackToSnapshot(snapshotIndex);

    if (success) {
      await saveData(appData);

      io.emit('dataUpdated', {
        data: appData,
        rollback: true,
        reason
      });

      res.json({
        message: 'Successfully rolled back to previous state',
        revision: appData.revision
      });
    } else {
      res.status(404).json({ message: 'No snapshot available for rollback' });
    }

  } catch (error) {
    console.error('Rollback failed:', error);
    res.status(500).json({ message: 'Rollback operation failed' });
  }
});

// Health check endpoint with conflict statistics
app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    revision: appData.revision,
    connectedUsers: connectedUsers.size,
    activeEditors: activeEditors.size,
    pendingOperations: pendingOperations.size,
    recentOperations: appData.operations.length,
    snapshots: dataSnapshots.length,
    uptime: process.uptime()
  };

  res.json(health);
});

// Periodic cleanup of old operations and expired presence
setInterval(() => {
  // Clean up old operations (keep only last 24 hours)
  const cutoff = Date.now() - (24 * 60 * 60 * 1000);
  appData.operations = appData.operations.filter(op => op.timestamp > cutoff);

  // Clean up inactive users (no activity for 30 minutes)
  const inactiveCutoff = Date.now() - (30 * 60 * 1000);
  for (const [clientId, user] of connectedUsers) {
    if (new Date(user.lastActivity).getTime() < inactiveCutoff) {
      connectedUsers.delete(clientId);
    }
  }

  // Clean up stale editor locks (no activity for 5 minutes)
  const editorCutoff = Date.now() - (5 * 60 * 1000);
  for (const [key, editor] of activeEditors) {
    if (new Date(editor.startedAt).getTime() < editorCutoff) {
      activeEditors.delete(key);
    }
  }

}, 5 * 60 * 1000); // Run every 5 minutes

// Save snapshots periodically
setInterval(() => {
  saveSnapshot();
}, 10 * 60 * 1000); // Save snapshot every 10 minutes
