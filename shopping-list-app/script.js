// Simple Shopping List App in vanilla JS with enhanced collaboration features
// Data is stored via DataService with real-time synchronization and conflict resolution.

// Translation strings for English and Hebrew
const translations = {
    en: {
        app_title: "Shopping List",
        language_label: "Language:",
        tab_lists: "Lists",
        tab_summary: "Summary",
        tab_settings: "Settings",
        lists_title: "Your Lists",
        add_list: "New List",
        summary_title: "Purchase Summary",
        settings_title: "Settings",
        currency_label: "Default currency symbol:",
        modal_new_list: "Create List",
        modal_edit_list: "Edit List",
        list_name_label: "List name:",
        save: "Save",
        cancel: "Cancel",
        item_modal_new: "Add Item",
        item_modal_edit: "Edit Item",
        item_name: "Item name:",
        item_category: "Category:",
        item_quantity: "Quantity:",
        item_price: "Est. price:",
        item_notes: "Notes:",
        add_item: "Add Item",
        close: "Close",
        manage_items: "Manage Items",
        rename_list: "Rename",
        edit_global_item: "Edit",
        delete_list: "Delete",
        category_produce: "Produce",
        category_dairy: "Dairy",
        category_meat: "Meat",
        category_bakery: "Bakery",
        category_beverages: "Beverages",
        category_other: "Other",
        purchased: "Purchased",
        missing: "Missing",
        total_cost: "Total cost",
        create_from_missing: "Create list from missing items"
        ,
        receipt_label: "Upload receipt(s):",
        search_placeholder: "Search items",
        tab_items: "Global Items",
        tab_archive: "Archive",
        items_title: "Global Items",
        add_global_item: "New Global Item",
        global_name: "Item name:",
        global_category: "Category:",
        global_price: "Estimated price:",
        global_unit: "Price unit:",
        archive_title: "Purchase Archive"
        ,
        modal_new_global_item: "Create Global Item",
        modal_edit_global_item: "Edit Global Item"
        ,
        item_unit: "Unit:",
        item_price_basis: "Price basis quantity:",
        import_title: "Import from Google Keep",
        import_label: "Paste your Keep note here:",
        import_button: "Import",
        export_csv: "Export to CSV",
        archive_view: "View",
        archive_edit: "Edit"
        ,
        complete_list: "Complete"
        ,
        categories_title: "Categories",
        add_category: "Add Category"
        ,
        clear_data: "Clear All Data",
        confirm_clear: "Are you sure you want to clear all data? This cannot be undone.",
        share_link: "Copy Link",
        maximize: "Maximize",
        restore: "Restore",
        check_all: "Check All",
        uncheck_all: "Uncheck All",
        undo: "Undo",
        redo: "Redo"
    },
    he: {
        app_title: "רשימת קניות",
        language_label: "שפה:",
        tab_lists: "רשימות",
        tab_summary: "סיכום",
        tab_settings: "הגדרות",
        lists_title: "הרשימות שלך",
        add_list: "רשימה חדשה",
        summary_title: "סיכום קניות",
        settings_title: "הגדרות",
        currency_label: "סמל מטבע ברירת מחדל:",
        modal_new_list: "יצירת רשימה",
        modal_edit_list: "עריכת רשימה",
        list_name_label: "שם הרשימה:",
        save: "שמירה",
        cancel: "ביטול",
        item_modal_new: "הוספת פריט",
        item_modal_edit: "עריכת פריט",
        item_name: "שם הפריט:",
        item_category: "קטגוריה:",
        item_quantity: "כמות:",
        item_price: "מחיר משוער:",
        item_notes: "הערות:",
        add_item: "הוספת פריט",
        close: "סגור",
        manage_items: "ניהול פריטים",
        rename_list: "שנה שם",
        edit_global_item: "ערוך",
        delete_list: "מחק",
        category_produce: "ירקות ופירות",
        category_dairy: "מוצרי חלב",
        category_meat: "בשר",
        category_bakery: "מאפה",
        category_beverages: "משקאות",
        category_other: "אחר",
        purchased: "נקנו",
        missing: "חסרים",
        total_cost: "עלות כוללת",
        create_from_missing: "צור רשימה מפריטים חסרים"
        ,
        receipt_label: "העלה קבלה(ות):",
        search_placeholder: "חפש פריטים",
        tab_items: "פריטים גלובליים",
        tab_archive: "ארכיון",
        items_title: "פריטים גלובליים",
        add_global_item: "פריט גלובלי חדש",
        global_name: "שם פריט:",
        global_category: "קטגוריה:",
        global_price: "מחיר משוער:",
        global_unit: "יחידת מחיר:",
        archive_title: "ארכיון קניות"
        ,
        modal_new_global_item: "יצירת פריט גלובלי",
        modal_edit_global_item: "עריכת פריט גלובלי"
        ,
        item_unit: "יחידה:",
        item_price_basis: "כמות למחיר:",
        import_title: "ייבוא מגוגל קיפ",
        import_label: "הדבק את ההערה כאן:",
        import_button: "ייבוא",
        export_csv: "יצא לקובץ CSV",
        archive_view: "צפה",
        archive_edit: "ערוך"
        ,
        complete_list: "סיום"
        ,
        categories_title: "קטגוריות",
        add_category: "הוסף קטגוריה"
        ,
        clear_data: "נקה את כל הנתונים",
        confirm_clear: "האם אתה בטוח שברצונך לנקות את כל הנתונים? פעולה זו לא ניתנת לביטול.",
        share_link: "העתק קישור",
        maximize: "מסך מלא",
        restore: "יציאה ממסך מלא",
        check_all: "סמן הכל",
        uncheck_all: "בטל סימון הכל",
        undo: "בטל",
        redo: "שחזר"
    }
};


