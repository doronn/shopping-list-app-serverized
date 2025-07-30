// DataService provides an abstraction layer over data persistence.  In phase 1
// we use localStorage to store the entire application state.  Methods are
// asynchronous to allow seamless migration to a remote server in the future.

import { io } from 'socket.io-client'

const STORAGE_KEY = 'shoppingListData';

/*
 * DataService provides an abstraction layer over data persistence.  In phase 1
 * we store everything in localStorage.  To prepare for phase 2 (server
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
                    return await resp.json();
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
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('Failed to load data from localStorage', err);
            return null;
        }
    },

    /**
     * Save the provided data object to persistent storage or the remote API.
     * @param {Object} dataObj
     * @returns {Promise<void>}
     */
    async saveData(dataObj) {
        // Try saving to the server when useServer is true.
        if (this.useServer && this.serverBaseUrl) {
            try {
                const resp = await fetch(`${this.serverBaseUrl}/data`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataObj)
                });
                if (resp.ok) {
                    return;
                }
                // Non‑OK responses trigger fallback to localStorage.
                console.warn('Remote save failed with status', resp.status, '- falling back to localStorage');
            } catch (err) {
                console.error('Failed to save data to server:', err);
            }
        }
        // Fallback: store data in localStorage.
        try {
            const json = JSON.stringify(dataObj);
            window.localStorage.setItem(STORAGE_KEY, json);
        } catch (err) {
            console.error('Failed to save data to localStorage', err);
        }
    },

    /**
     * Initialise a WebSocket connection to the server for real‑time
     * synchronisation.  When the server broadcasts updated data, we update
     * localStorage and call an optional global callback (onRemoteDataUpdated)
     * so the UI can re‑render without a full page reload.  Only call this
     * if useServer is true.
     */
    initSocket(onRemoteDataUpdated) {
        if (!this.useServer || !this.serverBaseUrl || this.socket) return;
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
            if (typeof onRemoteDataUpdated === 'function') {
                onRemoteDataUpdated(remoteData);
            } else {
                console.log('Remote data updated');
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

export default DataService;
