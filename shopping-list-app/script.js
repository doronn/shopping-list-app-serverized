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
    if (pushUndo && lastSavedData) {
        undoStack.push(clone(lastSavedData));
        if (undoStack.length > 100) undoStack.shift();
        redoStack = [];
    }
    lastSavedData = clone(data);

    // Track operations for collaborative editing
    const operations = [];
    if (operationType && operationPath) {
        operations.push(window.DataService.createOperation(operationType, operationPath, operationData));
    }

    window.DataService.saveData(data, operations);

    // Send real-time operations for immediate updates
    if (operations.length > 0) {
        window.DataService.sendOperations(operations);
    }
}

// Apply translations to static UI elements
function applyLanguage() {
    const t = translations[currentLanguage];
    // Set direction for RTL languages
    document.documentElement.setAttribute('dir', currentLanguage === 'he' ? 'rtl' : 'ltr');
    document.getElementById('app-title').innerText = t.app_title;
    document.getElementById('language-label').innerText = t.language_label;
    document.getElementById('tab-lists').innerText = t.tab_lists;
    document.getElementById('tab-summary').innerText = t.tab_summary;
    document.getElementById('tab-items').innerText = t.tab_items;
    document.getElementById('tab-archive').innerText = t.tab_archive;
    document.getElementById('tab-settings').innerText = t.tab_settings;
    // Clear data button
    const clearBtn = document.getElementById('clear-data-button');
    if (clearBtn) {
        clearBtn.innerText = t.clear_data;
    }
    document.getElementById('lists-title').innerText = t.lists_title;
    const addListBtn = document.getElementById('add-list-button');
    addListBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    addListBtn.title = t.add_list;
    addListBtn.classList.add('btn', 'btn-primary', 'btn-sm');
    document.getElementById('summary-title').innerText = t.summary_title;
    document.getElementById('items-title').innerText = t.items_title;
    document.getElementById('archive-title').innerText = t.archive_title;
    document.getElementById('settings-title').innerText = t.settings_title;
    document.getElementById('currency-label').innerText = t.currency_label;
    document.getElementById('receipt-label').innerText = t.receipt_label;
    // Search placeholder for item search input (if exists)
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.placeholder = t.search_placeholder;
    }
    // Global item modal labels
    const globalModal = document.getElementById('global-item-modal-overlay');
    if (globalModal) {
        document.getElementById('global-item-modal-title').innerText = editingGlobalItemId ? t.modal_edit_global_item : t.modal_new_global_item;
        document.getElementById('global-name-label').innerText = t.global_name;
        document.getElementById('global-category-label').innerText = t.global_category;
        document.getElementById('global-price-label').innerText = t.global_price;
        document.getElementById('global-unit-label').innerText = t.global_unit;
        document.getElementById('save-global-item').innerText = t.save;
        document.getElementById('cancel-global-item-modal').innerText = t.cancel;
        const addGlobalBtn = document.getElementById('add-global-item-button');
        addGlobalBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
        addGlobalBtn.title = t.add_global_item;
        addGlobalBtn.classList.add('btn', 'btn-primary', 'btn-sm');
    }
    // Categories section
    const categoriesTitleEl = document.getElementById('categories-title');
    if (categoriesTitleEl) categoriesTitleEl.innerText = t.categories_title;
    const addCategoryBtn = document.getElementById('add-category-button');
    if (addCategoryBtn) {
        addCategoryBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
        addCategoryBtn.title = t.add_category;
        addCategoryBtn.classList.add('btn', 'btn-primary', 'btn-sm');
    }
    // Render categories names to update language
    renderCategories();
    // Modal texts
    document.getElementById('list-name-label').innerText = t.list_name_label;
    document.getElementById('save-list').innerText = t.save;
    document.getElementById('cancel-modal').innerText = t.cancel;
    document.getElementById('item-name-label').innerText = t.item_name;
    document.getElementById('item-category-label').innerText = t.item_category;
    document.getElementById('item-quantity-label').innerText = t.item_quantity;
    document.getElementById('item-price-label').innerText = t.item_price;
    document.getElementById('item-notes-label').innerText = t.item_notes;
    // Unit label
    const unitLabel = document.getElementById('item-unit-label');
    if (unitLabel) unitLabel.innerText = t.item_unit;
    // Price basis label
    const priceBasisLabel = document.getElementById('item-price-basis-label');
    if (priceBasisLabel) priceBasisLabel.innerText = t.item_price_basis;
    document.getElementById('save-item').innerText = t.save;
    document.getElementById('cancel-item-modal').innerText = t.cancel;
    const addItemBtn = document.getElementById('add-item-button');
    addItemBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
    addItemBtn.title = t.add_item;
    addItemBtn.className = 'btn btn-primary btn-sm';
    const completeBtn = document.getElementById('complete-list-button');
    if (completeBtn) {
        completeBtn.innerHTML = '<i class="bi bi-check2-circle"></i>';
        completeBtn.title = t.complete_list;
        completeBtn.className = 'btn btn-success btn-sm';
    }
    const undoBtn = document.getElementById('undo-button');
    if (undoBtn) {
        undoBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i>';
        undoBtn.title = t.undo;
        undoBtn.className = 'btn btn-secondary btn-sm';
    }
    const redoBtn = document.getElementById('redo-button');
    if (redoBtn) {
        redoBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
        redoBtn.title = t.redo;
        redoBtn.className = 'btn btn-secondary btn-sm';
    }
    const closeBtn = document.getElementById('close-list-details');
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.title = t.close;
    closeBtn.className = 'btn btn-secondary btn-sm';
    const fsBtn = document.getElementById('toggle-fullscreen');
    if (fsBtn) {
        fsBtn.innerHTML = listFullscreen ? '<i class="bi bi-fullscreen-exit"></i>' : '<i class="bi bi-fullscreen"></i>';
        fsBtn.title = listFullscreen ? t.restore : t.maximize;
        fsBtn.className = 'btn btn-secondary btn-sm';
    }
    const checkedHeading = document.getElementById('checked-heading');
    if (checkedHeading) checkedHeading.innerText = t.purchased;
    // Populate categories select for list items using data.categories
    const select = document.getElementById('item-category-select');
    if (select) {
        select.innerHTML = '';
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            // Use names translation if available
            const name = cat.names ? (cat.names[currentLanguage] || cat.names.en || cat.names.he || cat.id) : (t[cat.nameKey] || cat.id);
            option.textContent = name;
            select.appendChild(option);
        });
    }
    // Render lists and summary again to update text and direction
    renderLists();
    renderSummary();
    // Render global items and archive for language changes
    renderGlobalItems();

    // Update global item suggestions for item modal
    updateGlobalItemSuggestions();

    // Update import/export section texts
    const importTitle = document.getElementById('import-title');
    const importLabel = document.getElementById('import-label');
    const importButton = document.getElementById('import-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    if (importTitle) importTitle.innerText = t.import_title;
    if (importLabel) importLabel.innerText = t.import_label;
    if (importButton) importButton.innerText = t.import_button;
    if (exportCsvButton) exportCsvButton.innerText = t.export_csv;
}

// Show/hide pages based on tab selection
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`page-${pageName}`).classList.add('active');
    document.getElementById(`tab-${pageName}`).classList.add('active');
}

// Render the list of shopping lists
function renderLists() {
    const container = document.getElementById('list-container');
    container.innerHTML = '';
    data.lists.forEach(list => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex align-items-start justify-content-between gap-2';
        li.setAttribute('data-list-id', list.id);
        const t = translations[currentLanguage];
        // List name and stats
        const info = document.createElement('div');
        info.className = 'flex-grow-1';
        const nameSpan = document.createElement('strong');
        nameSpan.textContent = list.name;
        info.appendChild(nameSpan);
        // Stats: purchased/total
        const total = list.items.length;
        const purchased = list.items.filter(i => i.isChecked).length;
        const stats = document.createElement('div');
        stats.className = 'small text-muted';
        stats.textContent = `${t.purchased}: ${purchased}/${total}`;
        info.appendChild(stats);
        li.appendChild(info);
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group btn-group-sm';
        // Manage Items button
        const manageBtn = document.createElement('button');
        manageBtn.className = 'btn btn-outline-primary';
        manageBtn.innerHTML = '<i class="bi bi-list-task"></i>';
        manageBtn.title = t.manage_items;
        manageBtn.addEventListener('click', () => openListDetails(list.id));
        btnGroup.appendChild(manageBtn);
        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'btn btn-outline-secondary';
        renameBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        renameBtn.title = t.rename_list;
        renameBtn.addEventListener('click', () => openListModal(list.id));
        btnGroup.appendChild(renameBtn);
        // Share link button
        const linkBtn = document.createElement('button');
        linkBtn.className = 'btn btn-outline-secondary';
        linkBtn.innerHTML = '<i class="bi bi-link-45deg"></i>';
        linkBtn.title = t.share_link;
        linkBtn.addEventListener('click', () => shareList(list.id));
        btnGroup.appendChild(linkBtn);
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = t.delete_list;
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete list?')) {
                data.lists = data.lists.filter(l => l.id !== list.id);
                saveData();
                renderLists();
                renderSummary();
            }
        });
        btnGroup.appendChild(deleteBtn);
        li.appendChild(btnGroup);

        // Check if list is being edited
        if (window.DataService.isBeingEdited(list.id)) {
            const editor = window.DataService.getActiveEditors(list.id);
            showEditingBadge(editor.userId, list.id);
        }

        container.appendChild(li);
    });
}

