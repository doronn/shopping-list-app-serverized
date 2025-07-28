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
    // If true, use the remote server; otherwise fall back to localStorage.
    useServer: true,
    // Base URL for the remote API.  For a self‑hosted server this might be
    // something like 'http://localhost:3000/api'.  Keep trailing slash off.
    serverBaseUrl: 'https://shopping-list-app-serverized.onrender.com',

    /**
     * Socket.IO client instance.  When using the server, this will be
     * initialised by initSocket() to receive real‑time updates.
     */
    socket: null,

    /**
     * Load the application data from persistent storage or the remote API.
     * Returns an object containing lists, globalItems, categories,
     * archivedLists and receipts.  If no data exists, returns null.
     * @returns {Promise<Object|null>}
     */
    async loadData() {
        try {
            if (this.useServer && this.serverBaseUrl) {
                const resp = await fetch(`${this.serverBaseUrl}/data`);
                if (!resp.ok) throw new Error('Server returned ' + resp.status);
                const json = await resp.json();
                return json;
            }
            const jsonStr = window.localStorage.getItem(STORAGE_KEY);
            if (!jsonStr) return null;
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('Failed to load data', err);
            return null;
        }
    },

    /**
     * Save the provided data object to persistent storage or the remote API.
     * @param {Object} dataObj
     * @returns {Promise<void>}
     */
    async saveData(dataObj) {
        try {
            if (this.useServer && this.serverBaseUrl) {
                await fetch(`${this.serverBaseUrl}/data`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataObj)
                });
                return;
            }
            const json = JSON.stringify(dataObj);
            window.localStorage.setItem(STORAGE_KEY, json);
        } catch (err) {
            console.error('Failed to save data', err);
        }
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
        this.socket.on('dataUpdated', (remoteData) => {
            try {
                // Persist remote data locally for offline usage
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
            } catch (err) {
                console.error('Failed to update localStorage from server', err);
            }
            if (typeof window.onRemoteDataUpdated === 'function') {
                window.onRemoteDataUpdated(remoteData);
            } else {
                // As a fallback, reload the page to reflect remote changes
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
        try {
            if (this.useServer && this.serverBaseUrl) {
                await fetch(`${this.serverBaseUrl}/data/clear`, { method: 'POST' });
                return;
            }
            window.localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            console.error('Failed to clear data', err);
        }
    }
};

// Expose DataService globally so script.js can access it without modules.
window.DataService = DataService;