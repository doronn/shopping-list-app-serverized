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

// Language and UI Functions
function updateLanguage() {
    const t = translations[currentLanguage];

    // Set document direction for RTL languages
    document.documentElement.dir = currentLanguage === 'he' ? 'rtl' : 'ltr';

    // Update all text elements
    document.getElementById('app-title').textContent = t.app_title;
    document.getElementById('language-label').textContent = t.language_label;
    document.getElementById('tab-lists').textContent = t.tab_lists;
    document.getElementById('tab-summary').textContent = t.tab_summary;
    document.getElementById('tab-items').textContent = t.tab_items;
    document.getElementById('tab-archive').textContent = t.tab_archive;
    document.getElementById('tab-settings').textContent = t.tab_settings;
    document.getElementById('lists-title').textContent = t.lists_title;
    document.getElementById('add-list-button').textContent = t.add_list;
    document.getElementById('summary-title').textContent = t.summary_title;
    document.getElementById('items-title').textContent = t.items_title;
    document.getElementById('add-global-item-button').textContent = t.add_global_item;
    document.getElementById('archive-title').textContent = t.archive_title;
    document.getElementById('settings-title').textContent = t.settings_title;
    document.getElementById('currency-label').textContent = t.currency_label;
    document.getElementById('categories-title').textContent = t.categories_title;
    document.getElementById('add-category-button').textContent = t.add_category;
    document.getElementById('receipt-label').textContent = t.receipt_label;
    document.getElementById('import-title').textContent = t.import_title;
    document.getElementById('import-label').textContent = t.import_label;
    document.getElementById('import-button').textContent = t.import_button;
    document.getElementById('export-csv-button').textContent = t.export_csv;
    document.getElementById('clear-data-button').textContent = t.clear_data;

    // Update modal elements
    document.getElementById('list-name-label').textContent = t.list_name_label;
    document.getElementById('save-list').textContent = t.save;
    document.getElementById('cancel-modal').textContent = t.cancel;
    document.getElementById('item-name-label').textContent = t.item_name;
    document.getElementById('item-category-label').textContent = t.item_category;
    document.getElementById('item-quantity-label').textContent = t.item_quantity;
    document.getElementById('item-unit-label').textContent = t.item_unit;
    document.getElementById('item-price-label').textContent = t.item_price;
    document.getElementById('item-price-basis-label').textContent = t.item_price_basis;
    document.getElementById('item-notes-label').textContent = t.item_notes;
    document.getElementById('save-item').textContent = t.save;
    document.getElementById('cancel-item-modal').textContent = t.cancel;

    // Update list details elements
    document.getElementById('add-item-button').textContent = t.add_item;
    document.getElementById('complete-list-button').textContent = t.complete_list;
    document.getElementById('close-list-details').textContent = t.close;
    document.getElementById('item-search').placeholder = t.search_placeholder;

    // Update global item modal elements
    document.getElementById('global-name-label').textContent = t.global_name;
    document.getElementById('global-category-label').textContent = t.global_category;
    document.getElementById('global-price-label').textContent = t.global_price;
    document.getElementById('global-unit-label').textContent = t.global_unit;
    document.getElementById('save-global-item').textContent = t.save;
    document.getElementById('cancel-global-item-modal').textContent = t.cancel;

    // Update undo/redo buttons
    const undoBtn = document.getElementById('undo-button');
    const redoBtn = document.getElementById('redo-button');
    if (undoBtn) undoBtn.textContent = t.undo;
    if (redoBtn) redoBtn.textContent = t.redo;

    // Update toggle fullscreen button
    const fullscreenBtn = document.getElementById('toggle-fullscreen');
    if (fullscreenBtn) {
        fullscreenBtn.textContent = listFullscreen ? t.restore : t.maximize;
    }
}