// Render purchase summary across all lists
function renderSummary() {
    const container = document.getElementById('summary-content');
    const t = translations[currentLanguage];
    container.innerHTML = '';
    let totalCostAll = 0;
    data.lists.forEach(list => {
        const section = document.createElement('div');
        section.style.marginBottom = '1rem';
        const heading = document.createElement('h3');
        heading.textContent = list.name;
        section.appendChild(heading);
        const itemsPurchased = list.items.filter(i => i.isChecked);
        const itemsMissing = list.items.filter(i => !i.isChecked);
        // Calculate total cost using actual or estimated price with basis and track estimated cost separately
        let totalCost = 0;
        let totalEstimated = 0;
        itemsPurchased.forEach(item => {
            const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
            const basis = item.priceBasisQuantity || 1;
            // Actual cost
            let actualCost = 0;
            if (item.actualPrice != null) {
                actualCost = item.actualPrice * (item.quantity / basis);
            } else if (globalItem && globalItem.priceUnit === item.quantityUnit) {
                actualCost = (globalItem.estimatedPrice || 0) * (item.quantity / basis);
            }
            totalCost += actualCost;
            // Estimated cost from global item if units match
            let estCost = 0;
            if (globalItem && globalItem.priceUnit === item.quantityUnit) {
                estCost = (globalItem.estimatedPrice || 0) * (item.quantity / basis);
            }
            totalEstimated += estCost;
        });
        totalCostAll += totalCost;
        const purchasedP = document.createElement('p');
        purchasedP.textContent = `${t.purchased}: ${itemsPurchased.length}`;
        section.appendChild(purchasedP);
        const missingP = document.createElement('p');
        missingP.textContent = `${t.missing}: ${itemsMissing.length}`;
        section.appendChild(missingP);
        const currency = document.getElementById('default-currency').value || '';
        // Show total cost and difference (actual - estimated) if available
        const costP = document.createElement('p');
        costP.textContent = `${t.total_cost}: ${currency}${totalCost.toFixed(2)}`;
        section.appendChild(costP);
        if (totalEstimated > 0) {
            const diff = totalCost - totalEstimated;
            const diffP = document.createElement('p');
            diffP.style.fontSize = '0.8rem';
            diffP.style.color = diff >= 0 ? 'red' : 'green';
            const sign = diff >= 0 ? '+' : '-';
            diffP.textContent = `Difference: ${sign}${currency}${Math.abs(diff).toFixed(2)}`;
            section.appendChild(diffP);
        }
        // Button to create new list with missing items
        if (itemsMissing.length > 0) {
            const createBtn = document.createElement('button');
            createBtn.className = 'btn btn-outline-primary btn-sm';
            createBtn.innerHTML = '<i class="bi bi-plus-lg"></i>';
            createBtn.title = t.create_from_missing;
            createBtn.addEventListener('click', () => {
                if (!confirm(t.create_from_missing + '?')) return;
                const newList = {
                    id: 'list-' + Date.now(),
                    name: list.name + ' - ' + t.missing,
                    items: itemsMissing.map(item => ({ ...item, id: 'item-' + Date.now() + Math.random() }))
                };
                data.lists.push(newList);
                saveData();
                renderLists();
                renderSummary();
                alert('New list created');
            });
            section.appendChild(createBtn);
        }
        container.appendChild(section);
    });
    // Overall total cost
    const overall = document.createElement('p');
    const currency = document.getElementById('default-currency').value || '';
    overall.style.fontWeight = 'bold';
    overall.textContent = `${t.total_cost}: ${currency}${totalCostAll.toFixed(2)}`;
    container.appendChild(overall);
}

// Render list of global items
function renderGlobalItems() {
    const container = document.getElementById('global-items-container');
    container.innerHTML = '';
    const t = translations[currentLanguage];
    const currency = document.getElementById('default-currency').value || '';
    data.globalItems.forEach(item => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '0.5rem';
        li.style.marginBottom = '0.5rem';
        li.style.backgroundColor = '#f5f5f5';
        li.style.borderRadius = '4px';
        // Info
        const info = document.createElement('div');
        info.style.flex = '1';
        const itemName = document.createElement('strong');
        itemName.textContent = item.name;
        info.appendChild(itemName);
        const cat = data.categories.find(c => c.id === item.categoryId);
        const catName = cat ? (cat.names[currentLanguage] || cat.names.en || cat.names.he || cat.id) : item.categoryId;
        const details = document.createElement('div');
        details.style.fontSize = '0.8rem';
        details.style.marginTop = '0.25rem';
        details.textContent = `${catName} – ${currency}${item.estimatedPrice.toFixed(2)} / ${item.priceUnit}`;
        info.appendChild(details);
        li.appendChild(info);
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline-secondary btn-sm';
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.title = t.edit_global_item;
        editBtn.addEventListener('click', () => openGlobalItemModal(item.id));
        li.appendChild(editBtn);
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger btn-sm';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = t.delete_list;
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete global item?')) {
                data.globalItems = data.globalItems.filter(g => g.id !== item.id);
                // Remove references in list items
                data.lists.forEach(list => {
                    list.items = list.items.filter(li => li.globalItemId !== item.id);
                });
                saveData();
                renderGlobalItems();
                renderLists();
                renderSummary();
            }
        });
        li.appendChild(deleteBtn);
        container.appendChild(li);
    });
    // Update suggestions after rendering
    updateGlobalItemSuggestions();
}

// Open global item modal (new or edit)
function openGlobalItemModal(itemId = null) {
    editingGlobalItemId = itemId;
    const overlay = document.getElementById('global-item-modal-overlay');
    const t = translations[currentLanguage];
    const titleEl = document.getElementById('global-item-modal-title');
    titleEl.textContent = itemId ? t.modal_edit_global_item : t.modal_new_global_item;
    // Populate category select
    const catSelect = document.getElementById('global-category-select');
    catSelect.innerHTML = '';
    data.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.names[currentLanguage] || cat.names.en || cat.names.he;
        catSelect.appendChild(opt);
    });
    if (itemId) {
        const item = data.globalItems.find(g => g.id === itemId);
        document.getElementById('global-name-input').value = item.name;
        document.getElementById('global-category-select').value = item.categoryId;
        document.getElementById('global-price-input').value = item.estimatedPrice;
        document.getElementById('global-unit-select').value = item.priceUnit;
    } else {
        document.getElementById('global-name-input').value = '';
        document.getElementById('global-category-select').value = data.categories[0].id;
        document.getElementById('global-price-input').value = 0;
        document.getElementById('global-unit-select').value = 'piece';
    }
    overlay.classList.remove('hidden');
}

function closeGlobalItemModal() {
    document.getElementById('global-item-modal-overlay').classList.add('hidden');
}

