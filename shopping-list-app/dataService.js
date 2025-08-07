// DataService provides an abstraction layer over data persistence with enhanced
// conflict resolution, operational transforms, and real-time collaboration features.

const STORAGE_KEY = 'shoppingListData';

const DataService = {
    // Configuration
    useServer: true,
    serverBaseUrl: window.location.origin,

    // Connection state
    socket: null,
    isConnected: false,

    // Client identification and change tracking
    clientId: Math.random().toString(36).slice(2),
    pendingOperations: [],
    operationQueue: [],
    saveTimer: null,
    lastRevision: 0,
    baseRevision: 0,

    // Enhanced conflict resolution
    pendingChangeIds: new Set(),
    conflictResolver: null,
    retryQueue: [],
    maxRetries: 3,

    // Presence tracking
    connectedUsers: [],
    activeEditors: {},
    currentUser: null,

    // Connection management
    connectionState: 'disconnected', // disconnected, connecting, connected, error
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    createOperation(type, path, data) {
        return {
            id: this.generateId(),
            type,
            path,
            data: JSON.parse(JSON.stringify(data)),
            clientId: this.clientId,
            timestamp: Date.now(),
            baseRevision: this.baseRevision
        };
    },

    // Enhanced merging with better conflict detection
    mergeData(serverData, localData) {
        const merged = {
            ...serverData,
            lists: this.mergeListsAdvanced(serverData.lists || [], localData.lists || []),
            globalItems: this.mergeById(serverData.globalItems || [], localData.globalItems || []),
            categories: this.mergeById(serverData.categories || [], localData.categories || []),
            archivedLists: this.mergeListsAdvanced(serverData.archivedLists || [], localData.archivedLists || []),
            receipts: localData.receipts && localData.receipts.length ? localData.receipts : (serverData.receipts || []),
            revision: serverData.revision || this.lastRevision
        };

        // Detect conflicts and store them for user resolution if needed
        const conflicts = this.detectConflicts(serverData, localData);
        if (conflicts.length > 0) {
            merged._conflicts = conflicts;
        }

        return merged;
    },

    mergeListsAdvanced(serverLists, localLists) {
        const map = new Map();

        // Add server lists first
        serverLists.forEach(list => {
            map.set(list.id, {
                ...list,
                _source: 'server',
                _lastModified: list.updatedAt || list.createdAt
            });
        });

        // Merge in local changes with conflict detection
        localLists.forEach(localList => {
            const existing = map.get(localList.id);
            if (existing) {
                // Advanced merging with timestamp comparison
                const serverTime = new Date(existing._lastModified || 0).getTime();
                const localTime = new Date(localList.updatedAt || localList.createdAt || 0).getTime();

                if (localTime > serverTime) {
                    // Local is newer, use local data but merge items carefully
                    map.set(localList.id, {
                        ...existing,
                        ...localList,
                        items: this.mergeItemsAdvanced(existing.items || [], localList.items || []),
                        _source: 'merged',
                        _serverVersion: existing
                    });
                } else {
                    // Server is newer or same, but still merge items
                    map.set(localList.id, {
                        ...existing,
                        items: this.mergeItemsAdvanced(existing.items || [], localList.items || []),
                        _source: 'server_preferred'
                    });
                }
            } else {
                map.set(localList.id, { ...localList, _source: 'local' });
            }
        });

        return Array.from(map.values()).map(list => {
            // Clean up merge metadata
            const { _source, _serverVersion, _lastModified, ...cleanList } = list;
            return cleanList;
        });
    },

    mergeItemsAdvanced(serverItems, localItems) {
        const map = new Map();

        // Add server items
        serverItems.forEach(item => {
            map.set(item.id, { ...item, _source: 'server' });
        });

        // Merge local items with intelligent conflict resolution
        localItems.forEach(localItem => {
            const existing = map.get(localItem.id);
            if (existing) {
                // Merge item properties intelligently
                const merged = {
                    ...existing,
                    // Prefer local changes for user-modifiable fields
                    quantity: localItem.quantity,
                    notes: localItem.notes || existing.notes,
                    actualPrice: localItem.actualPrice !== undefined ? localItem.actualPrice : existing.actualPrice,
                    // Use server state for collaborative fields
                    isChecked: existing.isChecked,
                    _source: 'merged'
                };
                map.set(localItem.id, merged);
            } else {
                map.set(localItem.id, { ...localItem, _source: 'local' });
            }
        });

        return Array.from(map.values()).map(item => {
            const { _source, ...cleanItem } = item;
            return cleanItem;
        });
    },

    detectConflicts(serverData, localData) {
        const conflicts = [];

        // Check for conflicting list modifications
        if (serverData.lists && localData.lists) {
            for (const localList of localData.lists) {
                const serverList = serverData.lists.find(l => l.id === localList.id);
                if (serverList && this.hasConflictingChanges(serverList, localList)) {
                    conflicts.push({
                        type: 'list_conflict',
                        id: localList.id,
                        serverVersion: serverList,
                        localVersion: localList,
                        autoResolvable: this.isConflictAutoResolvable(serverList, localList)
                    });
                }
            }
        }

        return conflicts;
    },

    hasConflictingChanges(serverItem, localItem) {
        // Enhanced conflict detection with multiple criteria
        const serverTime = new Date(serverItem.updatedAt || 0).getTime();
        const localTime = new Date(localItem.updatedAt || 0).getTime();
        const timeDiff = Math.abs(serverTime - localTime);

        // Consider it a conflict if:
        // 1. Modified within 30 seconds of each other AND
        // 2. Different names OR different item counts
        return timeDiff < 30000 && (
            serverItem.name !== localItem.name ||
            (serverItem.items?.length || 0) !== (localItem.items?.length || 0)
        );
    },

    isConflictAutoResolvable(serverItem, localItem) {
        // Auto-resolvable if only one type of change occurred
        const nameChanged = serverItem.name !== localItem.name;
        const itemsChanged = JSON.stringify(serverItem.items || []) !== JSON.stringify(localItem.items || []);

        // Can auto-resolve if only one aspect changed
        return nameChanged !== itemsChanged;
    },

    mergeById(serverArr = [], localArr = []) {
        const map = new Map();

        // Add server items first
        serverArr.forEach(item => {
            map.set(item.id, { ...item, _source: 'server' });
        });

        // Merge in local changes
        localArr.forEach(item => {
            const existing = map.get(item.id);
            if (existing) {
                // Merge fields, preferring local changes for user-modified fields
                map.set(item.id, {
                    ...existing,
                    ...item,
                    _source: 'merged',
                    _serverVersion: existing
                });
            } else {
                map.set(item.id, { ...item, _source: 'local' });
            }
        });

        return Array.from(map.values()).map(item => {
            // Clean up merge metadata
            const { _source, _serverVersion, ...cleanItem } = item;
            return cleanItem;
        });
    },

    /**
     * Enhanced load data with connection state management
     */
    async loadData() {
        if (this.useServer && this.serverBaseUrl) {
            try {
                this.connectionState = 'connecting';
                const resp = await fetch(`${this.serverBaseUrl}/data`);

                if (resp.ok) {
                    const data = await resp.json();
                    this.lastRevision = data.revision || 0;
                    this.baseRevision = this.lastRevision;
                    this.connectionState = 'connected';
                    this.reconnectAttempts = 0;

                    // Update presence info
                    this.connectedUsers = data.connectedUsers || [];
                    this.activeEditors = data.activeEditors || {};

                    return data;
                }

                console.warn('Remote load failed with status', resp.status, '- falling back to localStorage');
                this.connectionState = 'error';
            } catch (err) {
                console.error('Failed to load data from server:', err);
                this.connectionState = 'error';
                this.useServer = false;
                this.scheduleReconnect();
            }
        }

        // Fallback to localStorage
        try {
            const jsonStr = window.localStorage.getItem(STORAGE_KEY);
            if (!jsonStr) return null;
            const data = JSON.parse(jsonStr);
            this.lastRevision = data.revision || 0;
            this.baseRevision = this.lastRevision;
            return data;
        } catch (err) {
            console.error('Failed to load data from localStorage', err);
            return null;
        }
    },

    /**
     * Enhanced save with retry logic and conflict resolution
     */
    saveData(dataObj, operations = []) {
        // Apply optimistic updates immediately
        this.updateLocalStorage(dataObj);

        if (this.useServer && this.serverBaseUrl && this.connectionState === 'connected') {
            // Queue operations for batch sending
            this.operationQueue.push(...operations);

            // Debounced save to server with retry logic
            if (!this.saveTimer) {
                this.saveTimer = setTimeout(() => this.flushToServerWithRetry(dataObj), 300);
            }
        } else if (this.useServer && this.connectionState === 'error') {
            // Queue for retry when connection is restored
            this.retryQueue.push({ dataObj, operations, timestamp: Date.now() });
        }
    },

    async flushToServerWithRetry(dataObj, retryCount = 0) {
        this.saveTimer = null;

        if (!this.operationQueue.length && !dataObj) return;

        const operations = [...this.operationQueue];
        this.operationQueue = [];

        const changeId = this.generateId();
        this.pendingChangeIds.add(changeId);

        const payload = {
            ...dataObj,
            clientId: this.clientId,
            changeId,
            baseRevision: this.baseRevision,
            operations
        };

        try {
            const resp = await fetch(`${this.serverBaseUrl}/data`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (resp.status === 409) {
                // Conflict detected - server sent merged data
                const mergedData = await resp.json();
                await this.handleConflict(mergedData, dataObj);
            } else if (!resp.ok) {
                const errorMsg = `Server responded with status ${resp.status}`;
                console.error(errorMsg);
                this.handleSaveFailure(dataObj, operations);
                return;
            } else {
                // Success
                const result = await resp.json();
                this.lastRevision = result.revision;
                this.baseRevision = this.lastRevision;
                this.pendingChangeIds.delete(changeId);

                // Process any queued retries
                this.processRetryQueue();
            }
        } catch (err) {
            console.error('Failed to save data to server:', err);

            if (retryCount < this.maxRetries) {
                console.log(`Retrying save attempt ${retryCount + 1}/${this.maxRetries}`);
                setTimeout(() => {
                    this.flushToServerWithRetry(dataObj, retryCount + 1);
                }, Math.pow(2, retryCount) * 1000); // Exponential backoff
            } else {
                this.handleSaveFailure(dataObj, operations);
            }
        }
    },

    async processRetryQueue() {
        if (this.retryQueue.length === 0) return;

        console.log(`Processing ${this.retryQueue.length} queued operations`);

        // Sort by timestamp and process in order
        this.retryQueue.sort((a, b) => a.timestamp - b.timestamp);

        for (const { dataObj } of this.retryQueue) {
            try {
                await this.flushToServerWithRetry(dataObj);
            } catch (err) {
                console.error('Failed to process queued operation:', err);
            }
        }

        this.retryQueue = [];
    },

    async handleConflict(mergedData, originalData) {
        console.log('Handling conflict with merged data');

        // Update our local state with merged data
        this.lastRevision = mergedData.revision;
        this.baseRevision = this.lastRevision;
        this.updateLocalStorage(mergedData);

        // Check if we have a conflict resolver callback
        if (typeof this.conflictResolver === 'function') {
            const resolved = await this.conflictResolver(mergedData, originalData);
            if (resolved) {
                // User resolved conflicts, save again
                this.saveData(resolved);
                return;
            }
        }

        // Auto-accept merged data and notify UI
        if (typeof window.onRemoteDataUpdated === 'function') {
            window.onRemoteDataUpdated(mergedData);
        }

        // Show user notification about conflict resolution
        this.showConflictNotification();
    },

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`Scheduling reconnection attempt ${this.reconnectAttempts + 1} in ${delay}ms`);

        setTimeout(async () => {
            this.reconnectAttempts++;
            try {
                const resp = await fetch(`${this.serverBaseUrl}/health`);
                if (resp.ok) {
                    console.log('Server connection restored');
                    this.useServer = true;
                    this.connectionState = 'connected';
                    this.reconnectAttempts = 0;

                    // Process any queued operations
                    this.processRetryQueue();

                    // Reinitialize socket connection
                    this.initSocket();
                } else {
                    this.scheduleReconnect();
                }
            } catch (err) {
                console.log('Reconnection failed, will retry');
                this.scheduleReconnect();
            }
        }, delay);
    },

    /**
     * Send granular operations for real-time updates
     */
    async sendOperations(operations) {
        if (!this.useServer || !operations.length) return;

        // Use Socket.IO for real-time operations if available
        if (this.socket && this.socket.connected) {
            this.socket.emit('operation', operations[0]); // Send one operation at a time
            return;
        }
        // If no socket, do nothing (server does not support /operations REST endpoint)
    },

    /**
     * Enhanced presence tracking
     */
    async updatePresence(action, listId = null, itemId = null) {
        if (!this.useServer) return;

        try {
            await fetch(`${this.serverBaseUrl}/presence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: this.clientId,
                    userId: this.currentUser?.name || `User-${this.clientId.slice(-8)}`,
                    action,
                    listId,
                    itemId
                })
            });
        } catch (err) {
            console.error('Failed to update presence:', err);
        }
    },

    setCurrentUser(user) {
        this.currentUser = user;
    },

    getActiveEditors(listId, itemId = null) {
        const key = itemId ? `${listId}/${itemId}` : listId;
        return this.activeEditors[key];
    },

    isBeingEdited(listId, itemId = null) {
        const editor = this.getActiveEditors(listId, itemId);
        return editor && editor.clientId !== this.clientId;
    },

    /**
     * Enhanced WebSocket initialization with presence and operations
     */
    initSocket() {
        if (!this.useServer || !this.serverBaseUrl || this.socket) return;

        if (typeof io === 'undefined') {
            console.warn('Socket.io client library not loaded');
            return;
        }

        this.socket = io(this.serverBaseUrl, {
            query: { clientId: this.clientId }
        });

        this.socket.on('connect', () => {
            console.log('Connected to shopping list server');
            this.isConnected = true;

            // Send initial presence
            this.updatePresence('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
        });

        this.socket.on('dataUpdated', (payload) => {
            this.handleRemoteDataUpdate(payload);
        });

        this.socket.on('operationsApplied', (payload) => {
            this.handleRemoteOperations(payload);
        });

        this.socket.on('operationReceived', (operation) => {
            this.handleRemoteOperation(operation);
        });

        this.socket.on('presenceUpdate', (payload) => {
            this.connectedUsers = payload.connectedUsers || [];
            this.activeEditors = payload.activeEditors || {};

            // Notify UI about presence changes
            if (typeof window.onPresenceUpdated === 'function') {
                window.onPresenceUpdated(this.connectedUsers, this.activeEditors);
            }
        });
    },

    handleRemoteDataUpdate(payload) {
        const remoteData = payload.data || payload;

        // Ignore our own updates
        if (payload.clientId === this.clientId && this.pendingChangeIds.has(payload.changeId)) {
            this.pendingChangeIds.delete(payload.changeId);
            return;
        }

        // Check revision to avoid stale updates
        if (remoteData.revision != null && remoteData.revision <= this.lastRevision) {
            return;
        }

        this.lastRevision = remoteData.revision || this.lastRevision;
        this.baseRevision = this.lastRevision;

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
        } catch (err) {
            console.error('Failed to update localStorage from server', err);
        }

        if (typeof window.onRemoteDataUpdated === 'function') {
            window.onRemoteDataUpdated(remoteData);
        }
    },

    handleRemoteOperations(payload) {
        if (payload.clientId === this.clientId) return;

        // Apply operations and notify UI
        this.lastRevision = payload.revision;

        if (typeof window.onRemoteOperationsApplied === 'function') {
            window.onRemoteOperationsApplied(payload.operations);
        }
    },

    handleRemoteOperation(operation) {
        if (operation.clientId === this.clientId) return;

        // Apply single operation and notify UI
        if (typeof window.onRemoteOperationReceived === 'function') {
            window.onRemoteOperationReceived(operation);
        }
    },

    async clearData() {
        if (this.useServer && this.serverBaseUrl) {
            try {
                const resp = await fetch(`${this.serverBaseUrl}/data/clear`, { method: 'POST' });
                if (resp.ok) {
                    this.lastRevision = 0;
                    this.baseRevision = 0;
                    return;
                }
                console.warn('Remote clear failed with status', resp.status);
            } catch (err) {
                console.error('Failed to clear data via server:', err);
            }
        }

        try {
            window.localStorage.removeItem(STORAGE_KEY);
            this.lastRevision = 0;
            this.baseRevision = 0;
        } catch (err) {
            console.error('Failed to clear localStorage', err);
        }
    },

    updateLocalStorage(dataObj) {
        try {
            const json = JSON.stringify(dataObj);
            window.localStorage.setItem(STORAGE_KEY, json);
        } catch (err) {
            console.error('Failed to save data to localStorage', err);
        }
    },

    handleSaveFailure(dataObj, operations) {
        console.warn('Save failed, falling back to localStorage');
        this.connectionState = 'error';
        this.updateLocalStorage(dataObj);

        // Re-queue operations for when connection is restored
        this.operationQueue.unshift(...operations);

        // Schedule reconnection attempt
        this.scheduleReconnect();
    },

    showConflictNotification() {
        // Create a more sophisticated notification with action buttons
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff9800, #f57c00);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="flex-shrink: 0; font-size: 20px;">⚠️</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">Changes Merged</div>
                    <div style="font-size: 14px; opacity: 0.9; line-height: 1.4;">
                        Your changes were automatically merged with updates from other users.
                    </div>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="margin-top: 8px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Dismiss
                    </button>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    },

    /**
     * Enhanced connection status indicator
     */
    getConnectionStatus() {
        return {
            state: this.connectionState,
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            pendingOperations: this.operationQueue.length + this.retryQueue.length,
            lastRevision: this.lastRevision,
            connectedUsers: this.connectedUsers.length
        };
    },

    /**
     * Manual conflict resolution helper
     */
    async resolveConflict(conflictData, resolution) {
        try {
            const resp = await fetch(`${this.serverBaseUrl}/data/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientData: resolution,
                    baseRevision: this.baseRevision,
                    clientId: this.clientId
                })
            });

            if (resp.ok) {
                const result = await resp.json();
                this.lastRevision = result.revision;
                this.baseRevision = this.lastRevision;

                if (typeof window.onRemoteDataUpdated === 'function') {
                    window.onRemoteDataUpdated(result.mergedData);
                }

                return result;
            } else {
                const errorMsg = `Merge failed with status ${resp.status}`;
                console.error(errorMsg);
                return null;
            }
        } catch (err) {
            console.error('Failed to resolve conflict:', err);
            return null;
        }
    },

    /**
     * Batch operation helper for complex updates
     */
    createBatchOperation(operations) {
        return {
            id: this.generateId(),
            type: 'batch',
            operations: operations.map(op => ({
                ...op,
                clientId: this.clientId,
                timestamp: Date.now()
            })),
            clientId: this.clientId,
            timestamp: Date.now(),
            baseRevision: this.baseRevision
        };
    },

    /**
     * Data validation helper
     */
    validateData(data) {
        if (!data || typeof data !== 'object') return false;

        const requiredFields = ['lists', 'globalItems', 'categories', 'archivedLists', 'receipts'];
        for (const field of requiredFields) {
            if (!Array.isArray(data[field])) return false;
        }

        // Validate lists structure
        for (const list of data.lists) {
            if (!list.id || !list.name || !Array.isArray(list.items)) return false;

            for (const item of list.items) {
                if (!item.id || !item.globalItemId) return false;
                if (typeof item.quantity !== 'number' || item.quantity <= 0) return false;
            }
        }

        return true;
    },

    /**
     * Performance monitoring
     */
    getPerformanceMetrics() {
        return {
            totalOperations: this.pendingOperations.length,
            queuedOperations: this.operationQueue.length,
            retryQueueSize: this.retryQueue.length,
            pendingChanges: this.pendingChangeIds.size,
            connectionState: this.connectionState,
            lastSyncTime: this.lastRevision,
            reconnectAttempts: this.reconnectAttempts
        };
    }
};

// Global exposure
window.DataService = DataService;
