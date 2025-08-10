const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const clientUndoStacks = new Map(); // Per-client undo stacks
const clientRedoStacks = new Map(); // Per-client redo stacks

// Enhanced operational transform system
class OperationTransform {
  static transform(op1, op2) {
    // Transform two concurrent operations so they can be applied in any order
    if (op1.path === op2.path) {
      // Same path - handle specific conflicts
      return this.transformSamePath(op1, op2);
    } else if (this.pathsIntersect(op1.path, op2.path)) {
      // Related paths - handle hierarchical conflicts
      return this.transformRelatedPaths(op1, op2);
    } else {
      // Independent operations - no transform needed
      return [op1, op2];
    }
  }

  static transformSamePath(op1, op2) {
    // Handle operations on the same exact path
    if (op1.type === 'update' && op2.type === 'update') {
      // Merge updates by preferring the more recent one but preserving intentional changes
      const merged = this.mergeUpdates(op1, op2);
      return [merged, null]; // Second operation is absorbed
    } else if (op1.type === 'delete' || op2.type === 'delete') {
      // Delete wins over other operations
      const deleteOp = op1.type === 'delete' ? op1 : op2;
      return [deleteOp, null];
    } else if (op1.type === 'create' && op2.type === 'create') {
      // Merge creates by combining data
      const merged = this.mergeCreates(op1, op2);
      return [merged, null];
    }

    // Default: prefer the more recent operation
    return op1.timestamp > op2.timestamp ? [op1, null] : [op2, null];
  }

  static transformRelatedPaths(op1, op2) {
    // Handle operations on related paths (e.g., list and list item)
    const [parent1, child1] = this.splitPath(op1.path);
    const [parent2, child2] = this.splitPath(op2.path);

    if (parent1 === parent2) {
      // Same parent, different children - both can proceed
      return [op1, op2];
    }

    // For now, allow both operations
    return [op1, op2];
  }

  static mergeUpdates(op1, op2) {
    const mergedData = { ...op1.data };

    // Smart merge based on field types
    Object.keys(op2.data).forEach(key => {
      if (key === 'isChecked') {
        // For checked state, prefer the more recent explicit change
        mergedData[key] = op2.data[key];
      } else if (key === 'quantity') {
        // For quantity, prefer the larger value (user likely intended to increase)
        mergedData[key] = Math.max(op1.data[key] || 0, op2.data[key] || 0);
      } else if (key === 'notes') {
        // For notes, concatenate if both exist
        const notes1 = op1.data[key] || '';
        const notes2 = op2.data[key] || '';
        if (notes1 && notes2 && notes1 !== notes2) {
          mergedData[key] = `${notes1}; ${notes2}`;
        } else {
          mergedData[key] = notes2 || notes1;
        }
      } else {
        // Default: use the more recent value
        mergedData[key] = op2.data[key];
      }
    });

    return {
      ...op2,
      data: mergedData,
      description: `Merged: ${op1.description} + ${op2.description}`,
      merged: true
    };
  }

  static mergeCreates(op1, op2) {
    // If creating the same item, merge the data
    if (op1.data.id === op2.data.id) {
      return {
        ...op2,
        data: { ...op1.data, ...op2.data },
        description: `Merged creation: ${op1.description} + ${op2.description}`,
        merged: true
      };
    }

    // Different items - keep the more recent one
    return op2.timestamp > op1.timestamp ? op2 : op1;
  }

  static pathsIntersect(path1, path2) {
    const parts1 = path1.split('/');
    const parts2 = path2.split('/');

    // Check if one path is a parent of the other
    const minLength = Math.min(parts1.length, parts2.length);
    for (let i = 0; i < minLength; i++) {
      if (parts1[i] !== parts2[i]) {
        return false;
      }
    }
    return true;
  }

  static splitPath(path) {
    const parts = path.split('/');
    if (parts.length <= 1) return [path, null];
    return [parts.slice(0, -1).join('/'), parts[parts.length - 1]];
  }
}