function saveGlobalItem() {
    const itemName = document.getElementById('global-name-input').value.trim();
    const categoryId = document.getElementById('global-category-select').value;
    const price = parseFloat(document.getElementById('global-price-input').value) || 0;
    const unit = document.getElementById('global-unit-select').value;

    if (!itemName) {
        showUpdateNotification('Item name is required', 'error');
        return;
    }

    // Check for duplicate names (case-insensitive)
    const existingItem = data.globalItems.find(g =>
        g.id !== editingGlobalItemId &&
        g.name.toLowerCase() === itemName.toLowerCase()
    );

    if (existingItem) {
        showUpdateNotification('An item with this name already exists', 'error');
        return;
    }

    if (editingGlobalItemId) {
        const item = data.globalItems.find(g => g.id === editingGlobalItemId);
        if (item) {
            item.name = itemName;
            item.categoryId = categoryId;
            item.estimatedPrice = price;
            item.priceUnit = unit;
            item.updatedAt = new Date().toISOString();
        }
    } else {
        const newItem = {
            id: 'global-' + Date.now() + '-' + Math.random().toString(36).slice(2),
            name: itemName,
            categoryId,
            estimatedPrice: price,
            priceUnit: unit,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.globalItems.push(newItem);
    }

    saveData(true, editingGlobalItemId ? 'update' : 'create',
        editingGlobalItemId ? `globalItems/${editingGlobalItemId}` : 'globalItems',
        editingGlobalItemId ? data.globalItems.find(g => g.id === editingGlobalItemId) : data.globalItems[data.globalItems.length - 1]
    );

    renderGlobalItems();
    updateGlobalItemSuggestions();
    updateCategoryDropdowns();
    closeGlobalItemModal();

    showUpdateNotification(
        editingGlobalItemId ? `Updated item "${itemName}"` : `Created item "${itemName}"`,
        'success'
    );

    // Reset editing state
    editingGlobalItemId = null;
}

// Open list creation/edit modal
function openListModal(listId = null) {
    editingListId = listId;
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const t = translations[currentLanguage];
    if (listId) {
        title.textContent = t.modal_edit_list;
        const list = data.lists.find(l => l.id === listId);
        document.getElementById('list-name-input').value = list ? list.name : '';
    } else {
        title.textContent = t.modal_new_list;
        document.getElementById('list-name-input').value = '';
    }
    overlay.classList.remove('hidden');
}

function closeListModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

// Save list (new or edited)
function saveList() {
    const listName = document.getElementById('list-name-input').value.trim();
    if (!listName) return;

    if (editingListId) {
        // Edit existing
        const list = data.lists.find(l => l.id === editingListId);
        if (list) {
            const oldName = list.name;
            list.name = listName;
            list.updatedAt = new Date().toISOString();

            // Track the operation for collaborative editing
            saveData(true, 'update', `lists/${editingListId}`, list);

            showUpdateNotification(`List renamed from "${oldName}" to "${listName}"`, 'success');
        }
    } else {
        // Create new
        const newList = {
            id: 'list-' + Date.now(),
            name: listName,
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.lists.push(newList);

        // Track the operation for collaborative editing
        saveData(true, 'create', 'lists', newList);

        showUpdateNotification(`List "${listName}" created`, 'success');
    }

    renderLists();
    closeListModal();
    renderSummary();
}

// Open list details overlay to manage items
function openListDetails(listId, isArchive = false) {
    editingArchive = isArchive;
    editingItemListId = listId;
    editingItemId = null;

    // Track editing presence
    window.DataService.updatePresence('editStart', listId);
    isEditing = true;
    currentEditingContext = { listId, isArchive };

    const overlay = document.getElementById('list-details-overlay');
    const title = document.getElementById('list-details-title');

    const list = (isArchive ? data.archivedLists : data.lists).find(l => l.id === listId);
    const t = translations[currentLanguage];

    if (list) {
        title.textContent = list.name;
        title.setAttribute('data-list-id', listId);
        renderItems(list);
    }

    overlay.classList.remove('hidden');
    const url = new URL(window.location);
    url.searchParams.set('list', listId);
    history.replaceState(null, '', url);
    applyFullscreenState();

    // Show editing indicators
    showEditingIndicators(listId);
}

function closeListDetails() {
    const overlay = document.getElementById('list-details-overlay');
    overlay.classList.add('hidden');

    // Clear search field
    clearSearchField();

    // Clear editing presence
    if (currentEditingContext) {
        window.DataService.updatePresence('editEnd', currentEditingContext.listId);
        clearEditingBadges(currentEditingContext.listId);
        currentEditingContext = null;
    }

    isEditing = false;

    const url = new URL(window.location);
    url.searchParams.delete('list');
    history.replaceState(null, '', url);
}

// Open item modal to create or edit an item
function openItemModal(listId, itemId = null) {
    editingItemListId = listId;
    editingItemId = itemId;

    // Check if item is being edited by someone else
    if (itemId && window.DataService.isBeingEdited(listId, itemId)) {
        const editor = window.DataService.getActiveEditors(listId, itemId);
        if (!confirm(`${editor.userId} is currently editing this item. Continue anyway?`)) {
            return;
        }
    }

    // Track editing presence
    window.DataService.updatePresence('editStart', listId, itemId);

    const overlay = document.getElementById('item-modal-overlay');
    const t = translations[currentLanguage];
    const title = document.getElementById('item-modal-title');

    if (itemId) {
        title.textContent = t.item_modal_edit;
        const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === listId);
        const item = list.items.find(i => i.id === itemId);

        // Get global item to prefill name properly
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const nameInput = document.getElementById('item-name-input');

        // Properly prefill the item name
        nameInput.value = globalItem ? globalItem.name : '';
        if (globalItem) {
            nameInput.dataset.selectedId = globalItem.id;
        } else {
            delete nameInput.dataset.selectedId;
        }

        // Update category dropdown with current categories
        updateCategoryDropdowns();

        // Set form values
        document.getElementById('item-category-select').value = globalItem ? globalItem.categoryId : data.categories[0].id;
        document.getElementById('item-quantity-input').value = item.quantity;
        document.getElementById('item-unit-select').value = item.quantityUnit || (globalItem ? globalItem.priceUnit : 'piece');
        document.getElementById('item-price-input').value = item.actualPrice != null ? item.actualPrice : '';
        document.getElementById('item-price-basis-input').value = item.priceBasisQuantity || 1;
        document.getElementById('item-notes-input').value = item.notes || '';
    } else {
        title.textContent = t.item_modal_new;
        const nameInput = document.getElementById('item-name-input');
        nameInput.value = '';
        delete nameInput.dataset.selectedId;

        // Update category dropdown
        updateCategoryDropdowns();

        // Reset form to defaults
        document.getElementById('item-category-select').value = data.categories[0]?.id || '';
        document.getElementById('item-quantity-input').value = 1;
        document.getElementById('item-unit-select').value = 'piece';
        document.getElementById('item-price-input').value = '';
        document.getElementById('item-price-basis-input').value = 1;
        document.getElementById('item-notes-input').value = '';
    }

    // Add data attributes for tracking
    const modal = document.getElementById('item-modal');
    modal.setAttribute('data-list-id', listId);
    if (itemId) modal.setAttribute('data-item-id', itemId);

    overlay.classList.remove('hidden');
}

function closeItemModal() {
    const overlay = document.getElementById('item-modal-overlay');
    overlay.classList.add('hidden');

    // Clear editing presence
    if (editingItemListId) {
        window.DataService.updatePresence('editEnd', editingItemListId, editingItemId);
        clearEditingBadges(editingItemListId, editingItemId);
    }

    const nameInput = document.getElementById('item-name-input');
    if (nameInput) delete nameInput.dataset.selectedId;
}

// Save item (new or edited)
function saveItem() {
    const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === editingItemListId);
    if (!list) return;

    const nameInput = document.getElementById('item-name-input');
    const itemName = nameInput.value.trim();
    const categoryId = document.getElementById('item-category-select').value;
    const quantity = parseFloat(document.getElementById('item-quantity-input').value) || 1;
    const quantityUnit = document.getElementById('item-unit-select').value || 'piece';
    // Parse actual price; if input is empty or whitespace treat as null so that estimated price is used
    const priceStr = document.getElementById('item-price-input').value.trim();
    const price = priceStr ? parseFloat(priceStr) : null;
    const priceBasisQuantity = parseFloat(document.getElementById('item-price-basis-input').value) || 1;
    const notes = document.getElementById('item-notes-input').value.trim();
    if (!itemName) return;
    // Determine global item reference
    let globalItem = null;
    if (nameInput.dataset.selectedId) {
        globalItem = data.globalItems.find(g => g.id === nameInput.dataset.selectedId);
    }
    if (!globalItem) {
        // Find existing global item by name and category
        globalItem = data.globalItems.find(g => g.name.toLowerCase() === itemName.toLowerCase() && g.categoryId === categoryId);
    }
    if (!globalItem) {
        // Create new global item; use estimated price from actual price input if provided, otherwise 0
        const estimated = price != null ? price : 0;
        globalItem = {
            id: 'global-' + Date.now() + Math.random(),
            name: itemName,
            categoryId,
            estimatedPrice: estimated,
            priceUnit: quantityUnit,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.globalItems.push(globalItem);
    }

    let newItem = null;

    if (editingItemId) {
        // Edit existing list item
        const item = list.items.find(i => i.id === editingItemId);
        if (item) {
            // If the global item reference has changed and another item with the same global item exists,
            // merge them instead of creating duplicates
            item.globalItemId = globalItem.id;
            // Check if there is another item in the same list with the same globalItemId (excluding this item)
            const duplicate = list.items.find(i => i.id !== item.id && i.globalItemId === globalItem.id);
            if (duplicate) {
                // Merge current item's data into the duplicate
                // Sum quantities if units match; otherwise keep separate quantities but still merge
                if (duplicate.quantityUnit === quantityUnit) {
                    duplicate.quantity += quantity;
                } else {
                    // Different units; store them separately by creating a notes entry
                    duplicate.notes = duplicate.notes ? `${duplicate.notes}; ${quantity} ${quantityUnit}` : `${quantity} ${quantityUnit}`;
                }
                // Prefer actual price from the edit if provided, otherwise keep existing
                if (price != null) duplicate.actualPrice = price;
                // Merge price basis quantity: take max of the two (to avoid losing precision)
                duplicate.priceBasisQuantity = Math.max(duplicate.priceBasisQuantity || 1, priceBasisQuantity || 1);
                // Merge notes
                if (notes) {
                    duplicate.notes = duplicate.notes ? `${duplicate.notes}; ${notes}` : notes;
                }
                // Remove the old item from list
                const index = list.items.findIndex(i => i.id === item.id);
                if (index >= 0) list.items.splice(index, 1);
                newItem = duplicate;
            } else {
                // No duplicate, just update the item values normally
                item.quantity = quantity;
                item.quantityUnit = quantityUnit;
                item.actualPrice = price;
                item.priceBasisQuantity = priceBasisQuantity;
                item.notes = notes;
                newItem = item;
            }
        }
    } else {
        // When creating a new list item, check if one already exists with the same globalItemId
        const existing = list.items.find(i => i.globalItemId === globalItem.id && i.quantityUnit === quantityUnit);
        if (existing) {
            // Merge new quantity and details into existing item
            existing.quantity += quantity;
            if (price != null) existing.actualPrice = price;
            existing.priceBasisQuantity = Math.max(existing.priceBasisQuantity || 1, priceBasisQuantity || 1);
            if (notes) {
                existing.notes = existing.notes ? `${existing.notes}; ${notes}` : notes;
            }
            newItem = existing;
        } else {
            // Create new list item with wrapper referencing global item
            newItem = {
                id: 'item-' + Date.now() + Math.random(),
                globalItemId: globalItem.id,
                quantity,
                quantityUnit,
                actualPrice: price,
                priceBasisQuantity,
                notes,
                isChecked: false
            };
            list.items.push(newItem);
        }
    }
    const operationType = editingItemId ? 'update' : 'create';
    const operationPath = editingItemId ?
        `lists/${editingItemListId}/items/${editingItemId}` :
        `lists/${editingItemListId}/items`;

    // Track the operation for collaborative editing
    saveData(true, operationType, operationPath, newItem);

    renderItems(list);
    renderLists();
    renderSummary();
    renderGlobalItems();
    updateGlobalItemSuggestions();

    if (editingArchive) {
        renderArchive();
    }

    closeItemModal();
}

// Import lists from Google Keep note text
function importFromKeep() {
    const textarea = document.getElementById('import-textarea');
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) return;
    // Ask for list name (default: Imported List)
    let listName = prompt('List name', 'Imported List');
    if (!listName) return;
    const lines = text.split(/\r?\n/);
    const items = [];
    let currentCategoryName = null;
    lines.forEach(line => {
        // Remove comments after '//'
        const commentIndex = line.indexOf('//');
        let contentLine = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
        // Trim whitespace and indentation
        let trimmed = contentLine.trim();
        if (!trimmed) return;
        // Match checkbox pattern [ ] or [X]
        const match = trimmed.match(/^\[([ X])\]\s*(.*)$/);
        if (!match) return;
        const checkedChar = match[1];
        let content = match[2].trim();
        const isChecked = checkedChar.toUpperCase() === 'X';
        if (!content) return;
        // Category line if content ends with ':'
        if (content.endsWith(':')) {
            const categoryName = content.slice(0, -1).trim();
            if (categoryName) {
                currentCategoryName = categoryName;
            }
            return;
        }
        // Item line
        let itemName = content;
        let notes = '';
        // Extract note after '-' character
        const dashIndex = itemName.indexOf('-');
        if (dashIndex >= 0) {
            notes = itemName.slice(dashIndex + 1).trim();
            itemName = itemName.slice(0, dashIndex).trim();
        }
        // Extract quantity and unit from patterns like "Bananas*4", "Bananas*4 kg" or "Bananas x4"
        let quantity = 1;
        let quantityUnit = 'piece';
        const qtyMatch = itemName.match(/^(.*?)[*×x]\s*(\d+(?:\.\d+)?)(?:\s*(kg|liter|package|piece))?$/i);
        if (qtyMatch) {
            itemName = qtyMatch[1].trim();
            quantity = parseFloat(qtyMatch[2]);
            if (qtyMatch[3]) quantityUnit = qtyMatch[3].toLowerCase();
        }
        // Determine category: currentCategoryName or default 'Other'
        let categoryName = currentCategoryName || translations[currentLanguage].category_other;
        // Find or create category object
        let categoryObj = data.categories.find(cat => (cat.names.en === categoryName || cat.names.he === categoryName || cat.id === categoryName.toLowerCase()));
        if (!categoryObj) {
            const id = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/gi, '') + '-' + Date.now();
            categoryObj = { id, names: { en: categoryName, he: categoryName } };
            data.categories.push(categoryObj);
        }
        const globalName = itemName.trim();
        if (!globalName) return;
        // Find or create global item
        let globalItem = data.globalItems.find(g => g.name.toLowerCase() === globalName.toLowerCase() && g.categoryId === categoryObj.id);
        if (!globalItem) {
            globalItem = {
                id: 'global-' + Date.now() + Math.random(),
                name: globalName,
                categoryId: categoryObj.id,
                estimatedPrice: 0,
                priceUnit: quantityUnit,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            data.globalItems.push(globalItem);
        }
        items.push({
            id: 'item-' + Date.now() + Math.random(),
            globalItemId: globalItem.id,
            quantity,
            quantityUnit,
            actualPrice: null,
            priceBasisQuantity: 1,
            notes,
            isChecked
        });
    });
    if (items.length === 0) {
        alert('No items found to import');
        return;
    }
    const newList = { id: 'list-' + Date.now(), name: listName, items };
    data.lists.push(newList);
    saveData();
    textarea.value = '';
    renderLists();
    renderSummary();
    renderGlobalItems();
    updateGlobalItemSuggestions();
    alert('Imported ' + items.length + (items.length === 1 ? ' item' : ' items'));
}

