// DataService provides an abstraction layer over data persistence.  In phase 1
// we use localStorage to store the entire application state.  Methods are
// asynchronous to allow seamless migration to a remote server in the future.

const STORAGE_KEY = 'shoppingListData';

/*
 * DataService provides an abstraction layer over data persistence.  In phase 1
 * we store everything in localStorage.  To prepare for phase 2 (server
 * synchronisation), DataService exposes a `useServer` flag and a
 * `serverBaseUrl` property.  When `useServer` is set to true, all
 * operations will be proxied to a remote API rather than localStorage.  The
 * remote API is expected to expose endpoints like `/data` (GET/PUT) and
 * `/data/clear` (POST).  This design allows the rest of the application to
 * remain agnostic to where data lives.
 */

const DataService = {
    // Default to localStorage; set this to true to use the remote server.
    // The flag may be toggled at runtime if server requests fail.
    useServer: true,
    // Base URL for the remote API.  For a self‑hosted server this might be
    // something like 'http://localhost:3000/api'.  Keep trailing slash off.
    serverBaseUrl: window.location.origin,

    /**
     * Socket.IO client instance.  When using the server, this will be
     * initialised by initSocket() to receive real‑time updates.
     */
    socket: null,
    pendingData: null,
    saveTimer: null,
    clientId: Math.random().toString(36).slice(2),
    pendingChangeIds: new Set(),
    lastRevision: 0,

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    mergeById(serverArr = [], localArr = []) {
        const map = new Map();
        serverArr.forEach(i => map.set(i.id, JSON.parse(JSON.stringify(i))));
        localArr.forEach(i => map.set(i.id, JSON.parse(JSON.stringify(i))));
        return Array.from(map.values());
    },

    mergeLists(serverLists = [], localLists = []) {
        const map = new Map();
        serverLists.forEach(l => map.set(l.id, JSON.parse(JSON.stringify(l))));
        localLists.forEach(l => {
            const existing = map.get(l.id);
            if (existing) {
                existing.name = l.name;
                existing.isCompleted = l.isCompleted;
                existing.items = this.mergeById(existing.items || [], l.items || []);
            } else {
                map.set(l.id, JSON.parse(JSON.stringify(l)));
            }
        });
        return Array.from(map.values());
    },

    mergeData(serverData, localData) {
        return {
            ...serverData,
            lists: this.mergeLists(serverData.lists || [], localData.lists || []),
            globalItems: this.mergeById(serverData.globalItems || [], localData.globalItems || []),
            categories: this.mergeById(serverData.categories || [], localData.categories || []),
            archivedLists: this.mergeLists(serverData.archivedLists || [], localData.archivedLists || []),
            receipts: localData.receipts && localData.receipts.length ? localData.receipts : (serverData.receipts || []),
            revision: serverData.revision
        };
    },

    /**
     * Load the application data from persistent storage or the remote API.
     * Returns an object containing lists, globalItems, categories,
     * archivedLists and receipts.  If no data exists, returns null.
     * @returns {Promise<Object|null>}
     */
    async loadData() {
        // Attempt to load data from the remote API when useServer is enabled.
        if (this.useServer && this.serverBaseUrl) {
            try {
                const resp = await fetch(`${this.serverBaseUrl}/data`);
                if (resp.ok) {
                    const data = await resp.json();
                    this.lastRevision = data.revision || 0;
                    return data;
                }
                // Non‑OK responses cause a fallback to localStorage.
                console.warn('Remote load failed with status', resp.status, '- falling back to localStorage');
            } catch (err) {
                console.error('Failed to load data from server:', err);
            }
        }
        // Fallback: read from localStorage.
        try {
            const jsonStr = window.localStorage.getItem(STORAGE_KEY);
            if (!jsonStr) return null;
            const data = JSON.parse(jsonStr);
            this.lastRevision = data.revision || 0;
            return data;
        } catch (err) {
            console.error('Failed to load data from localStorage', err);
            return null;
        }
    },

    /**
     * Queue a save of the provided data object. Multiple calls within a short
     * time frame are batched and sent together to the server. The function
     * returns immediately so UI updates remain responsive.
     * @param {Object} dataObj
     */
    saveData(dataObj) {
        if (this.useServer && this.serverBaseUrl) {
            this.pendingData = dataObj;
            if (!this.saveTimer) {
                this.saveTimer = setTimeout(() => this.flush(), 200);
            }
            return;
        }
        try {
            const json = JSON.stringify(dataObj);
            window.localStorage.setItem(STORAGE_KEY, json);
        } catch (err) {
            console.error('Failed to save data to localStorage', err);
        }
    },

    async flush() {
        while (this.pendingData) {
            const payload = this.pendingData;
            this.pendingData = null;
            const changeId = this.generateId();
            this.pendingChangeIds.add(changeId);
            setTimeout(() => this.pendingChangeIds.delete(changeId), 5000);
            try {
                const resp = await fetch(`${this.serverBaseUrl}/data`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, clientId: this.clientId, changeId })
                });
                if (resp.status === 409) {
                    const serverData = await resp.json();
                    const merged = this.mergeData(serverData, payload);
                    this.lastRevision = serverData.revision || 0;
                    this.pendingData = merged;
                    this.pendingChangeIds.delete(changeId);
                    try {
                        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                    } catch (e) {
                        console.error('Failed to update localStorage from conflict response', e);
                    }
                    if (typeof window.onRemoteDataUpdated === 'function') {
                        window.onRemoteDataUpdated(merged);
                    }
                    continue;
                } else if (!resp.ok) {
                    console.warn('Remote save failed with status', resp.status, '- falling back to localStorage');
                    this.useServer = false;
                    this.pendingChangeIds.delete(changeId);
                    try {
                        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                    } catch (err) {
                        console.error('Failed to save data to localStorage', err);
                    }
                } else {
                    const resJson = await resp.json().catch(() => null);
                    if (resJson && typeof resJson.revision === 'number') {
                        this.lastRevision = resJson.revision;
                        try {
                            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, revision: resJson.revision }));
                        } catch (e) {
                            console.error('Failed to update localStorage after save', e);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to save data to server:', err);
                this.useServer = false;
                this.pendingChangeIds.delete(changeId);
                try {
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
                } catch (e) {
                    console.error('Failed to save data to localStorage', e);
                }
            }
        }
        this.saveTimer = null;
    },

    /**
     * Initialise a WebSocket connection to the server for real‑time
     * synchronisation.  When the server broadcasts updated data, we update
     * localStorage and call an optional global callback (onRemoteDataUpdated)
     * so the UI can re‑render without a full page reload.  Only call this
     * if useServer is true.
     */
    initSocket() {
        if (!this.useServer || !this.serverBaseUrl || this.socket) return;
        if (typeof io === 'undefined') {
            console.warn('Socket.io client library not loaded');
            return;
        }
        this.socket = io(this.serverBaseUrl);
        this.socket.on('connect', () => {
            console.log('Connected to shopping list server');
        });
        this.socket.on('dataUpdated', (payload) => {
            const remoteData = payload.data || payload;
            if (payload.clientId === this.clientId && this.pendingChangeIds.has(payload.changeId)) {
                this.pendingChangeIds.delete(payload.changeId);
                return;
            }
            if (remoteData.revision != null && remoteData.revision <= this.lastRevision) {
                return;
            }
            this.lastRevision = remoteData.revision || this.lastRevision;
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
            } catch (err) {
                console.error('Failed to update localStorage from server', err);
            }
            if (typeof window.onRemoteDataUpdated === 'function') {
                window.onRemoteDataUpdated(remoteData);
            } else {
                console.log('Remote data updated, reload to apply changes');
            }
        });
    },

    /**
     * Clear all persisted data locally or via the remote API.  Useful for
     * debugging or resetting the application state.
     * @returns {Promise<void>}
     */
    async clearData() {
        // Attempt to clear data via the server when useServer is enabled.
        if (this.useServer && this.serverBaseUrl) {
            try {
                const resp = await fetch(`${this.serverBaseUrl}/data/clear`, { method: 'POST' });
                if (resp.ok) {
                    return;
                }
                console.warn('Remote clear failed with status', resp.status, '- falling back to localStorage');
            } catch (err) {
                console.error('Failed to clear data via server:', err);
            }
        }
        // Fallback: remove data from localStorage.
        try {
            window.localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            console.error('Failed to clear localStorage', err);
        }
    }
};

// Expose DataService globally so script.js can access it without modules.
window.DataService = DataService;
