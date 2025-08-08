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
    inFlightOperation: null,
    saveTimer: null,
    lastRevision: 0,
    baseRevision: 0,

    // Server-side undo/redo state
    serverUndoAvailable: false,
    serverRedoAvailable: false,
    serverUndoDescription: null,
    serverRedoDescription: null,

    // Presence tracking
    connectedUsers: [],
    activeEditors: {},
    currentUser: null,

    // Connection management
    connectionState: 'disconnected',
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    createOperation(type, path, data, description = null) {
        const operation = {
            id: this.generateId(),
            type,
            path,
            data: JSON.parse(JSON.stringify(data)),
            clientId: this.clientId,
            timestamp: Date.now(),
            baseRevision: this.baseRevision,
            description: description || this.generateOperationDescription(type, path, data)
        };

        return operation;
    },

    generateOperationDescription(type, path, data) {
        try {
            const pathParts = path.split('/');

            switch (type) {
                case 'create':
                    if (path === 'lists') {
                        return `Created list "${data.name}"`;
                    } else if (path === 'globalItems') {
                        return `Created item "${data.name}"`;
                    } else if (path === 'categories') {
                        return `Created category "${data.names?.en || data.id}"`;
                    } else if (pathParts[2] === 'items') {
                        return `Added item to list`;
                    }
                    break;

                case 'update':
                    if (pathParts[0] === 'lists' && pathParts.length === 2) {
                        return `Renamed list to "${data.name}"`;
                    } else if (pathParts[2] === 'items') {
                        return `Updated item`;
                    } else if (pathParts[0] === 'globalItems') {
                        return `Updated item "${data.name}"`;
                    }
                    break;

                case 'delete':
                    if (pathParts[0] === 'lists' && pathParts.length === 2) {
                        return `Deleted list`;
                    } else if (pathParts[2] === 'items') {
                        return `Removed item from list`;
                    } else if (pathParts[0] === 'globalItems') {
                        return `Deleted global item`;
                    }
                    break;

                case 'toggle':
                    if (pathParts[2] === 'items') {
                        return data.isChecked ? `Checked item` : `Unchecked item`;
                    }
                    break;
            }

            return `${type.charAt(0).toUpperCase() + type.slice(1)} operation`;
        } catch (error) {
            return `${type} operation`;
        }
    },

    // Enhanced load data - no more conflicts, always seamless
    async loadData() {
        if (this.useServer && this.serverBaseUrl) {
            try {
                this.connectionState = 'connecting';
                const resp = await fetch(`${this.serverBaseUrl}/data`);

                if (resp.ok) {
                    const serverData = await resp.json();
                    this.lastRevision = serverData.revision || 0;
                    this.baseRevision = this.lastRevision;
                    this.connectionState = 'connected';
                    this.reconnectAttempts = 0;

                    // Update presence info
                    this.connectedUsers = serverData.connectedUsers || [];
                    this.activeEditors = serverData.activeEditors || {};

                    // Update undo/redo state from server
                    this.serverUndoAvailable = serverData.undoAvailable || false;
                    this.serverRedoAvailable = serverData.redoAvailable || false;
                    this.serverUndoDescription = serverData.undoDescription || null;
                    this.serverRedoDescription = serverData.redoDescription || null;

                    return serverData;
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

        return this.getLocalStorageData();
    },

    getLocalStorageData() {
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

    // Enhanced save with seamless conflict resolution
    saveData(dataObj, operations = []) {
        // Apply optimistic updates immediately
        this.updateLocalStorage(dataObj);

        if (this.useServer && this.serverBaseUrl && this.connectionState === 'connected') {
            // Queue operations for batch sending
            this.operationQueue.push(...operations);

            // Debounced save to server with seamless conflict resolution
            if (!this.saveTimer) {
                this.saveTimer = setTimeout(() => this.flushToServerSeamlessly(dataObj), 300);
            }
        } else if (this.useServer && this.connectionState === 'error') {
            // Queue for retry when connection is restored
            this.retryQueue = this.retryQueue || [];
            this.retryQueue.push({ dataObj, operations, timestamp: Date.now() });
        }
    },

    async flushToServerSeamlessly(dataObj, retryCount = 0) {
        this.saveTimer = null;

        if (!this.operationQueue.length && !dataObj) return;

        const operations = [...this.operationQueue];
        this.operationQueue = [];

        const changeId = this.generateId();

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

            if (resp.status === 200) {
                // Success
                const result = await resp.json();
                this.lastRevision = result.revision;
                this.baseRevision = this.lastRevision;

                // Update undo/redo state
                this.serverUndoAvailable = result.undoAvailable || false;
                this.serverRedoAvailable = result.redoAvailable || false;
                this.serverUndoDescription = result.undoDescription || null;
                this.serverRedoDescription = result.redoDescription || null;

                // Notify UI about undo/redo state changes
                if (typeof window.onUndoRedoStateChanged === 'function') {
                    window.onUndoRedoStateChanged({
                        undoAvailable: this.serverUndoAvailable,
                        redoAvailable: this.serverRedoAvailable,
                        undoDescription: this.serverUndoDescription,
                        redoDescription: this.serverRedoDescription
                    });
                }

                // Show merge notification if operations were merged
                if (result.appliedOperations !== operations.length) {
                    this.showMergeNotification(operations.length, result.appliedOperations);
                }
            } else {
                // Server will handle all conflicts seamlessly - no 409 conflicts anymore
                console.error(`Server responded with status ${resp.status}`);
                this.handleSaveFailure(dataObj, operations);
                return;
            }

            // Process any queued retries
            this.processRetryQueue();
        } catch (err) {
            console.error('Failed to save data to server:', err);

            if (retryCount < 3) {
                console.log(`Retrying save attempt ${retryCount + 1}/3`);
                setTimeout(() => {
                    this.flushToServerSeamlessly(dataObj, retryCount + 1);
                }, Math.pow(2, retryCount) * 1000);
            } else {
                this.handleSaveFailure(dataObj, operations);
            }
        }
    },

    showMergeNotification(requested, applied) {
        if (typeof window.showUpdateNotification === 'function') {
            const message = applied < requested ?
                `${applied}/${requested} changes applied (some merged automatically)` :
                `${applied} changes applied seamlessly`;
            window.showUpdateNotification(message, 'success');
        }
    },

    // Server-side undo/redo functions
    async performUndo() {
        if (!this.useServer || !this.serverUndoAvailable) {
            return null;
        }

        try {
            const resp = await fetch(`${this.serverBaseUrl}/undo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: this.clientId })
            });

            if (resp.ok) {
                const result = await resp.json();

                // Update undo/redo state
                this.serverUndoAvailable = result.undoAvailable || false;
                this.serverRedoAvailable = result.redoAvailable || false;
                this.serverUndoDescription = result.undoDescription || null;
                this.serverRedoDescription = result.redoDescription || null;

                // Show undo notification
                if (typeof window.showUndoNotification === 'function') {
                    window.showUndoNotification(result.description, 'undo');
                }

                return result;
            } else {
                const error = await resp.json();
                console.error('Undo failed:', error.message);
                return null;
            }
        } catch (error) {
            console.error('Undo request failed:', error);
            return null;
        }
    },

    async performRedo() {
        if (!this.useServer || !this.serverRedoAvailable) {
            return null;
        }

        try {
            const resp = await fetch(`${this.serverBaseUrl}/redo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: this.clientId })
            });

            if (resp.ok) {
                const result = await resp.json();

                // Update undo/redo state
                this.serverUndoAvailable = result.undoAvailable || false;
                this.serverRedoAvailable = result.redoAvailable || false;
                this.serverUndoDescription = result.undoDescription || null;
                this.serverRedoDescription = result.redoDescription || null;

                // Show redo notification
                if (typeof window.showUndoNotification === 'function') {
                    window.showUndoNotification(result.description, 'redo');
                }

                return result;
            } else {
                const error = await resp.json();
                console.error('Redo failed:', error.message);
                return null;
            }
        } catch (error) {
            console.error('Redo request failed:', error);
            return null;
        }
    },

    canUndo() {
        return this.serverUndoAvailable;
    },

    canRedo() {
        return this.serverRedoAvailable;
    },

    getUndoDescription() {
        return this.serverUndoDescription;
    },

    getRedoDescription() {
        return this.serverRedoDescription;
    },

    // Send real-time operations for immediate updates
    async sendOperations(operations) {
        if (!this.useServer || !operations.length) return;

        this.pendingOperations.push(...operations);
        this.flushSocketQueue();
    },

    flushSocketQueue() {
        if (!this.socket || !this.socket.connected) return;
        if (this.inFlightOperation || this.pendingOperations.length === 0) return;

        const op = this.pendingOperations[0];
        this.inFlightOperation = op;
        this.socket.emit('operation', op);
    },

    // Enhanced presence tracking
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

    // Enhanced WebSocket initialization
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

            this.flushSocketQueue();

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

        this.socket.on('operationAck', (ack) => {
            if (this.inFlightOperation && ack.id === this.inFlightOperation.id) {
                this.lastRevision = ack.revision || this.lastRevision;
                this.baseRevision = this.lastRevision;

                // Update undo/redo state
                this.serverUndoAvailable = ack.undoAvailable || false;
                this.serverRedoAvailable = ack.redoAvailable || false;
                this.serverUndoDescription = ack.undoDescription || null;
                this.serverRedoDescription = ack.redoDescription || null;

                // Notify UI about undo/redo state changes
                if (typeof window.onUndoRedoStateChanged === 'function') {
                    window.onUndoRedoStateChanged({
                        undoAvailable: this.serverUndoAvailable,
                        redoAvailable: this.serverRedoAvailable,
                        undoDescription: this.serverUndoDescription,
                        redoDescription: this.serverRedoDescription
                    });
                }

                this.pendingOperations.shift();
                this.inFlightOperation = null;
                this.flushSocketQueue();
            }
        });

        this.socket.on('presenceUpdate', (payload) => {
            this.connectedUsers = payload.connectedUsers || [];
            this.activeEditors = payload.activeEditors || {};

            // Notify UI about presence changes
            if (typeof window.onPresenceUpdated === 'function') {
                window.onPresenceUpdated(this.connectedUsers, this.activeEditors);
            }
        });

        this.socket.on('undoResult', (result) => {
            if (result.success) {
                // Update undo/redo state
                this.serverUndoAvailable = result.undoAvailable || false;
                this.serverRedoAvailable = result.redoAvailable || false;
                this.serverUndoDescription = result.undoDescription || null;
                this.serverRedoDescription = result.redoDescription || null;

                // Show undo notification
                if (typeof window.showUndoNotification === 'function') {
                    window.showUndoNotification(result.description, 'undo');
                }

                // Notify UI about undo/redo state changes
                if (typeof window.onUndoRedoStateChanged === 'function') {
                    window.onUndoRedoStateChanged({
                        undoAvailable: this.serverUndoAvailable,
                        redoAvailable: this.serverRedoAvailable,
                        undoDescription: this.serverUndoDescription,
                        redoDescription: this.serverRedoDescription
                    });
                }
            }
        });

        this.socket.on('redoResult', (result) => {
            if (result.success) {
                // Update undo/redo state
                this.serverUndoAvailable = result.undoAvailable || false;
                this.serverRedoAvailable = result.redoAvailable || false;
                this.serverUndoDescription = result.undoDescription || null;
                this.serverRedoDescription = result.redoDescription || null;

                // Show redo notification
                if (typeof window.showUndoNotification === 'function') {
                    window.showUndoNotification(result.description, 'redo');
                }

                // Notify UI about undo/redo state changes
                if (typeof window.onUndoRedoStateChanged === 'function') {
                    window.onUndoRedoStateChanged({
                        undoAvailable: this.serverUndoAvailable,
                        redoAvailable: this.serverRedoAvailable,
                        undoDescription: this.serverUndoDescription,
                        redoDescription: this.serverRedoDescription
                    });
                }
            }
        });
    },

    handleRemoteDataUpdate(payload) {
        const remoteData = payload.data || payload;

        // Ignore our own updates
        if (payload.clientId === this.clientId) {
            return;
        }

        // Check revision to avoid stale updates
        if (remoteData.revision != null && remoteData.revision <= this.lastRevision) {
            return;
        }

        this.lastRevision = remoteData.revision || this.lastRevision;
        this.baseRevision = this.lastRevision;

        // Update undo/redo state if included
        if (payload.undoAvailable !== undefined) {
            this.serverUndoAvailable = payload.undoAvailable;
            this.serverRedoAvailable = payload.redoAvailable || false;
            this.serverUndoDescription = payload.undoDescription || null;
            this.serverRedoDescription = payload.redoDescription || null;

            // Notify UI about undo/redo state changes
            if (typeof window.onUndoRedoStateChanged === 'function') {
                window.onUndoRedoStateChanged({
                    undoAvailable: this.serverUndoAvailable,
                    redoAvailable: this.serverRedoAvailable,
                    undoDescription: this.serverUndoDescription,
                    redoDescription: this.serverRedoDescription
                });
            }
        }

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

    async processRetryQueue() {
        if (!this.retryQueue || this.retryQueue.length === 0) return;

        console.log(`Processing ${this.retryQueue.length} queued operations`);

        // Sort by timestamp and process in order
        this.retryQueue.sort((a, b) => a.timestamp - b.timestamp);

        for (const { dataObj } of this.retryQueue) {
            try {
                await this.flushToServerSeamlessly(dataObj);
            } catch (err) {
                console.error('Failed to process queued operation:', err);
            }
        }

        this.retryQueue = [];
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

    async clearData() {
        if (this.useServer && this.serverBaseUrl) {
            try {
                const resp = await fetch(`${this.serverBaseUrl}/data/clear`, { method: 'POST' });
                if (resp.ok) {
                    this.lastRevision = 0;
                    this.baseRevision = 0;
                    // Clear undo/redo state
                    this.serverUndoAvailable = false;
                    this.serverRedoAvailable = false;
                    this.serverUndoDescription = null;
                    this.serverRedoDescription = null;
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
            // Clear undo/redo state
            this.serverUndoAvailable = false;
            this.serverRedoAvailable = false;
            this.serverUndoDescription = null;
            this.serverRedoDescription = null;
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

    // Enhanced connection status
    getConnectionStatus() {
        return {
            state: this.connectionState,
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            pendingOperations: this.operationQueue.length + (this.retryQueue?.length || 0),
            lastRevision: this.lastRevision,
            connectedUsers: this.connectedUsers.length,
            undoAvailable: this.serverUndoAvailable,
            redoAvailable: this.serverRedoAvailable,
            undoDescription: this.serverUndoDescription,
            redoDescription: this.serverRedoDescription
        };
    }
};

// Global exposure
window.DataService = DataService;