// Export shopping data to CSV
function exportToCSV() {
    try {
        const rows = [];
        const t = translations[currentLanguage];

        // Header
        rows.push(['List Name', 'Item Name', 'Quantity', 'Unit', 'Price', 'Basis Quantity', 'Category', 'Actual Price', 'Date Completed']);

        const allLists = [...data.lists, ...data.archivedLists];
        allLists.forEach(list => {
            list.items.forEach(item => {
                const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
                const itemName = globalItem ? globalItem.name : (item.name || 'Unknown Item');
                const categoryId = globalItem ? globalItem.categoryId : item.categoryId;
                const category = data.categories.find(c => c.id === categoryId);
                const categoryName = category ? (category.names[currentLanguage] || category.names.en || category.id) : '';
                const priceVal = item.actualPrice != null ? item.actualPrice : (globalItem ? globalItem.estimatedPrice : 0);
                const basis = item.priceBasisQuantity || 1;
                const actualPrice = item.actualPrice != null ? priceVal : '';
                const dateCompleted = list.completedAt || '';

                rows.push([
                    list.name,
                    itemName,
                    item.quantity,
                    item.quantityUnit,
                    priceVal,
                    basis,
                    categoryName,
                    actualPrice,
                    dateCompleted
                ]);
            });
        });

        const csvContent = rows.map(r => r.map(field => {
            const s = String(field == null ? '' : field);
            return '"' + s.replace(/"/g, '""') + '"';
        }).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `shopping-data-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showUpdateNotification('CSV file downloaded successfully', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showUpdateNotification('Failed to export CSV file', 'error');
    }
}

// Clear all data from localStorage and reset app
async function clearAllData() {
    const t = translations[currentLanguage];
    if (!confirm(t.confirm_clear)) return;
    // Use DataService to clear persisted data
    await window.DataService.clearData();
    // Reset in-memory data to defaults
    data = {
        lists: [],
        globalItems: [],
        categories: [],
        archivedLists: [],
        receipts: []
    };
    // Reload default categories and save to storage
    await loadData();
    saveData();
    // Re-render all views
    renderLists();
    renderSummary();
    renderGlobalItems();
    renderArchive();
    renderCategories();
    updateGlobalItemSuggestions();
    alert(t.clear_data + ' done');
}

// Complete a list and move it to archive
function completeList(listId) {
    const index = data.lists.findIndex(l => l.id === listId);
    if (index === -1) return;
    if (!confirm('Mark this list as completed?')) return;
    const list = data.lists[index];
    list.isCompleted = true;
    list.completedAt = new Date().toISOString();
    // You might want to attach receipts here (global receipts)
    // For now just copy global receipts as list receipts and clear global
    list.receiptImages = (data.receipts || []).slice();
    data.receipts = [];
    // Move to archive
    data.archivedLists.push(list);
    data.lists.splice(index, 1);
    saveData();
    renderLists();
    renderSummary();
    renderArchive();
    closeListDetails();
}

// Presence and collaboration features
function showPresenceIndicators() {
    // Add connected users indicator to header
    let presenceIndicator = document.getElementById('presence-indicator');
    if (!presenceIndicator) {
        presenceIndicator = document.createElement('div');
        presenceIndicator.id = 'presence-indicator';
        presenceIndicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: white;
            font-size: 0.8rem;
        `;

        const header = document.querySelector('header');
        const languageToggle = document.querySelector('.language-toggle');
        header.insertBefore(presenceIndicator, languageToggle);
    }

    const onlineCount = connectedUsers.length;

    presenceIndicator.innerHTML = `
        <i class="bi bi-people"></i>
        <span>${onlineCount} ${onlineCount === 1 ? 'user' : 'users'} online</span>
        ${window.DataService?.isConnected ? '<i class="bi bi-wifi" style="color: #4caf50;"></i>' : '<i class="bi bi-wifi-off" style="color: #f44336;"></i>'}
    `;
}

function showEditingIndicators(listId, itemId = null) {
    const key = itemId ? `${listId}/${itemId}` : listId;
    const editor = activeEditors[key];

    if (editor && editor.clientId !== window.DataService.clientId) {
        // Show indicator that someone else is editing
        showEditingBadge(editor.userId, listId, itemId);
    }
}

function showEditingBadge(userName, listId, itemId = null) {
    const targetSelector = itemId ?
        `[data-item-id="${itemId}"]` :
        `[data-list-id="${listId}"]`;

    const target = document.querySelector(targetSelector);
    if (target && !target.querySelector('.editing-badge')) {
        const badge = document.createElement('span');
        badge.className = 'editing-badge';
        badge.style.cssText = `
            background: #2196f3;
            color: white;
            font-size: 0.7rem;
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 0.5rem;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
        `;
        badge.innerHTML = `<i class="bi bi-pencil"></i>${userName}`;
        target.appendChild(badge);
    }
}

function clearEditingBadges(listId = null, itemId = null) {
    if (listId && itemId) {
        const target = document.querySelector(`[data-item-id="${itemId}"]`);
        const badge = target?.querySelector('.editing-badge');
        badge?.remove();
    } else if (listId) {
        const target = document.querySelector(`[data-list-id="${listId}"]`);
        const badge = target?.querySelector('.editing-badge');
        badge?.remove();
    } else {
        document.querySelectorAll('.editing-badge').forEach(badge => badge.remove());
    }
}

// Enhanced conflict resolution UI
function showConflictResolutionModal(conflicts, mergedData, originalData) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        modal.innerHTML = `
            <h3>Resolve Conflicts</h3>
            <p>Your changes conflict with recent updates from other users. Please choose how to resolve:</p>
            <div id="conflict-list"></div>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="accept-merged" class="btn btn-primary">Accept Merged Version</button>
                <button id="keep-mine" class="btn btn-secondary">Keep My Changes</button>
                <button id="manual-resolve" class="btn btn-outline-primary">Manual Review</button>
            </div>
        `;

        const conflictList = modal.querySelector('#conflict-list');
        conflicts.forEach(conflict => {
            const conflictDiv = document.createElement('div');
            conflictDiv.style.cssText = `
                border: 1px solid #ddd;
                padding: 1rem;
                margin: 1rem 0;
                border-radius: 4px;
            `;

            if (conflict.type === 'list_conflict') {
                conflictDiv.innerHTML = `
                    <h4>List: ${conflict.serverVersion.name}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <strong>Server Version:</strong>
                            <div style="background: #f0f8ff; padding: 0.5rem; border-radius: 4px;">
                                ${conflict.serverVersion.name} (${conflict.serverVersion.items?.length || 0} items)
                            </div>
                        </div>
                        <div>
                            <strong>Your Version:</strong>
                            <div style="background: #fff8dc; padding: 0.5rem; border-radius: 4px;">
                                ${conflict.localVersion.name} (${conflict.localVersion.items?.length || 0} items)
                            </div>
                        </div>
                    </div>
                `;
            }
            conflictList.appendChild(conflictDiv);
        });

        modal.querySelector('#accept-merged').addEventListener('click', () => {
            overlay.remove();
            resolve(mergedData);
        });

        modal.querySelector('#keep-mine').addEventListener('click', () => {
            overlay.remove();
            resolve(originalData);
        });

        modal.querySelector('#manual-resolve').addEventListener('click', () => {
            overlay.remove();
            resolve(null); // Let user manually resolve
        });

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
}

// Enhanced real-time operation handlers with proper item name handling
window.onPresenceUpdated = function(users, editors) {
    connectedUsers = users;
    activeEditors = editors;
    showPresenceIndicators();
};

window.onRemoteDataUpdated = function(remoteData) {
    data = remoteData;
    refreshUI();
    showPresenceIndicators();
};

window.onRemoteOperationsApplied = function(operations) {
    // Handle batch operations from other clients
    console.log('Remote operations applied:', operations);
    showUpdateNotification(`${operations.length} updates from other users`);
};

window.onRemoteOperationReceived = function(operation) {
    // Handle single real-time operation
    console.log('Real-time operation received:', operation);

    if (operation.path.startsWith('lists/')) {
        renderLists();
        if (isEditing && currentEditingContext) {
            const list = data.lists.find(l => l.id === currentEditingContext.listId);
            if (list) renderItems(list);
        }
    }
};

// Enhanced socket event handlers for specific operations
function setupSocketEventHandlers() {
    if (!window.DataService?.socket) return;

    const socket = window.DataService.socket;

    // Item events with proper name handling
    socket.on('itemAdded', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        const list = data.lists.find(l => l.id === payload.listId);
        if (list) {
            // Add item with name already included from server
            const newItem = {
                ...payload.item,
                name: payload.item.name // Use server-provided name
            };
            list.items.push(newItem);

            // Update UI if this list is currently being viewed
            if (editingItemListId === payload.listId) {
                renderItems(list);
            }
            renderLists();
            renderSummary();

            showUpdateNotification(`New item "${payload.item.name}" added to ${list.name}`, 'info');
        }
    });

    socket.on('itemUpdated', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        const list = data.lists.find(l => l.id === payload.listId);
        if (list) {
            const itemIndex = list.items.findIndex(i => i.id === payload.itemId);
            if (itemIndex >= 0) {
                // Update item while preserving the name from server
                list.items[itemIndex] = {
                    ...payload.item,
                    name: payload.item.name // Use server-provided name
                };

                // Update UI if this list is currently being viewed
                if (editingItemListId === payload.listId) {
                    renderItems(list);
                }
                renderLists();
                renderSummary();

                showUpdateNotification(`Item "${payload.item.name}" updated in ${list.name}`, 'info');
            }
        }
    });

    socket.on('itemDeleted', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        const list = data.lists.find(l => l.id === payload.listId);
        if (list) {
            const itemName = payload.itemName || 'Item';

            // Remove item from list
            list.items = list.items.filter(i => i.id !== payload.itemId);

            // Update UI if this list is currently being viewed
            if (editingItemListId === payload.listId) {
                renderItems(list);
            }
            renderLists();
            renderSummary();

            showUpdateNotification(`Item "${itemName}" deleted from ${list.name}`, 'info');
        }
    });

    // List events
    socket.on('listAdded', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        data.lists.push(payload.list);
        renderLists();
        renderSummary();
        showUpdateNotification(`New list "${payload.list.name}" created`, 'info');
    });

    socket.on('listUpdated', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        const listIndex = data.lists.findIndex(l => l.id === payload.list.id);
        if (listIndex >= 0) {
            const oldName = data.lists[listIndex].name;
            data.lists[listIndex] = payload.list;

            // Update UI if this list is currently being viewed
            if (editingItemListId === payload.list.id) {
                const title = document.getElementById('list-details-title');
                if (title) title.textContent = payload.list.name;
            }

            renderLists();
            renderSummary();

            if (oldName !== payload.list.name) {
                showUpdateNotification(`List renamed from "${oldName}" to "${payload.list.name}"`, 'info');
            }
        }
    });

    socket.on('listDeleted', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        const list = data.lists.find(l => l.id === payload.listId);
        const listName = list ? list.name : 'List';

        data.lists = data.lists.filter(l => l.id !== payload.listId);

        // Close list details if this list is being viewed
        if (editingItemListId === payload.listId) {
            closeListDetails();
        }

        renderLists();
        renderSummary();
        showUpdateNotification(`List "${listName}" deleted`, 'info');
    });

    // Category events
    socket.on('categoryAdded', (payload) => {
        if (payload.clientId === window.DataService.clientId) return;

        data.categories.push(payload.category);
        renderCategories();
        updateCategoryDropdowns();

        const categoryName = payload.category.names?.[currentLanguage] || payload.category.id;
        showUpdateNotification(`New category "${categoryName}" added`, 'info');
    });
}