// Main data structure: lists, globalItems, categories, archivedLists, receipts
let data = {
    lists: [],
    globalItems: [],
    categories: [],
    archivedLists: [],
    receipts: [],
    revision: 0
};

// Collaboration state
let connectedUsers = [];
let activeEditors = {};
let isEditing = false;
let currentEditingContext = null;

let currentLanguage = 'en';
let editingListId = null;
let editingItemListId = null;
let editingItemId = null;
let itemSearchTerm = '';
let editingGlobalItemId = null;
let editingArchive = false;
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
let collapsedCategories = JSON.parse(localStorage.getItem('collapsedCategories') || '{}');
let listFullscreen = localStorage.getItem('listFullscreen') === 'true';

const clone = obj => JSON.parse(JSON.stringify(obj));
let undoStack = [];
let redoStack = [];
let lastSavedData = null;

// Update datalist options for global item suggestions
function updateGlobalItemSuggestions() {
    const datalist = document.getElementById('global-item-suggestions');
    if (!datalist) {
        updateCustomSuggestions();
        return;
    }
    datalist.innerHTML = '';
    // Use a Set to avoid duplicate names (case-insensitive)
    const seen = new Set();
    data.globalItems.forEach(item => {
        const nameLower = item.name.toLowerCase();
        if (!seen.has(nameLower)) {
            seen.add(nameLower);
            const opt = document.createElement('option');
            opt.value = item.name;
            datalist.appendChild(opt);
        }
    });
    updateCustomSuggestions();
}

// Handle input for item name to auto-fill category and unit when matching a global item
function handleItemNameInput() {
    const input = document.getElementById('item-name-input');
    if (!input) return;
    const val = input.value.trim();
    const globalItem = data.globalItems.find(g => g.name.toLowerCase() === val.toLowerCase());
    if (globalItem) {
        input.dataset.selectedId = globalItem.id;
        // Fill category and unit from global item
        const catSelect = document.getElementById('item-category-select');
        if (catSelect) catSelect.value = globalItem.categoryId;
        const unitSelect = document.getElementById('item-unit-select');
        if (unitSelect) unitSelect.value = globalItem.priceUnit || 'piece';
        // Set price placeholder to estimated price for user reference
        const priceInput = document.getElementById('item-price-input');
        if (priceInput) {
            priceInput.placeholder = globalItem.estimatedPrice != null ? globalItem.estimatedPrice.toString() : '';
        }
    } else {
        delete input.dataset.selectedId;
    }
    updateCustomSuggestions();
}