// Enhanced undo/redo system
class UndoRedoManager {
  static addOperation(clientId, operation, description) {
    if (!clientUndoStacks.has(clientId)) {
      clientUndoStacks.set(clientId, []);
      clientRedoStacks.set(clientId, []);
    }

    const undoStack = clientUndoStacks.get(clientId);
    const redoStack = clientRedoStacks.get(clientId);

    // Add to undo stack
    undoStack.push({
      operation,
      description,
      timestamp: Date.now(),
      inverseOperation: this.createInverseOperation(operation)
    });

    // Limit stack size
    if (undoStack.length > 50) {
      undoStack.shift();
    }

    // Clear redo stack when new operation is added
    redoStack.length = 0;
  }

  static createInverseOperation(operation) {
    // Create the inverse operation for undo
    switch (operation.type) {
      case 'create':
        return {
          ...operation,
          type: 'delete',
          data: { id: operation.data.id }
        };
      case 'delete':
        return {
          ...operation,
          type: 'create',
          // Re-create using the full previous data snapshot if available
          data: operation.previousData ? JSON.parse(JSON.stringify(operation.previousData)) : operation.data
        };
      case 'update':
        // For update, we need the previous state (handled when applying)
        return {
          ...operation,
          type: 'update',
          data: operation.previousData || {}
        };
      default:
        return operation;
    }
  }

  static canUndo(clientId) {
    const stack = clientUndoStacks.get(clientId);
    return stack && stack.length > 0;
  }

  static canRedo(clientId) {
    const stack = clientRedoStacks.get(clientId);
    return stack && stack.length > 0;
  }

  static getUndoDescription(clientId) {
    const stack = clientUndoStacks.get(clientId);
    if (stack && stack.length > 0) {
      return stack[stack.length - 1].description;
    }
    return null;
  }

  static getRedoDescription(clientId) {
    const stack = clientRedoStacks.get(clientId);
    if (stack && stack.length > 0) {
      return stack[stack.length - 1].description;
    }
    return null;
  }

  static performUndo(clientId) {
    const undoStack = clientUndoStacks.get(clientId);
    const redoStack = clientRedoStacks.get(clientId);

    if (!undoStack || undoStack.length === 0) {
      return null;
    }

    const entry = undoStack.pop();
    redoStack.push(entry);

    return entry;
  }

  static performRedo(clientId) {
    const undoStack = clientUndoStacks.get(clientId);
    const redoStack = clientRedoStacks.get(clientId);

    if (!redoStack || redoStack.length === 0) {
      return null;
    }

    const entry = redoStack.pop();
    undoStack.push(entry);

    return entry;
  }

  static clearStacks(clientId) {
    clientUndoStacks.delete(clientId);
    clientRedoStacks.delete(clientId);
  }
}

// Create Express app
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Initialize database
init();

// Enhanced middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP to allow CDN resources
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'shopping-list-app')));

// Scheduled save with debouncing
let saveTimer = null;
const scheduleSave = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveData(appData);
    saveTimer = null;
  }, 2000);
};

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

// Helper function to get previous data for undo operations
function getPreviousDataForPath(path, previousState) {
  try {
    const parts = (path || '').split('/');
    if (!parts.length) return null;

    if (parts[0] === 'lists') {
      const listId = parts[1];
      const list = (previousState.lists || []).find(l => l.id === listId);
      if (!list) return null;
      if (parts.length === 2) {
        return JSON.parse(JSON.stringify(list));
      }
      if (parts[2] === 'items' && parts[3]) {
        const itemId = parts[3];
        const item = (list.items || []).find(i => i.id === itemId);
        return item ? JSON.parse(JSON.stringify(item)) : null;
      }
      return null;
    }

    if (parts[0] === 'globalItems') {
      const itemId = parts[1];
      const item = (previousState.globalItems || []).find(i => i.id === itemId);
      return item ? JSON.parse(JSON.stringify(item)) : null;
    }

    if (parts[0] === 'categories') {
      const categoryId = parts[1];
      const cat = (previousState.categories || []).find(c => c.id === categoryId);
      return cat ? JSON.parse(JSON.stringify(cat)) : null;
    }

    return null;
  } catch (e) {
    return null;
  }
}

// REST endpoint: GET /data – return the entire app state
app.get('/data', (req, res) => {
  res.json({
    ...appData,
    connectedUsers: Array.from(connectedUsers.values()),
    activeEditors: Object.fromEntries(activeEditors)
  });
});