// Helper function to get item name with fallback
function getItemName(item) {
    if (item.name) return item.name;

    const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
    return globalItem ? globalItem.name : 'Unknown Item';
}

// Enhanced notification system
function showUpdateNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 9999;
        font-size: 0.9rem;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Enhanced socket connection and event handling
function setupEvents() {
    // Language selection
    document.getElementById('language-select').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('shopping-list-language', currentLanguage);
        applyLanguage();
    });

    // Load saved language preference
    const savedLang = localStorage.getItem('shopping-list-language');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
        document.getElementById('language-select').value = currentLanguage;
    }

    // Tab navigation
    document.getElementById('tab-lists').addEventListener('click', () => showPage('lists'));
    document.getElementById('tab-summary').addEventListener('click', () => showPage('summary'));
    document.getElementById('tab-items').addEventListener('click', () => showPage('items'));
    document.getElementById('tab-archive').addEventListener('click', () => showPage('archive'));
    document.getElementById('tab-settings').addEventListener('click', () => showPage('settings'));

    // List management
    document.getElementById('add-list-button').addEventListener('click', () => openListModal());
    document.getElementById('save-list').addEventListener('click', saveList);
    document.getElementById('cancel-modal').addEventListener('click', closeListModal);

    // Item management
    document.getElementById('add-item-button').addEventListener('click', () => {
        if (editingItemListId) {
            openItemModal(editingItemListId);
        }
    });
    document.getElementById('save-item').addEventListener('click', saveItem);
    document.getElementById('cancel-item-modal').addEventListener('click', closeItemModal);

    // List details management
    document.getElementById('close-list-details').addEventListener('click', closeListDetails);
    document.getElementById('complete-list-button').addEventListener('click', () => {
        if (editingItemListId) {
            completeList(editingItemListId);
        }
    });

    // Undo/Redo functionality
    document.getElementById('undo-button').addEventListener('click', undo);
    document.getElementById('redo-button').addEventListener('click', redo);

    // Fullscreen toggle
    document.getElementById('toggle-fullscreen').addEventListener('click', toggleListFullscreen);

    // Global item management
    document.getElementById('add-global-item-button').addEventListener('click', () => openGlobalItemModal());
    document.getElementById('save-global-item').addEventListener('click', saveGlobalItem);
    document.getElementById('cancel-global-item-modal').addEventListener('click', closeGlobalItemModal);

    // Settings and categories
    document.getElementById('add-category-button').addEventListener('click', addCategory);
    document.getElementById('new-category-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addCategory();
        }
    });

    // Import/Export functionality
    document.getElementById('import-button').addEventListener('click', importFromKeep);
    document.getElementById('export-csv-button').addEventListener('click', exportToCSV);

    // Clear data functionality
    document.getElementById('clear-data-button').addEventListener('click', clearAllData);

    // Item search functionality
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            itemSearchTerm = e.target.value;
            if (editingItemListId) {
                const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === editingItemListId);
                if (list) renderItems(list);
            }
        });
    }

    // Item name input with autocomplete
    const itemNameInput = document.getElementById('item-name-input');
    if (itemNameInput) {
        itemNameInput.addEventListener('input', handleItemNameInput);
        itemNameInput.addEventListener('focus', handleItemNameInput);
        itemNameInput.addEventListener('blur', () => {
            setTimeout(() => {
                const suggestions = document.getElementById('item-suggestions');
                if (suggestions) suggestions.classList.add('hidden');
            }, 200);
        });
    }

    // Receipt upload handling
    const receiptInput = document.getElementById('receipt-input');
    if (receiptInput) {
        receiptInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                data.receipts = data.receipts || [];
                data.receipts.push({ name: file.name, size: file.size, type: file.type });
            });
            saveData();
            displayReceipts();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    if (document.getElementById('page-lists').classList.contains('active')) {
                        openListModal();
                    } else if (document.getElementById('page-items').classList.contains('active')) {
                        openGlobalItemModal();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    if (!document.getElementById('list-details-overlay').classList.contains('hidden')) {
                        toggleListFullscreen();
                    }
                    break;
            }
        }

        // ESC key to close modals
        if (e.key === 'Escape') {
            if (!document.getElementById('modal-overlay').classList.contains('hidden')) {
                closeListModal();
            } else if (!document.getElementById('item-modal-overlay').classList.contains('hidden')) {
                closeItemModal();
            } else if (!document.getElementById('global-item-modal-overlay').classList.contains('hidden')) {
                closeGlobalItemModal();
            } else if (!document.getElementById('list-details-overlay').classList.contains('hidden')) {
                closeListDetails();
            }
        }
    });

    // Enhanced modal handling with enter key support
    document.getElementById('list-name-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveList();
        }
    });

    // Prevent form submission on enter in item modal inputs
    ['item-name-input', 'item-quantity-input', 'item-price-input', 'item-price-basis-input'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveItem();
                }
            });
        }
    });

    // Global item modal enter key support
    ['global-name-input', 'global-price-input'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveGlobalItem();
                }
            });
        }
    });

    // Enhanced presence tracking
    setupPresenceTracking();

    // Enhanced error handling for collaboration
    setupCollaborationErrorHandling();
}