// Custom suggestions dropdown for mobile browsers where datalist is unreliable
function updateCustomSuggestions() {
    const container = document.getElementById('item-suggestions');
    const input = document.getElementById('item-name-input');
    if (!container || !input) return;
    if (!isMobile) {
        container.classList.add('hidden');
        return;
    }
    const term = input.value.trim().toLowerCase();
    container.innerHTML = '';
    if (!term) {
        container.classList.add('hidden');
        return;
    }
    const matches = data.globalItems.filter(g => g.name.toLowerCase().includes(term)).slice(0, 5);
    matches.forEach(item => {
        const div = document.createElement('div');
        div.textContent = item.name;
        div.addEventListener('click', () => {
            input.value = item.name;
            input.dataset.selectedId = item.id;
            container.classList.add('hidden');
            handleItemNameInput();
        });
        container.appendChild(div);
    });
    container.classList.toggle('hidden', matches.length === 0);
}

// Utility functions for localStorage
async function loadData() {
    // Use DataService to load persisted data.  DataService returns null if no
    // data exists or if parsing fails.
    const stored = await window.DataService.loadData();
    if (stored) {
        data = stored;
    }
    // Ensure all properties exist
    data.lists = data.lists || [];
    data.globalItems = data.globalItems || [];
    data.categories = data.categories || [];
    data.archivedLists = data.archivedLists || [];
    data.receipts = data.receipts || [];
    data.revision = data.revision || 0;
    // If categories empty, populate default categories with translations
    if (data.categories.length === 0) {
        data.categories = [
            { id: 'produce', names: { en: translations.en.category_produce, he: translations.he.category_produce } },
            { id: 'dairy', names: { en: translations.en.category_dairy, he: translations.he.category_dairy } },
            { id: 'meat', names: { en: translations.en.category_meat, he: translations.he.category_meat } },
            { id: 'bakery', names: { en: translations.en.category_bakery, he: translations.he.category_bakery } },
            { id: 'beverages', names: { en: translations.en.category_beverages, he: translations.he.category_beverages } },
            { id: 'other', names: { en: translations.en.category_other, he: translations.he.category_other } }
        ];
    }
    // Ensure list items have priceBasisQuantity
    data.lists.forEach(list => {
        list.items = list.items || [];
        list.items.forEach(item => {
            if (item.priceBasisQuantity == null) item.priceBasisQuantity = 1;
        });
    });
    data.archivedLists.forEach(list => {
        list.items = list.items || [];
        list.items.forEach(item => {
            if (item.priceBasisQuantity == null) item.priceBasisQuantity = 1;
        });
    });
    lastSavedData = clone(data);
}

function saveData(pushUndo = true, operationType = null, operationPath = null, operationData = null) {
    // Create operations for tracking changes
    const operations = [];
    if (operationType && operationPath) {
        const operation = window.DataService.createOperation(operationType, operationPath, operationData);
        operations.push(operation);
    }

    // Save data with enhanced conflict resolution
    window.DataService.saveData(data, operations);

    // Send real-time operations for immediate updates
    if (operations.length > 0) {
        window.DataService.sendOperations(operations);
    }

    // Update UI to reflect undo/redo state
    updateUndoRedoButtons();
}

// Enhanced undo/redo state callback
window.onUndoRedoStateChanged = function(state) {
    updateUndoRedoButtons(state);
};