// Tab switching
function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${tabName}`).classList.add('active');

    // Handle specific tab actions
    switch(tabName) {
        case 'lists':
            renderLists();
            break;
        case 'summary':
            renderSummary();
            break;
        case 'items':
            renderGlobalItems();
            break;
        case 'archive':
            renderArchive();
            break;
        case 'settings':
            renderSettings();
            break;
    }
}

// Render functions
function renderLists() {
    const container = document.getElementById('list-container');
    const t = translations[currentLanguage];

    container.innerHTML = '';

    data.lists.forEach(list => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.dataset.listId = list.id;

        const itemCount = list.items ? list.items.length : 0;
        const checkedCount = list.items ? list.items.filter(item => item.isChecked).length : 0;

        li.innerHTML = `
            <div class="d-flex flex-column flex-grow-1">
                <strong>${escapeHtml(list.name)}</strong>
                <small class="text-muted">${checkedCount}/${itemCount} items</small>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary btn-sm" onclick="openListDetails('${list.id}')">${t.manage_items}</button>
                <button class="btn btn-secondary btn-sm" onclick="editList('${list.id}')">${t.rename_list}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteList('${list.id}')">${t.delete_list}</button>
            </div>
        `;

        container.appendChild(li);
    });
}

function renderSummary() {
    const content = document.getElementById('summary-content');
    const t = translations[currentLanguage];

    let totalCost = 0;
    let purchasedItems = [];
    let missingItems = [];

    data.lists.forEach(list => {
        list.items.forEach(item => {
            const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
            const itemData = {
                name: globalItem ? globalItem.name : 'Unknown Item',
                quantity: item.quantity,
                price: item.estimatedPrice || 0,
                list: list.name
            };

            if (item.isChecked) {
                purchasedItems.push(itemData);
                totalCost += itemData.price * itemData.quantity;
            } else {
                missingItems.push(itemData);
            }
        });
    });

    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h4>${t.purchased} (${purchasedItems.length})</h4>
                <ul class="list-group">
                    ${purchasedItems.map(item => `
                        <li class="list-group-item">
                            ${escapeHtml(item.name)} x${item.quantity} 
                            <small class="text-muted">(${escapeHtml(item.list)})</small>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="col-md-6">
                <h4>${t.missing} (${missingItems.length})</h4>
                <ul class="list-group">
                    ${missingItems.map(item => `
                        <li class="list-group-item">
                            ${escapeHtml(item.name)} x${item.quantity}
                            <small class="text-muted">(${escapeHtml(item.list)})</small>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        <div class="mt-3">
            <h5>${t.total_cost}: ₪${totalCost.toFixed(2)}</h5>
        </div>
    `;
}

function renderGlobalItems() {
    const container = document.getElementById('global-items-container');
    const t = translations[currentLanguage];

    container.innerHTML = '';

    // Group items by category
    const itemsByCategory = {};
    data.globalItems.forEach(item => {
        const categoryId = item.categoryId || 'other';
        if (!itemsByCategory[categoryId]) {
            itemsByCategory[categoryId] = [];
        }
        itemsByCategory[categoryId].push(item);
    });

    // Render each category
    data.categories.forEach(category => {
        const items = itemsByCategory[category.id] || [];
        if (items.length === 0) return;

        const categoryName = category.names[currentLanguage] || category.names.en || category.id;

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-heading';
        categoryHeader.innerHTML = `<h5>${escapeHtml(categoryName)}</h5>`;
        container.appendChild(categoryHeader);

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.dataset.itemId = item.id;

            li.innerHTML = `
                <div class="d-flex flex-column flex-grow-1">
                    <strong>${escapeHtml(item.name)}</strong>
                    <small class="text-muted">₪${item.estimatedPrice || 0} per ${item.priceUnit || 'piece'}</small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm" onclick="editGlobalItem('${item.id}')">${t.edit_global_item}</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteGlobalItem('${item.id}')">Delete</button>
                </div>
            `;

            container.appendChild(li);
        });
    });
}