function setupPresenceTracking() {
    // Track user activity for presence
    let activityTimer;

    const updateActivity = () => {
        if (window.DataService && window.DataService.isConnected) {
            window.DataService.updatePresence('active');
        }

        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
            if (window.DataService && window.DataService.isConnected) {
                window.DataService.updatePresence('idle');
            }
        }, 5 * 60 * 1000); // 5 minutes idle timeout
    };

    // Track various user activities
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, updateActivity, true);
    });

    // Initial activity
    updateActivity();
}

function setupCollaborationErrorHandling() {
    // Handle network errors gracefully
    window.addEventListener('online', () => {
        console.log('Connection restored');
        if (window.DataService && !window.DataService.isConnected) {
            window.DataService.scheduleReconnect();
        }
        showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
        console.log('Connection lost');
        showConnectionStatus('offline');
    });

    // Enhanced error recovery
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);

        // Handle specific collaboration errors
        if (event.reason && event.reason.message) {
            if (event.reason.message.includes('conflict') || event.reason.message.includes('revision')) {
                showConflictNotification('A conflict was detected and resolved automatically.');
            } else if (event.reason.message.includes('network') || event.reason.message.includes('fetch')) {
                showConnectionStatus('error');
            }
        }
    });
}

function showConnectionStatus(status) {
    // Remove existing status indicators
    const existing = document.querySelector('.connection-status');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'connection-status';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 0.9rem;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;

    switch (status) {
        case 'online':
            indicator.style.background = '#4caf50';
            indicator.style.color = 'white';
            indicator.innerHTML = '<i class="bi bi-wifi"></i>Connected';
            break;
        case 'offline':
            indicator.style.background = '#f44336';
            indicator.style.color = 'white';
            indicator.innerHTML = '<i class="bi bi-wifi-off"></i>Offline - Changes saved locally';
            break;
        case 'error':
            indicator.style.background = '#ff9800';
            indicator.style.color = 'white';
            indicator.innerHTML = '<i class="bi bi-exclamation-triangle"></i>Connection issues - Retrying...';
            break;
    }

    document.body.appendChild(indicator);

    // Auto-remove after delay
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, status === 'offline' ? 10000 : 5000);
}

function showConflictNotification(message) {
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
                <div style="font-weight: 600; margin-bottom: 4px;">Collaboration Update</div>
                <div style="font-size: 14px; opacity: 0.9; line-height: 1.4;">
                    ${message}
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
}