// Enhanced notification for undo/redo actions
window.showUndoNotification = function(description, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: ${type === 'undo' ? '#ff9800' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 9999;
        font-size: 0.9rem;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideInFromLeft 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;

    const icon = type === 'undo' ? 'arrow-counterclockwise' : 'arrow-clockwise';
    const actionText = type === 'undo' ? translations[currentLanguage].undo : translations[currentLanguage].redo;

    notification.innerHTML = `
        <i class="bi bi-${icon}"></i>
        <div>
            <div style="font-weight: 600;">${actionText}</div>
            <div style="font-size: 0.8rem; opacity: 0.9;">${description}</div>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInFromLeft 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
};

// Enhanced undo/redo functionality with server integration
function updateUndoRedoButtons(state = null) {
    const t = translations[currentLanguage];
    const undoBtn = document.getElementById('undo-button');
    const redoBtn = document.getElementById('redo-button');

    if (undoBtn) {
        const canUndo = state ? state.undoAvailable : window.DataService?.canUndo() || false;
        const undoDescription = state ? state.undoDescription : window.DataService?.getUndoDescription();

        undoBtn.disabled = !canUndo;

        // Enhanced tooltip with description
        if (canUndo && undoDescription) {
            undoBtn.title = `${t.undo}: ${undoDescription}`;
            undoBtn.setAttribute('data-description', undoDescription);
        } else {
            undoBtn.title = t.undo;
            undoBtn.removeAttribute('data-description');
        }

        // Visual feedback for available undo
        if (canUndo) {
            undoBtn.classList.remove('btn-secondary');
            undoBtn.classList.add('btn-warning');
        } else {
            undoBtn.classList.remove('btn-warning');
            undoBtn.classList.add('btn-secondary');
        }
    }

    if (redoBtn) {
        const canRedo = state ? state.redoAvailable : window.DataService?.canRedo() || false;
        const redoDescription = state ? state.redoDescription : window.DataService?.getRedoDescription();

        redoBtn.disabled = !canRedo;

        // Enhanced tooltip with description
        if (canRedo && redoDescription) {
            redoBtn.title = `${t.redo}: ${redoDescription}`;
            redoBtn.setAttribute('data-description', redoDescription);
        } else {
            redoBtn.title = t.redo;
            redoBtn.removeAttribute('data-description');
        }

        // Visual feedback for available redo
        if (canRedo) {
            redoBtn.classList.remove('btn-secondary');
            redoBtn.classList.add('btn-info');
        } else {
            redoBtn.classList.remove('btn-info');
            redoBtn.classList.add('btn-secondary');
        }
    }
}

// Enhanced undo functionality with server integration
async function undo() {
    const result = await window.DataService?.performUndo();
    if (!result) {
        showUpdateNotification('Nothing to undo', 'info');
        return;
    }

    try {
        // Reload data from server after undo
        const newData = await window.DataService.loadData();
        if (newData) {
            data = newData;
            refreshUI();
        }

        // Update button states
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Undo failed:', error);
        showUpdateNotification('Undo failed', 'error');
    }
}

// Enhanced redo functionality with server integration
async function redo() {
    const result = await window.DataService?.performRedo();
    if (!result) {
        showUpdateNotification('Nothing to redo', 'info');
        return;
    }

    try {
        // Reload data from server after redo
        const newData = await window.DataService.loadData();
        if (newData) {
            data = newData;
            refreshUI();
        }

        // Update button states
        updateUndoRedoButtons();
    } catch (error) {
        console.error('Redo failed:', error);
        showUpdateNotification('Redo failed', 'error');
    }
}

// Enhanced remote data update handlers
window.onRemoteDataUpdated = function(remoteData) {
    // Seamlessly update local data with remote changes
    data = remoteData;

    // Refresh the UI to show updates
    refreshUI();

    // Show subtle notification about remote updates
    if (typeof showUpdateNotification === 'function') {
        showUpdateNotification('Data updated by another user', 'info');
    }
};

window.onRemoteOperationsApplied = function(operations) {
    // Show information about operations applied by other users
    if (operations && operations.length > 0 && typeof showUpdateNotification === 'function') {
        const count = operations.length;
        const message = count === 1 ?
            `1 change applied by another user` :
            `${count} changes applied by other users`;
        showUpdateNotification(message, 'info');
    }
};

window.onRemoteOperationReceived = function(operation) {
    // Handle individual operations from other users
    if (operation && typeof showUpdateNotification === 'function') {
        showUpdateNotification(`${operation.description} (by another user)`, 'info');
    }
};

// Enhanced presence tracking
window.onPresenceUpdated = function(connectedUsers, activeEditors) {
    // Update presence indicators in the UI
    updatePresenceIndicators(connectedUsers, activeEditors);
};

function updatePresenceIndicators(connectedUsers, activeEditors) {
    // Update header with presence information
    const header = document.querySelector('header');
    let presenceDiv = header.querySelector('.presence-indicator');

    if (!presenceDiv) {
        presenceDiv = document.createElement('div');
        presenceDiv.className = 'presence-indicator';
        header.appendChild(presenceDiv);
    }

    const userCount = connectedUsers.length;
    const isConnected = window.DataService?.isConnected || false;

    presenceDiv.innerHTML = `
        <i class="bi bi-wifi${isConnected ? '' : '-off'} connection-icon ${isConnected ? 'connected' : 'disconnected'}"></i>
        <span class="online-count">${userCount}</span>
        <span>user${userCount !== 1 ? 's' : ''} online</span>
    `;

    // Add editing badges to items being edited by others
    updateEditingBadges(activeEditors);
}

function updateEditingBadges(activeEditors) {
    // Remove existing editing badges
    document.querySelectorAll('.editing-badge').forEach(badge => badge.remove());

    // Add badges for items currently being edited
    Object.entries(activeEditors).forEach(([key, editor]) => {
        if (editor.clientId === window.DataService?.clientId) return;

        const [listId, itemId] = key.split('/');

        // Find the element to add the badge to
        let targetElement;

        if (itemId) {
            // Individual item being edited
            targetElement = document.querySelector(`[data-item-id="${itemId}"]`);
        } else {
            // List being edited
            targetElement = document.querySelector(`[data-list-id="${listId}"]`);
        }

        if (targetElement) {
            const badge = document.createElement('span');
            badge.className = 'editing-badge';
            badge.innerHTML = `
                <i class="bi bi-pencil"></i>
                ${editor.userId || 'Another user'}
            `;
            targetElement.appendChild(badge);
        }
    });
}

// Enhanced update notification system
function showUpdateNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    const bgColor = {
        'info': '#2196f3',
        'success': '#4caf50',
        'warning': '#ff9800',
        'error': '#f44336'
    }[type] || '#2196f3';

    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 9998;
        font-size: 0.9rem;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideInFromRight 0.3s ease-out;
        word-wrap: break-word;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInFromRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// Enhanced UI refresh function that preserves user state
function refreshUI() {
    const currentPage = document.querySelector('.page.active')?.id;
    const scrollPositions = {};

    // Save scroll positions
    document.querySelectorAll('[id*="scroll"], .page').forEach(element => {
        if (element.scrollTop > 0) {
            scrollPositions[element.id] = element.scrollTop;
        }
    });

    // Update all UI components
    updateLanguage();
    renderLists();
    renderSummary();
    renderGlobalItems();
    renderArchive();
    updateUndoRedoButtons();
    updatePresenceIndicators(
        window.DataService?.connectedUsers || [],
        window.DataService?.activeEditors || {}
    );

    // Restore scroll positions
    Object.entries(scrollPositions).forEach(([id, position]) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollTop = position;
        }
    });

    // Ensure current page is still active
    if (currentPage) {
        switchTab(currentPage.replace('page-', ''));
    }
}

// Enhanced conflict resolution with user feedback
window.showMergeNotification = function(requested, applied) {
    const notification = document.createElement('div');
    notification.className = 'merge-notification';

    notification.innerHTML = `
        <div class="title">Changes Merged</div>
        <div class="description">
            ${applied}/${requested} changes applied automatically
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInFromRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
};

// Initialize collaborative features when the app loads
async function initializeCollaborativeFeatures() {
    try {
        // Initialize the DataService socket connection
        if (window.DataService && window.DataService.useServer) {
            window.DataService.initSocket();

            // Update presence periodically
            setInterval(() => {
                if (window.DataService.isConnected) {
                    window.DataService.updatePresence('active');
                }
            }, 30000); // Every 30 seconds
        }

        // Set up periodic UI refresh for real-time updates
        setInterval(() => {
            const connectionStatus = window.DataService?.getConnectionStatus();
            if (connectionStatus && connectionStatus.isConnected) {
                updateConnectionStatus(connectionStatus);
            }
        }, 5000); // Every 5 seconds

    } catch (error) {
        console.error('Failed to initialize collaborative features:', error);
    }
}

function updateConnectionStatus(status) {
    // Update connection indicator
    const indicator = document.querySelector('.presence-indicator .connection-icon');
    if (indicator) {
        indicator.className = `bi bi-wifi${status.isConnected ? '' : '-off'} connection-icon ${status.isConnected ? 'connected' : 'disconnected'}`;
    }

    // Show reconnection status if needed
    if (status.reconnectAttempts > 0) {
        showUpdateNotification(
            `Reconnecting... (attempt ${status.reconnectAttempts})`,
            'warning',
            2000
        );
    }
}

// Enhanced keyboard shortcuts for collaborative features
document.addEventListener('keydown', function(e) {
    // Ctrl+Z / Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }

    // Ctrl+Y / Cmd+Shift+Z for redo
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
    }
});

//# sourceMappingURL=app.js.map