function renderArchive() {
    const content = document.getElementById('archive-content');
    const t = translations[currentLanguage];

    content.innerHTML = '';

    if (data.archivedLists.length === 0) {
        content.innerHTML = '<p class="text-muted">No archived lists</p>';
        return;
    }

    data.archivedLists.forEach(list => {
        const div = document.createElement('div');
        div.className = 'card mb-3 archive-list';

        const completedDate = list.completedAt ? new Date(list.completedAt).toLocaleDateString() : 'Unknown';
        const itemCount = list.items ? list.items.length : 0;

        div.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${escapeHtml(list.name)}</h5>
                <p class="card-text">
                    <small class="text-muted">Completed: ${completedDate} • ${itemCount} items</small>
                </p>
                <button class="btn btn-outline-primary btn-sm" onclick="viewArchivedList('${list.id}')">${t.archive_view}</button>
            </div>
        `;

        content.appendChild(div);
    });
}

function renderSettings() {
    updateCategoryList();
}

function updateCategoryList() {
    const container = document.getElementById('categories-container');
    const t = translations[currentLanguage];

    container.innerHTML = '';

    data.categories.forEach(category => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';

        const categoryName = category.names[currentLanguage] || category.names.en || category.id;

        li.innerHTML = `
            <span>${escapeHtml(categoryName)}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteCategory('${category.id}')">Delete</button>
        `;

        container.appendChild(li);
    });
}

// Modal and interaction functions
function openListDetails(listId) {
    const list = data.lists.find(l => l.id === listId);
    if (!list) return;

    editingListId = listId;
    document.getElementById('list-details-title').textContent = list.name;
    document.getElementById('list-details-overlay').classList.remove('hidden');

    if (listFullscreen) {
        document.getElementById('list-details-overlay').classList.add('fullscreen');
        document.getElementById('list-details').classList.add('fullscreen');
    }

    renderListItems();
    updateUndoRedoButtons();
}

function renderListItems() {
    const list = data.lists.find(l => l.id === editingListId);
    if (!list) return;

    const itemsContainer = document.getElementById('items-container');
    const checkedContainer = document.getElementById('checked-items-container');
    const t = translations[currentLanguage];

    itemsContainer.innerHTML = '';
    checkedContainer.innerHTML = '';

    // Group items by category
    const uncheckedItems = list.items.filter(item => !item.isChecked);
    const checkedItems = list.items.filter(item => item.isChecked);

    // Render unchecked items
    const itemsByCategory = {};
    uncheckedItems.forEach(item => {
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const categoryId = globalItem ? globalItem.categoryId : 'other';
        if (!itemsByCategory[categoryId]) {
            itemsByCategory[categoryId] = [];
        }
        itemsByCategory[categoryId].push(item);
    });

    data.categories.forEach(category => {
        const items = itemsByCategory[category.id] || [];
        if (items.length === 0) return;

        const categoryName = category.names[currentLanguage] || category.names.en || category.id;

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-heading';
        categoryHeader.innerHTML = `
            <h6>${escapeHtml(categoryName)}</h6>
            <button class="btn btn-sm btn-outline-secondary" onclick="toggleCategoryItems('${category.id}', true)">${t.check_all}</button>
        `;
        itemsContainer.appendChild(categoryHeader);

        items.forEach(item => {
            itemsContainer.appendChild(createItemElement(item, list.id));
        });
    });

    // Render checked items
    if (checkedItems.length > 0) {
        document.getElementById('checked-heading').textContent = `${t.purchased} (${checkedItems.length})`;
        checkedItems.forEach(item => {
            checkedContainer.appendChild(createItemElement(item, list.id));
        });
    } else {
        document.getElementById('checked-heading').textContent = '';
    }
}

function createItemElement(item, listId) {
    const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
    const itemName = globalItem ? globalItem.name : 'Unknown Item';

    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.dataset.itemId = item.id;

    const isChecked = item.isChecked ? 'checked' : '';
    const textStyle = item.isChecked ? 'text-decoration: line-through; opacity: 0.6;' : '';

    li.innerHTML = `
        <input type="checkbox" ${isChecked} onchange="toggleItem('${listId}', '${item.id}')" class="me-2">
        <div class="flex-grow-1 item-text" style="${textStyle}">
            <strong>${escapeHtml(itemName)}</strong>
            ${item.quantity > 1 ? ` x${item.quantity}` : ''}
            ${item.notes ? `<br><small class="text-muted">${escapeHtml(item.notes)}</small>` : ''}
        </div>
        <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" onclick="editListItem('${listId}', '${item.id}')">Edit</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteListItem('${listId}', '${item.id}')">Delete</button>
        </div>
    `;

    return li;
}

// Event handler functions
function toggleItem(listId, itemId) {
    const list = data.lists.find(l => l.id === listId);
    const item = list.items.find(i => i.id === itemId);

    item.isChecked = !item.isChecked;

    saveData(true, 'update', `lists/${listId}/items/${itemId}`, { isChecked: item.isChecked });
    renderListItems();
}

function editList(listId) {
    const list = data.lists.find(l => l.id === listId);
    if (!list) return;

    editingListId = listId;
    document.getElementById('modal-title').textContent = translations[currentLanguage].modal_edit_list;
    document.getElementById('list-name-input').value = list.name;
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function deleteList(listId) {
    if (!confirm(translations[currentLanguage].confirm_clear)) return;

    data.lists = data.lists.filter(l => l.id !== listId);
    saveData(true, 'delete', `lists/${listId}`, { id: listId });
    renderLists();
}

function deleteGlobalItem(itemId) {
    if (!confirm('Delete this item?')) return;

    data.globalItems = data.globalItems.filter(i => i.id !== itemId);
    saveData(true, 'delete', `globalItems/${itemId}`, { id: itemId });
    renderGlobalItems();
}

function deleteListItem(listId, itemId) {
    const list = data.lists.find(l => l.id === listId);
    list.items = list.items.filter(i => i.id !== itemId);

    saveData(true, 'delete', `lists/${listId}/items/${itemId}`, { id: itemId });
    renderListItems();
}

function toggleCategoryItems(categoryId, checked) {
    const list = data.lists.find(l => l.id === editingListId);

    list.items.forEach(item => {
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        if (globalItem && globalItem.categoryId === categoryId) {
            item.isChecked = checked;
        }
    });

    saveData(true, 'update', `lists/${editingListId}`, list);
    renderListItems();
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Initialize the app
async function initApp() {
    try {
        // Load data first
        await loadData();

        // Set up language
        const savedLanguage = localStorage.getItem('language') || 'en';
        currentLanguage = savedLanguage;
        document.getElementById('language-select').value = currentLanguage;

        // Update UI
        updateLanguage();
        switchTab('lists');

        // Set up event listeners
        setupEventListeners();

        // Initialize collaborative features
        await initializeCollaborativeFeatures();

        // Check for direct list link
        const urlParams = new URLSearchParams(window.location.search);
        const listId = urlParams.get('list');
        if (listId && data.lists.find(l => l.id === listId)) {
            openListDetails(listId);
        }

    } catch (error) {
        console.error('Failed to initialize app:', error);
        showUpdateNotification('Failed to load app', 'error');
    }
}

function setupEventListeners() {
    // Language selector
    document.getElementById('language-select').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('language', currentLanguage);
        updateLanguage();
        refreshUI();
    });

    // Tab navigation
    document.getElementById('tab-lists').addEventListener('click', () => switchTab('lists'));
    document.getElementById('tab-summary').addEventListener('click', () => switchTab('summary'));
    document.getElementById('tab-items').addEventListener('click', () => switchTab('items'));
    document.getElementById('tab-archive').addEventListener('click', () => switchTab('archive'));
    document.getElementById('tab-settings').addEventListener('click', () => switchTab('settings'));

    // Add list button
    document.getElementById('add-list-button').addEventListener('click', () => {
        editingListId = null;
        document.getElementById('modal-title').textContent = translations[currentLanguage].modal_new_list;
        document.getElementById('list-name-input').value = '';
        document.getElementById('modal-overlay').classList.remove('hidden');
    });

    // Save list
    document.getElementById('save-list').addEventListener('click', () => {
        const name = document.getElementById('list-name-input').value.trim();
        if (!name) return;

        if (editingListId) {
            // Edit existing list
            const list = data.lists.find(l => l.id === editingListId);
            list.name = name;
            saveData(true, 'update', `lists/${editingListId}`, { name });
        } else {
            // Create new list
            const newList = {
                id: generateId(),
                name,
                items: [],
                createdAt: new Date().toISOString()
            };
            data.lists.push(newList);
            saveData(true, 'create', 'lists', newList);
        }

        document.getElementById('modal-overlay').classList.add('hidden');
        renderLists();
    });

    // Cancel modals
    document.getElementById('cancel-modal').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.add('hidden');
    });

    document.getElementById('cancel-item-modal').addEventListener('click', () => {
        document.getElementById('item-modal-overlay').classList.add('hidden');
    });

    document.getElementById('cancel-global-item-modal').addEventListener('click', () => {
        document.getElementById('global-item-modal-overlay').classList.add('hidden');
    });

    // Close list details
    document.getElementById('close-list-details').addEventListener('click', () => {
        document.getElementById('list-details-overlay').classList.add('hidden');
        editingListId = null;
    });

    // Add global item
    document.getElementById('add-global-item-button').addEventListener('click', () => {
        editingGlobalItemId = null;
        document.getElementById('global-item-modal-title').textContent = translations[currentLanguage].modal_new_global_item;
        document.getElementById('global-name-input').value = '';
        document.getElementById('global-price-input').value = '';
        populateCategorySelects();
        document.getElementById('global-item-modal-overlay').classList.remove('hidden');
    });

    // Save global item
    document.getElementById('save-global-item').addEventListener('click', () => {
        const name = document.getElementById('global-name-input').value.trim();
        const categoryId = document.getElementById('global-category-select').value;
        const price = parseFloat(document.getElementById('global-price-input').value) || 0;
        const priceUnit = document.getElementById('global-unit-select').value;

        if (!name || !categoryId) return;

        if (editingGlobalItemId) {
            // Edit existing item
            const item = data.globalItems.find(i => i.id === editingGlobalItemId);
            Object.assign(item, { name, categoryId, estimatedPrice: price, priceUnit });
            saveData(true, 'update', `globalItems/${editingGlobalItemId}`, item);
        } else {
            // Create new item
            const newItem = {
                id: generateId(),
                name,
                categoryId,
                estimatedPrice: price,
                priceUnit,
                createdAt: new Date().toISOString()
            };
            data.globalItems.push(newItem);
            saveData(true, 'create', 'globalItems', newItem);
        }

        document.getElementById('global-item-modal-overlay').classList.add('hidden');
        renderGlobalItems();
        updateGlobalItemSuggestions();
    });

    // Clear data
    document.getElementById('clear-data-button').addEventListener('click', async () => {
        if (!confirm(translations[currentLanguage].confirm_clear)) return;

        try {
            await window.DataService.clearData();
            data = {
                lists: [],
                globalItems: [],
                categories: [],
                archivedLists: [],
                receipts: [],
                revision: 0
            };
            await loadData(); // Reload to get default categories
            refreshUI();
            showUpdateNotification('Data cleared successfully', 'success');
        } catch (error) {
            console.error('Failed to clear data:', error);
            showUpdateNotification('Failed to clear data', 'error');
        }
    });

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-button');
    const redoBtn = document.getElementById('redo-button');

    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }

    // Item search
    document.getElementById('item-search').addEventListener('input', (e) => {
        itemSearchTerm = e.target.value.toLowerCase();
        renderListItems();
    });
}

function populateCategorySelects() {
    const selects = [
        document.getElementById('item-category-select'),
        document.getElementById('global-category-select')
    ];

    selects.forEach(select => {
        if (!select) return;

        select.innerHTML = '';
        data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.names[currentLanguage] || category.names.en || category.id;
            select.appendChild(option);
        });
    });
}

// Global functions for onclick handlers
window.openListDetails = openListDetails;
window.editList = editList;
window.deleteList = deleteList;
window.deleteGlobalItem = deleteGlobalItem;
window.deleteListItem = deleteListItem;
window.toggleItem = toggleItem;
window.toggleCategoryItems = toggleCategoryItems;
window.editGlobalItem = (itemId) => {
    const item = data.globalItems.find(i => i.id === itemId);
    if (!item) return;

    editingGlobalItemId = itemId;
    document.getElementById('global-item-modal-title').textContent = translations[currentLanguage].modal_edit_global_item;
    document.getElementById('global-name-input').value = item.name;
    document.getElementById('global-price-input').value = item.estimatedPrice || '';
    document.getElementById('global-unit-select').value = item.priceUnit || 'piece';
    populateCategorySelects();
    document.getElementById('global-category-select').value = item.categoryId;
    document.getElementById('global-item-modal-overlay').classList.remove('hidden');
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