// Toggle fullscreen mode for list details
function toggleListFullscreen() {
    listFullscreen = !listFullscreen;
    localStorage.setItem('listFullscreen', listFullscreen.toString());
    applyFullscreenState();
    const t = translations[currentLanguage];
    const fsBtn = document.getElementById('toggle-fullscreen');
    if (fsBtn) {
        fsBtn.innerHTML = listFullscreen ? '<i class="bi bi-fullscreen-exit"></i>' : '<i class="bi bi-fullscreen"></i>';
        fsBtn.title = listFullscreen ? t.restore : t.maximize;
    }
}

// Apply fullscreen state to list details overlay
function applyFullscreenState() {
    const overlay = document.getElementById('list-details-overlay');
    const details = document.getElementById('list-details');
    if (overlay && details) {
        if (listFullscreen) {
            overlay.classList.add('fullscreen');
            details.classList.add('fullscreen');
        } else {
            overlay.classList.remove('fullscreen');
            details.classList.remove('fullscreen');
        }
    }
}

// Render items within a list (for list details view)
function renderItems(list) {
    const container = document.getElementById('items-container');
    const checkedContainer = document.getElementById('checked-items-container');
    const t = translations[currentLanguage];

    if (!container || !checkedContainer) return;

    container.innerHTML = '';
    checkedContainer.innerHTML = '';

    // Group items by category
    const itemsByCategory = {};
    const uncheckedItems = list.items.filter(item => !item.isChecked);
    const checkedItems = list.items.filter(item => item.isChecked);

    // Filter items by search term
    const filteredUnchecked = uncheckedItems.filter(item => {
        if (!itemSearchTerm) return true;
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const itemName = globalItem ? globalItem.name : '';
        return itemName.toLowerCase().includes(itemSearchTerm.toLowerCase());
    });

    const filteredChecked = checkedItems.filter(item => {
        if (!itemSearchTerm) return true;
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const itemName = globalItem ? globalItem.name : '';
        return itemName.toLowerCase().includes(itemSearchTerm.toLowerCase());
    });

    // Group unchecked items by category
    filteredUnchecked.forEach(item => {
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const categoryId = globalItem ? globalItem.categoryId : 'other';
        if (!itemsByCategory[categoryId]) {
            itemsByCategory[categoryId] = [];
        }
        itemsByCategory[categoryId].push(item);
    });

    // Render unchecked items by category
    Object.keys(itemsByCategory).sort().forEach(categoryId => {
        const category = data.categories.find(c => c.id === categoryId);
        const categoryName = category ?
            (category.names[currentLanguage] || category.names.en || category.names.he || categoryId) :
            categoryId;

        // Category heading
        const heading = document.createElement('div');
        heading.className = 'category-heading';
        heading.innerHTML = `
            <strong>${categoryName}</strong>
            <button class="btn btn-outline-secondary btn-sm" onclick="toggleCategoryCheck('${categoryId}', true)">
                ${t.check_all}
            </button>
        `;
        container.appendChild(heading);

        // Items in this category
        itemsByCategory[categoryId].forEach(item => {
            const li = createItemElement(item, list);
            container.appendChild(li);
        });
    });

    // Render checked items
    filteredChecked.forEach(item => {
        const li = createItemElement(item, list, true);
        checkedContainer.appendChild(li);
    });

    // Update undo/redo button states
    const undoBtn = document.getElementById('undo-button');
    const redoBtn = document.getElementById('redo-button');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// Create an item element for the list
function createItemElement(item, list, isChecked = false) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-start justify-content-between';
    li.setAttribute('data-item-id', item.id);

    const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
    const itemName = globalItem ? globalItem.name : 'Unknown Item';
    const t = translations[currentLanguage];

    // Main content
    const content = document.createElement('div');
    content.className = 'flex-grow-1';

    // Checkbox and name - Enhanced clickable area
    const checkboxContainer = document.createElement('div');
    checkboxContainer.style.display = 'flex';
    checkboxContainer.style.alignItems = 'center';
    checkboxContainer.style.gap = '0.5rem';
    checkboxContainer.style.cursor = 'pointer';
    checkboxContainer.style.padding = '0.25rem 0';
    checkboxContainer.style.minHeight = '44px'; // Increase touch target
    checkboxContainer.style.width = '100%';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.isChecked;
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.cursor = 'pointer';

    const toggleCheck = () => {
        // Preserve item name and other properties when toggling check state
        const previousState = item.isChecked;
        item.isChecked = !previousState;

        // Ensure the globalItemId is preserved
        if (!item.globalItemId && globalItem) {
            item.globalItemId = globalItem.id;
        }

        checkbox.checked = item.isChecked;
        saveData(true, 'update', `lists/${list.id}/items/${item.id}`, item);
        renderItems(list);
        renderLists();
        renderSummary();
    };

    checkbox.addEventListener('change', toggleCheck);
    checkboxContainer.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            toggleCheck();
        }
    });

    const nameSpan = document.createElement('span');
    nameSpan.textContent = itemName;
    nameSpan.className = 'item-text';
    nameSpan.style.cursor = 'pointer';
    nameSpan.style.userSelect = 'none';
    nameSpan.style.flex = '1';
    if (isChecked) {
        nameSpan.style.textDecoration = 'line-through';
        nameSpan.style.opacity = '0.6';
    }

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(nameSpan);
    content.appendChild(checkboxContainer);

    // Details
    const details = document.createElement('div');
    details.style.fontSize = '0.85rem';
    details.style.color = '#666';
    details.style.marginTop = '0.25rem';
    details.style.marginLeft = '1.5rem'; // Align with text

    let detailsText = `${item.quantity} ${item.quantityUnit || 'piece'}`;
    if (item.actualPrice != null) {
        const currency = document.getElementById('default-currency').value || '';
        detailsText += ` • ${currency}${item.actualPrice.toFixed(2)}`;
    }
    if (item.notes) {
        detailsText += ` • ${item.notes}`;
    }

    details.textContent = detailsText;
    content.appendChild(details);
    li.appendChild(content);

    // Action buttons - only show if not archived
    if (!editingArchive) {
        const btnGroup = document.createElement('div');
        btnGroup.className = 'btn-group btn-group-sm';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-outline-secondary';
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.title = t.edit_global_item;
        editBtn.style.minWidth = '44px'; // Larger touch target
        editBtn.style.minHeight = '44px';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openItemModal(list.id, item.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.title = t.delete_list;
        deleteBtn.style.minWidth = '44px'; // Larger touch target
        deleteBtn.style.minHeight = '44px';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete item?')) {
                const itemName = globalItem ? globalItem.name : 'Item';
                list.items = list.items.filter(i => i.id !== item.id);
                saveData(true, 'delete', `lists/${list.id}/items/${item.id}`, null);
                renderItems(list);
                renderLists();
                renderSummary();
                showUpdateNotification(`Item "${itemName}" deleted`, 'success');
            }
        });

        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);
        li.appendChild(btnGroup);
    }

    return li;
}

// Toggle check state for all items in a category
function toggleCategoryCheck(categoryId, shouldCheck) {
    if (!editingItemListId) return;

    const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === editingItemListId);
    if (!list) return;

    const itemsInCategory = list.items.filter(item => {
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        return globalItem && globalItem.categoryId === categoryId;
    });

    itemsInCategory.forEach(item => {
        item.isChecked = shouldCheck;
    });

    saveData(true, 'update', `lists/${list.id}`, list);
    renderItems(list);
    renderLists();
    renderSummary();
}

// Render archive page
function renderArchive() {
    const container = document.getElementById('archive-content');
    const t = translations[currentLanguage];

    if (!container) return;

    container.innerHTML = '';

    if (data.archivedLists.length === 0) {
        container.innerHTML = '<p>No completed lists in archive.</p>';
        return;
    }

    data.archivedLists.forEach(list => {
        const section = document.createElement('div');
        section.style.marginBottom = '1.5rem';
        section.style.padding = '1rem';
        section.style.backgroundColor = '#fff';
        section.style.borderRadius = '6px';
        section.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.5rem';

        const title = document.createElement('h4');
        title.textContent = list.name;
        title.style.margin = '0';

        const date = document.createElement('small');
        date.style.color = '#666';
        if (list.completedAt) {
            const completedDate = new Date(list.completedAt).toLocaleDateString();
            date.textContent = `Completed: ${completedDate}`;
        }

        header.appendChild(title);
        header.appendChild(date);
        section.appendChild(header);

        // Summary
        const summary = document.createElement('p');
        summary.style.margin = '0.5rem 0';
        summary.style.fontSize = '0.9rem';
        summary.textContent = `${list.items.length} items`;
        section.appendChild(summary);

        // Action buttons
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = '0.5rem';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-outline-primary btn-sm';
        viewBtn.textContent = t.archive_view;
        viewBtn.addEventListener('click', () => openListDetails(list.id, true));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger btn-sm';
        deleteBtn.textContent = t.delete_list;
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete archived list?')) {
                data.archivedLists = data.archivedLists.filter(l => l.id !== list.id);
                saveData();
                renderArchive();
            }
        });

        btnGroup.appendChild(viewBtn);
        btnGroup.appendChild(deleteBtn);
        section.appendChild(btnGroup);

        container.appendChild(section);
    });
}