// Enhanced REST endpoint: PUT /data with intelligent conflict resolution
app.put('/data', async (req, res) => {
  const { clientId, changeId, baseRevision, operations: clientOps, operationHistory, ...newData } = req.body || {};

  if (!validateDataStructure(newData)) {
    return res.status(400).json({ message: 'Invalid data structure' });
  }

  try {
    // Store previous state for undo operations
    const previousState = JSON.parse(JSON.stringify(appData));

    // Apply operational transforms to handle concurrent operations
    const transformedOps = [];
    const recentOperationIds = new Set(appData.operations.map(op => op.id));
    const recentServerOps = appData.operations.filter(op =>
      op.timestamp > Date.now() - 30000 && op.clientId !== clientId
    );

    if (clientOps && clientOps.length > 0) {
      for (const clientOp of clientOps) {
        // Skip duplicate operations already processed (prevents double-undo entries)
        if (clientOp && clientOp.id && recentOperationIds.has(clientOp.id)) {
          continue;
        }
        let transformedOp = clientOp;

        // Transform against recent server operations
        for (const serverOp of recentServerOps) {
          const [transformed1, transformed2] = OperationTransform.transform(transformedOp, serverOp);
          transformedOp = transformed1;
        }

        if (transformedOp) {
          // Store previous data for undo
          transformedOp.previousData = getPreviousDataForPath(transformedOp.path, previousState);
          transformedOps.push(transformedOp);
        }
      }
    }

    // Apply transformed operations
    let success = true;
    for (const op of transformedOps) {
      if (!applyOperation(op, appData)) {
        success = false;
        console.error('Failed to apply operation:', op);
      } else {
        // Add to undo system
        UndoRedoManager.addOperation(clientId, op, op.description);
      }
    }

    if (!success) {
      return res.status(400).json({ message: 'Failed to apply some operations' });
    }

    // Update revision and metadata
    const oldRevision = appData.revision;
    appData.revision = oldRevision + 1;
    appData.lastModified = new Date().toISOString();

    // Track operations (deduplicated)
    transformedOps.forEach(op => {
      if (!recentOperationIds.has(op.id)) {
        appData.operations.push({
          ...op,
          revision: appData.revision,
          serverTimestamp: Date.now()
        });
        recentOperationIds.add(op.id);
      }
    });
    appData.operations = appData.operations.slice(-200); // Keep more history

    scheduleSave();

    // Enhanced broadcasting with operation details
    broadcastSeamlessUpdate(clientId, changeId, transformedOps, appData);

    res.json({
      message: 'Operations applied successfully',
      revision: appData.revision,
      timestamp: appData.lastModified,
      appliedOperations: transformedOps.length,
      undoAvailable: UndoRedoManager.canUndo(clientId),
      redoAvailable: UndoRedoManager.canRedo(clientId),
      undoDescription: UndoRedoManager.getUndoDescription(clientId),
      redoDescription: UndoRedoManager.getRedoDescription(clientId)
    });

  } catch (error) {
    console.error('Error applying operations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Enhanced undo endpoint
app.post('/undo', (req, res) => {
  const { clientId } = req.body || {};

  if (!clientId) {
    return res.status(400).json({ message: 'Client ID required' });
  }

  const undoEntry = UndoRedoManager.performUndo(clientId);

  if (!undoEntry) {
    return res.status(404).json({ message: 'Nothing to undo' });
  }

  try {
    // Apply the inverse operation
    const success = applyOperation(undoEntry.inverseOperation, appData);

    if (success) {
      appData.revision++;
      appData.lastModified = new Date().toISOString();

      // Track the undo operation
      const undoOp = {
        ...undoEntry.inverseOperation,
        type: 'undo',
        description: `Undo: ${undoEntry.description}`,
        clientId,
        timestamp: Date.now(),
        revision: appData.revision
      };

      appData.operations.push(undoOp);
      scheduleSave();

      // Broadcast undo
      io.emit('undoPerformed', {
        clientId,
        operation: undoOp,
        description: undoEntry.description,
        data: appData
      });

      res.json({
        message: 'Undo successful',
        description: undoEntry.description,
        revision: appData.revision,
        undoAvailable: UndoRedoManager.canUndo(clientId),
        redoAvailable: UndoRedoManager.canRedo(clientId),
        undoDescription: UndoRedoManager.getUndoDescription(clientId),
        redoDescription: UndoRedoManager.getRedoDescription(clientId)
      });
    } else {
      res.status(500).json({ message: 'Failed to apply undo operation' });
    }
  } catch (error) {
    console.error('Undo operation failed:', error);
    res.status(500).json({ message: 'Undo operation failed' });
  }
});

// Enhanced redo endpoint
app.post('/redo', (req, res) => {
  const { clientId } = req.body || {};

  if (!clientId) {
    return res.status(400).json({ message: 'Client ID required' });
  }

  const redoEntry = UndoRedoManager.performRedo(clientId);

  if (!redoEntry) {
    return res.status(404).json({ message: 'Nothing to redo' });
  }

  try {
    // Apply the original operation
    const success = applyOperation(redoEntry.operation, appData);

    if (success) {
      appData.revision++;
      appData.lastModified = new Date().toISOString();

      // Track the redo operation
      const redoOp = {
        ...redoEntry.operation,
        type: 'redo',
        description: `Redo: ${redoEntry.description}`,
        clientId,
        timestamp: Date.now(),
        revision: appData.revision
      };

      appData.operations.push(redoOp);
      scheduleSave();

      // Broadcast redo
      io.emit('redoPerformed', {
        clientId,
        operation: redoOp,
        description: redoEntry.description,
        data: appData
      });

      res.json({
        message: 'Redo successful',
        description: redoEntry.description,
        revision: appData.revision,
        undoAvailable: UndoRedoManager.canUndo(clientId),
        redoAvailable: UndoRedoManager.canRedo(clientId),
        undoDescription: UndoRedoManager.getUndoDescription(clientId),
        redoDescription: UndoRedoManager.getRedoDescription(clientId)
      });
    } else {
      res.status(500).json({ message: 'Failed to apply redo operation' });
    }
  } catch (error) {
    console.error('Redo operation failed:', error);
    res.status(500).json({ message: 'Redo operation failed' });
  }
});

// Get undo/redo status for a client
app.get('/undo-status/:clientId', (req, res) => {
  const { clientId } = req.params;

  res.json({
    undoAvailable: UndoRedoManager.canUndo(clientId),
    redoAvailable: UndoRedoManager.canRedo(clientId),
    undoDescription: UndoRedoManager.getUndoDescription(clientId),
    redoDescription: UndoRedoManager.getRedoDescription(clientId)
  });
});

// Enhanced broadcasting for seamless updates
function broadcastSeamlessUpdate(clientId, changeId, operations, updatedData) {
  // Main data update
  io.emit('dataUpdated', {
    data: updatedData,
    clientId,
    changeId,
    operations,
    seamless: true
  });

  // Operation-specific broadcasts
  if (operations && operations.length > 0) {
    io.emit('operationsApplied', {
      operations,
      revision: updatedData.revision,
      clientId,
      seamless: true
    });
  }
}

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
  scheduleSave();
  io.emit('dataUpdated', { data: appData });
  res.json({ message: 'Data cleared' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    revision: appData.revision,
    connectedUsers: connectedUsers.size,
    activeEditors: activeEditors.size,
    uptime: process.uptime()
  });
});

// Enhanced WebSocket connection handling
io.on('connection', socket => {
  const clientId = socket.handshake.query.clientId || socket.id;

  console.log(`Client connected: ${clientId}`);

  // Send initial data including undo/redo status
  socket.emit('dataUpdated', {
    data: appData,
    connectedUsers: Array.from(connectedUsers.values()),
    activeEditors: Object.fromEntries(activeEditors),
    undoAvailable: UndoRedoManager.canUndo(clientId),
    redoAvailable: UndoRedoManager.canRedo(clientId),
    undoDescription: UndoRedoManager.getUndoDescription(clientId),
    redoDescription: UndoRedoManager.getRedoDescription(clientId)
  });

  // Handle real-time operations with transformation
  socket.on('operation', (operation) => {
    try {
      const op = {
        ...operation,
        serverTimestamp: Date.now(),
        clientId: clientId
      };

      // Capture previous data for reliable undo if not supplied by client
      op.previousData = op.previousData || getPreviousDataForPath(op.path, appData);

      // Transform against recent operations
      const recentOps = appData.operations.filter(serverOp =>
        serverOp.timestamp > Date.now() - 10000 && serverOp.clientId !== clientId
      );

      let transformedOp = op;
      for (const serverOp of recentOps) {
        const [transformed1] = OperationTransform.transform(transformedOp, serverOp);
        transformedOp = transformed1;
      }

      if (transformedOp && applyOperation(transformedOp)) {
        appData.operations.push(transformedOp);
        appData.revision++;

        // Add to undo system
        UndoRedoManager.addOperation(clientId, transformedOp, transformedOp.description);

        scheduleSave();

        // Acknowledge sender
        socket.emit('operationAck', {
          id: transformedOp.id,
          revision: appData.revision,
          undoAvailable: UndoRedoManager.canUndo(clientId),
          redoAvailable: UndoRedoManager.canRedo(clientId),
          undoDescription: UndoRedoManager.getUndoDescription(clientId),
          redoDescription: UndoRedoManager.getRedoDescription(clientId)
        });

        // Broadcast to others
        socket.broadcast.emit('operationReceived', transformedOp);
      }
    } catch (error) {
      console.error('Error handling operation:', error);
      socket.emit('operationError', { error: error.message });
    }
  });

  // Handle undo requests
  socket.on('requestUndo', () => {
    const undoEntry = UndoRedoManager.performUndo(clientId);

    if (undoEntry) {
      try {
        const success = applyOperation(undoEntry.inverseOperation, appData);

        if (success) {
          appData.revision++;

          const undoOp = {
            ...undoEntry.inverseOperation,
            type: 'undo',
            description: `Undo: ${undoEntry.description}`,
            clientId,
            timestamp: Date.now()
          };

          appData.operations.push(undoOp);
          scheduleSave();

          // Send undo result to requester
          socket.emit('undoResult', {
            success: true,
            description: undoEntry.description,
            undoAvailable: UndoRedoManager.canUndo(clientId),
            redoAvailable: UndoRedoManager.canRedo(clientId),
            undoDescription: UndoRedoManager.getUndoDescription(clientId),
            redoDescription: UndoRedoManager.getRedoDescription(clientId)
          });

          // Broadcast to others
          socket.broadcast.emit('operationReceived', undoOp);
          io.emit('dataUpdated', { data: appData, source: 'undo' });
        }
      } catch (error) {
        socket.emit('undoResult', { success: false, error: error.message });
      }
    } else {
      socket.emit('undoResult', { success: false, message: 'Nothing to undo' });
    }
  });

  // Handle redo requests
  socket.on('requestRedo', () => {
    const redoEntry = UndoRedoManager.performRedo(clientId);

    if (redoEntry) {
      try {
        const success = applyOperation(redoEntry.operation, appData);

        if (success) {
          appData.revision++;

          const redoOp = {
            ...redoEntry.operation,
            type: 'redo',
            description: `Redo: ${redoEntry.description}`,
            clientId,
            timestamp: Date.now()
          };

          appData.operations.push(redoOp);
          scheduleSave();

          // Send redo result to requester
          socket.emit('redoResult', {
            success: true,
            description: redoEntry.description,
            undoAvailable: UndoRedoManager.canUndo(clientId),
            redoAvailable: UndoRedoManager.canRedo(clientId),
            undoDescription: UndoRedoManager.getUndoDescription(clientId),
            redoDescription: UndoRedoManager.getRedoDescription(clientId)
          });

          // Broadcast to others
          socket.broadcast.emit('operationReceived', redoOp);
          io.emit('dataUpdated', { data: appData, source: 'redo' });
        }
      } catch (error) {
        socket.emit('redoResult', { success: false, error: error.message });
      }
    } else {
      socket.emit('redoResult', { success: false, message: 'Nothing to redo' });
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

    // Clean up undo/redo stacks after 1 hour of inactivity
    setTimeout(() => {
      if (!connectedUsers.has(clientId)) {
        UndoRedoManager.clearStacks(clientId);
      }
    }, 60 * 60 * 1000);

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