// Render categories management
function renderCategories() {
    const container = document.getElementById('categories-container');
    const t = translations[currentLanguage];

    if (!container) return;

    container.innerHTML = '';

    data.categories.forEach(category => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '0.5rem';
        li.style.marginBottom = '0.5rem';
        li.style.backgroundColor = '#f5f5f5';
        li.style.borderRadius = '4px';

        const nameSpan = document.createElement('span');
        const categoryName = category.names ?
            (category.names[currentLanguage] || category.names.en || category.names.he) :
            category.id;
        nameSpan.textContent = categoryName;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger btn-sm';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete category? Items in this category will be moved to "Other".')) {
                // Move items to "other" category
                data.globalItems.forEach(item => {
                    if (item.categoryId === category.id) {
                        item.categoryId = 'other';
                    }
                });

                // Remove category
                data.categories = data.categories.filter(c => c.id !== category.id);
                saveData();
                renderCategories();
                renderGlobalItems();
            }
        });

        li.appendChild(nameSpan);
        li.appendChild(deleteBtn);
        container.appendChild(li);
    });
}

// Add new category
function addCategory() {
    const input = document.getElementById('new-category-input');
    const categoryName = input.value.trim();

    if (!categoryName) {
        showUpdateNotification('Category name is required', 'error');
        return;
    }

    // Check if category already exists (case-insensitive)
    const exists = data.categories.some(cat =>
        cat.names && (
            cat.names.en?.toLowerCase() === categoryName.toLowerCase() ||
            cat.names.he?.toLowerCase() === categoryName.toLowerCase() ||
            cat.id.toLowerCase() === categoryName.toLowerCase()
        )
    );

    if (exists) {
        showUpdateNotification('Category already exists', 'error');
        return;
    }

    const newCategory = {
        id: categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/gi, '') + '-' + Date.now(),
        names: {
            en: categoryName,
            he: categoryName
        }
    };

    data.categories.push(newCategory);
    saveData(true, 'create', 'categories', newCategory);
    renderCategories();
    updateCategoryDropdowns();
    input.value = '';

    showUpdateNotification(`Category "${categoryName}" created`, 'success');
}

// Display receipts
function displayReceipts() {
    const container = document.getElementById('receipt-list');

    if (!container) return;

    container.innerHTML = '';

    if (!data.receipts || data.receipts.length === 0) {
        return;
    }

    data.receipts.forEach((receipt, index) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '0.5rem';
        div.style.marginBottom = '0.5rem';
        div.style.backgroundColor = '#f5f5f5';
        div.style.borderRadius = '4px';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = receipt.name;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline-danger btn-sm';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.addEventListener('click', () => {
            data.receipts.splice(index, 1);
            saveData();
            displayReceipts();
        });

        div.appendChild(nameSpan);
        div.appendChild(deleteBtn);
        container.appendChild(div);
    });
}

// Main initialization function
async function initApp() {
    try {
        // Load data from storage
        await loadData();

        // Setup event listeners
        setupEvents();

        // Apply current language settings
        applyLanguage();

        // Show the default page (lists)
        showPage('lists');

        // Render all UI components
        renderLists();
        renderSummary();
        renderGlobalItems();
        renderArchive();
        renderCategories();
        updateGlobalItemSuggestions();

        // Display any receipts
        displayReceipts();

        // Handle URL parameters (for shared lists)
        const urlParams = new URLSearchParams(window.location.search);
        const listId = urlParams.get('list');
        if (listId) {
            const list = data.lists.find(l => l.id === listId);
            if (list) {
                openListDetails(listId);
            }
        }

        // Setup collaboration features if DataService is available
        if (window.DataService) {
            // Initialize presence tracking
            showPresenceIndicators();

            // Connect to collaboration server
            window.DataService.initSocket();
            window.DataService.updatePresence('connect');
        }

        console.log('Shopping List App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Error loading the application. Please refresh the page.');
    }
}

// Update category dropdowns dynamically when categories change
function updateCategoryDropdowns() {
    const selects = [
        document.getElementById('item-category-select'),
        document.getElementById('global-category-select')
    ];

    selects.forEach(select => {
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '';

            data.categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.names[currentLanguage] || cat.names.en || cat.names.he || cat.id;
                select.appendChild(option);
            });

            // Restore previous selection if still valid
            if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
                select.value = currentValue;
            }
        }
    });
}

// Enhanced share functionality with proper clipboard support and feedback
function shareList(listId) {
    const t = translations[currentLanguage];
    const url = new URL(window.location);
    url.searchParams.set('list', listId);

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url.toString()).then(() => {
            showUpdateNotification(`${t.share_link} - Link copied to clipboard!`, 'success');
        }).catch(() => {
            // Fallback for clipboard API failure
            showShareFallback(url.toString(), t);
        });
    } else {
        // Fallback for older browsers or insecure contexts
        showShareFallback(url.toString(), t);
    }
}

function showShareFallback(url, t) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    content.innerHTML = `
        <h3>Share List</h3>
        <p>Copy this link to share the list:</p>
        <div style="display: flex; gap: 0.5rem; margin: 1rem 0;">
            <input type="text" value="${url}" readonly style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            <button id="copy-url-btn" class="btn btn-primary">Copy</button>
        </div>
        <div style="text-align: right;">
            <button id="close-share-modal" class="btn btn-secondary">Close</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Copy button functionality
    content.querySelector('#copy-url-btn').addEventListener('click', () => {
        const input = content.querySelector('input');
        input.select();
        try {
            document.execCommand('copy');
            showUpdateNotification('Link copied to clipboard!', 'success');
            modal.remove();
        } catch (err) {
            showUpdateNotification('Failed to copy link', 'error');
        }
    });

    // Close button
    content.querySelector('#close-share-modal').addEventListener('click', () => {
        modal.remove();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Clear search field when closing modals or switching contexts
function clearSearchField() {
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.value = '';
        itemSearchTerm = '';

        // Show clear indicator if search was active
        if (itemSearchTerm) {
            showUpdateNotification('Search cleared', 'info');
        }
    }
}

// Enhanced currency symbol handling
function applyCurrencyChanges() {
    const currencyInput = document.getElementById('default-currency');
    if (currencyInput) {
        currencyInput.addEventListener('input', () => {
            // Save currency preference
            localStorage.setItem('shopping-list-currency', currencyInput.value);

            // Refresh displays that show currency
            renderSummary();
            renderGlobalItems();

            // Update any open item details
            if (editingItemListId) {
                const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === editingItemListId);
                if (list) renderItems(list);
            }

            showUpdateNotification('Currency symbol updated', 'success');
        });

        // Load saved currency preference
        const savedCurrency = localStorage.getItem('shopping-list-currency');
        if (savedCurrency) {
            currencyInput.value = savedCurrency;
        }
    }
}

// Refresh all UI components
function refreshUI() {
    renderLists();
    renderSummary();
    renderGlobalItems();
    renderArchive();
    renderCategories();
    updateGlobalItemSuggestions();
    const overlay = document.getElementById('list-details-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        const listArr = editingArchive ? data.archivedLists : data.lists;
        const current = listArr.find(l => l.id === editingItemListId);
        if (current) renderItems(current);
    }
}

// Enhanced undo/redo functionality
function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(clone(data));
    data = undoStack.pop();
    lastSavedData = clone(data);
    refreshUI();
    saveData(false);
    showUpdateNotification('Action undone', 'info');
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(clone(data));
    data = redoStack.pop();
    lastSavedData = clone(data);
    refreshUI();
    saveData(false);
    showUpdateNotification('Action redone', 'info');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();

        // Setup additional enhancements after init
        setTimeout(() => {
            applyCurrencyChanges();
            setupSocketEventHandlers();
        }, 100);
    });
} else {
    initApp();

    // Setup additional enhancements after init
    setTimeout(() => {
        applyCurrencyChanges();
        setupSocketEventHandlers();
    }, 100);
}
