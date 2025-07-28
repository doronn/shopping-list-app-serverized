// Simple Shopping List App in vanilla JS
// Data is stored in localStorage under the key "shoppingListData".

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
        confirm_clear: "Are you sure you want to clear all data? This cannot be undone."
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
        confirm_clear: "האם אתה בטוח שברצונך לנקות את כל הנתונים? פעולה זו לא ניתנת לביטול."
    }
};


// Main data structure: lists, globalItems, categories, archivedLists, receipts
let data = {
    lists: [],
    globalItems: [],
    categories: [],
    archivedLists: [],
    receipts: []
};
let currentLanguage = 'en';
let editingListId = null;
let editingItemListId = null;
let editingItemId = null;
let itemSearchTerm = '';
let editingGlobalItemId = null;
let editingArchive = false;

// Update datalist options for global item suggestions
function updateGlobalItemSuggestions() {
    const datalist = document.getElementById('global-item-suggestions');
    if (!datalist) return;
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
}

// Handle input for item name to auto-fill category and unit when matching a global item
function handleItemNameInput() {
    const input = document.getElementById('item-name-input');
    if (!input) return;
    const val = input.value.trim();
    const globalItem = data.globalItems.find(g => g.name.toLowerCase() === val.toLowerCase());
    if (globalItem) {
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
    }
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
}

async function saveData() {
    await window.DataService.saveData(data);
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
    document.getElementById('add-list-button').innerText = t.add_list;
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
        document.getElementById('add-global-item-button').innerText = t.add_global_item;
    }
    // Categories section
    const categoriesTitleEl = document.getElementById('categories-title');
    if (categoriesTitleEl) categoriesTitleEl.innerText = t.categories_title;
    const addCategoryBtn = document.getElementById('add-category-button');
    if (addCategoryBtn) addCategoryBtn.innerText = t.add_category;
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
    document.getElementById('add-item-button').innerText = t.add_item;
    const completeBtn = document.getElementById('complete-list-button');
    if (completeBtn) completeBtn.innerText = t.complete_list;
    document.getElementById('close-list-details').innerText = t.close;
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

// Render the list of shopping lists
function renderLists() {
    const container = document.getElementById('list-container');
    container.innerHTML = '';
    data.lists.forEach(list => {
        const li = document.createElement('li');
        const t = translations[currentLanguage];
        // List name and stats
        const info = document.createElement('div');
        info.style.flex = '1';
        const nameSpan = document.createElement('strong');
        nameSpan.textContent = list.name;
        info.appendChild(nameSpan);
        // Stats: purchased/total
        const total = list.items.length;
        const purchased = list.items.filter(i => i.isChecked).length;
        const stats = document.createElement('div');
        stats.style.fontSize = '0.8rem';
        stats.style.marginTop = '0.25rem';
        stats.textContent = `${t.purchased}: ${purchased}/${total}`;
        info.appendChild(stats);
        li.appendChild(info);
        // Manage Items button
        const manageBtn = document.createElement('button');
        manageBtn.textContent = t.manage_items;
        manageBtn.addEventListener('click', () => openListDetails(list.id));
        li.appendChild(manageBtn);
        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.textContent = t.rename_list;
        renameBtn.addEventListener('click', () => openListModal(list.id));
        li.appendChild(renameBtn);
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = t.delete_list;
        deleteBtn.addEventListener('click', () => {
            if (confirm('Delete list?')) {
                data.lists = data.lists.filter(l => l.id !== list.id);
                saveData();
                renderLists();
                renderSummary();
            }
        });
        li.appendChild(deleteBtn);
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
            createBtn.textContent = t.create_from_missing;
            createBtn.addEventListener('click', () => {
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
        const name = document.createElement('strong');
        name.textContent = item.name;
        info.appendChild(name);
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
        editBtn.textContent = t.rename_list;
        editBtn.addEventListener('click', () => openGlobalItemModal(item.id));
        li.appendChild(editBtn);
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = t.delete_list;
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
    const name = document.getElementById('global-name-input').value.trim();
    const categoryId = document.getElementById('global-category-select').value;
    const price = parseFloat(document.getElementById('global-price-input').value) || 0;
    const unit = document.getElementById('global-unit-select').value;
    if (!name) return;
    if (editingGlobalItemId) {
        const item = data.globalItems.find(g => g.id === editingGlobalItemId);
        if (item) {
            item.name = name;
            item.categoryId = categoryId;
            item.estimatedPrice = price;
            item.priceUnit = unit;
        }
    } else {
        const newItem = {
            id: 'global-' + Date.now(),
            name,
            categoryId,
            estimatedPrice: price,
            priceUnit: unit,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.globalItems.push(newItem);
    }
    saveData();
    renderGlobalItems();
    updateGlobalItemSuggestions();
    closeGlobalItemModal();
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
    const name = document.getElementById('list-name-input').value.trim();
    if (!name) return;
    if (editingListId) {
        // Edit existing
        const list = data.lists.find(l => l.id === editingListId);
        if (list) list.name = name;
    } else {
        // Create new
        data.lists.push({ id: 'list-' + Date.now(), name: name, items: [] });
    }
    saveData();
    renderLists();
    closeListModal();
    renderSummary();
}

// Open list details overlay to manage items
function openListDetails(listId, isArchive = false) {
    editingArchive = isArchive;
    editingItemListId = listId;
    editingItemId = null;
    const overlay = document.getElementById('list-details-overlay');
    const title = document.getElementById('list-details-title');
    // Determine which array to search based on archive flag
    const list = (isArchive ? data.archivedLists : data.lists).find(l => l.id === listId);
    const t = translations[currentLanguage];
    if (list) {
        title.textContent = list.name;
        renderItems(list);
    }
    overlay.classList.remove('hidden');
}

function closeListDetails() {
    document.getElementById('list-details-overlay').classList.add('hidden');
}

// Render items of current list
function renderItems(list) {
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    const t = translations[currentLanguage];
    // Filter items by search term (case-insensitive)
    const term = itemSearchTerm.toLowerCase();
    // Group items by their global item's category ID
    const groups = {};
    list.items.filter(item => {
        // Filter by global item name instead of local name
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const itemName = globalItem ? globalItem.name : item.name;
        return !term || (itemName && itemName.toLowerCase().includes(term));
    }).forEach(item => {
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        const cid = globalItem ? globalItem.categoryId : (item.categoryId || 'other');
        if (!groups[cid]) groups[cid] = [];
        groups[cid].push(item);
    });
    // Sort categories by name for display
    const sortedCatIds = Object.keys(groups).sort((a, b) => {
        const catA = data.categories.find(c => c.id === a);
        const catB = data.categories.find(c => c.id === b);
        const nameA = catA ? (catA.names[currentLanguage] || catA.names.en || catA.names.he || catA.id) : a;
        const nameB = catB ? (catB.names[currentLanguage] || catB.names.en || catB.names.he || catB.id) : b;
        return nameA.localeCompare(nameB);
    });
    sortedCatIds.forEach(catId => {
        const cat = data.categories.find(c => c.id === catId);
        const catName = cat ? (cat.names[currentLanguage] || cat.names.en || cat.names.he || cat.id) : catId;
        // Category heading
        const heading = document.createElement('div');
        heading.className = 'category-heading';
        heading.textContent = catName;
        container.appendChild(heading);
        // Items under this category
        groups[catId].forEach(item => {
            const li = document.createElement('li');
            // Checkbox for purchased
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.isChecked;
            checkbox.addEventListener('change', () => {
                item.isChecked = checkbox.checked;
                saveData();
                renderItems(list);
                renderLists();
                renderSummary();
            });
            li.appendChild(checkbox);
            // Item info
            const info = document.createElement('span');
            info.style.flex = '1';
            info.style.marginLeft = '0.5rem';
            info.style.textDecoration = item.isChecked ? 'line-through' : 'none';
            const currency = document.getElementById('default-currency').value || '';
            // Find global item for display
            const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
            const itemName = globalItem ? globalItem.name : item.name;
            const unit = item.quantityUnit || '';
            // Pricing and total calculation with basis quantity and units
            const priceVal = item.actualPrice != null ? item.actualPrice : (globalItem ? globalItem.estimatedPrice : 0);
            const basis = item.priceBasisQuantity || 1;
            const priceUnit = item.actualPrice != null ? item.quantityUnit : (globalItem ? globalItem.priceUnit : item.quantityUnit);
            // Compute total cost only when unit matches for estimated price or always for actual price
            let totalCost = null;
            if (item.actualPrice != null) {
                totalCost = priceVal * (item.quantity / basis);
            } else if (globalItem && globalItem.priceUnit === item.quantityUnit) {
                totalCost = priceVal * (item.quantity / basis);
            }
            const quantityDisplay = `${item.quantity}${unit ? ' ' + unit : ''}`;
            let priceDisplay = `${currency}${priceVal.toFixed(2)}`;
            if (basis !== 1) priceDisplay += ` / ${basis}`;
            if (priceUnit) priceDisplay += ` ${priceUnit}`;
            let text = `${itemName} (${quantityDisplay})`;
            text += `, ${priceDisplay}`;
            if (totalCost != null) {
                text += ` × ${item.quantity} = ${currency}${totalCost.toFixed(2)}`;
            }
            info.textContent = text;
            li.appendChild(info);
            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = t.rename_list;
            editBtn.addEventListener('click', () => openItemModal(list.id, item.id));
            li.appendChild(editBtn);
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = t.delete_list;
            deleteBtn.addEventListener('click', () => {
                const index = list.items.findIndex(i => i.id === item.id);
                if (index >= 0) {
                    list.items.splice(index, 1);
                    saveData();
                    renderItems(list);
                    renderLists();
                    renderSummary();
                }
            });
            li.appendChild(deleteBtn);
            container.appendChild(li);
        });
    });
}

// Open modal to create or edit an item
function openItemModal(listId, itemId = null) {
    editingItemListId = listId;
    editingItemId = itemId;
    const overlay = document.getElementById('item-modal-overlay');
    const t = translations[currentLanguage];
    const title = document.getElementById('item-modal-title');
    if (itemId) {
        title.textContent = t.item_modal_edit;
        const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === listId);
        const item = list.items.find(i => i.id === itemId);
        // Derive global item
        const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
        document.getElementById('item-name-input').value = globalItem ? globalItem.name : '';
        // Category comes from global item
        document.getElementById('item-category-select').value = globalItem ? globalItem.categoryId : data.categories[0].id;
        // Quantity and unit
        document.getElementById('item-quantity-input').value = item.quantity;
        document.getElementById('item-unit-select').value = item.quantityUnit || (globalItem ? globalItem.priceUnit : 'piece');
        // Price (actual price)
        document.getElementById('item-price-input').value = item.actualPrice != null ? item.actualPrice : '';
        document.getElementById('item-price-basis-input').value = item.priceBasisQuantity || 1;
        document.getElementById('item-notes-input').value = item.notes || '';
    } else {
        title.textContent = t.item_modal_new;
        document.getElementById('item-name-input').value = '';
        // Default values
        document.getElementById('item-category-select').value = data.categories[0].id;
        document.getElementById('item-quantity-input').value = 1;
        document.getElementById('item-unit-select').value = 'piece';
        document.getElementById('item-price-input').value = 0;
        document.getElementById('item-price-basis-input').value = 1;
        document.getElementById('item-notes-input').value = '';
    }
    overlay.classList.remove('hidden');
}

function closeItemModal() {
    document.getElementById('item-modal-overlay').classList.add('hidden');
}

// Save item (new or edited)
function saveItem() {
    const list = (editingArchive ? data.archivedLists : data.lists).find(l => l.id === editingItemListId);
    if (!list) return;
    const name = document.getElementById('item-name-input').value.trim();
    const categoryId = document.getElementById('item-category-select').value;
    const quantity = parseFloat(document.getElementById('item-quantity-input').value) || 1;
    const quantityUnit = document.getElementById('item-unit-select').value || 'piece';
    // Parse actual price; if input is empty or whitespace treat as null so that estimated price is used
    const priceStr = document.getElementById('item-price-input').value.trim();
    const price = priceStr ? parseFloat(priceStr) : null;
    const priceBasisQuantity = parseFloat(document.getElementById('item-price-basis-input').value) || 1;
    const notes = document.getElementById('item-notes-input').value.trim();
    if (!name) return;
    // Determine global item reference
    // Find existing global item by name and category
    let globalItem = data.globalItems.find(g => g.name.toLowerCase() === name.toLowerCase() && g.categoryId === categoryId);
    if (!globalItem) {
        // Create new global item; use estimated price from actual price input if provided, otherwise 0
        const estimated = price != null ? price : 0;
        globalItem = {
            id: 'global-' + Date.now() + Math.random(),
            name,
            categoryId,
            estimatedPrice: estimated,
            priceUnit: quantityUnit,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.globalItems.push(globalItem);
    }
    if (editingItemId) {
        // Edit existing list item
        const item = list.items.find(i => i.id === editingItemId);
        if (item) {
            // If the global item reference has changed and another item with the same global item exists,
            // merge them instead of creating duplicates
            const oldGlobalId = item.globalItemId;
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
            } else {
                // No duplicate, just update the item values normally
                item.quantity = quantity;
                item.quantityUnit = quantityUnit;
                item.actualPrice = price;
                item.priceBasisQuantity = priceBasisQuantity;
                item.notes = notes;
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
        } else {
            // Create new list item with wrapper referencing global item
            list.items.push({
                id: 'item-' + Date.now() + Math.random(),
                globalItemId: globalItem.id,
                quantity,
                quantityUnit,
                actualPrice: price,
                priceBasisQuantity,
                notes,
                isChecked: false
            });
        }
    }
    saveData();
    renderItems(list);
    renderLists();
    renderSummary();
    renderGlobalItems();
    updateGlobalItemSuggestions();
    // If editing an archived list, re-render archive to reflect changes
    if (editingArchive) {
        renderArchive();
    }
    closeItemModal();
}

// Setup event listeners
function setupEvents() {
    document.getElementById('add-list-button').addEventListener('click', () => openListModal());
    document.getElementById('save-list').addEventListener('click', saveList);
    document.getElementById('cancel-modal').addEventListener('click', closeListModal);
    document.getElementById('add-item-button').addEventListener('click', () => openItemModal(editingItemListId));
    document.getElementById('close-list-details').addEventListener('click', closeListDetails);
    const completeBtn = document.getElementById('complete-list-button');
    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            completeList(editingItemListId);
        });
    }
    document.getElementById('save-item').addEventListener('click', saveItem);
    document.getElementById('cancel-item-modal').addEventListener('click', closeItemModal);
    // Tab navigation
    document.getElementById('tab-lists').addEventListener('click', () => showPage('lists'));
    document.getElementById('tab-summary').addEventListener('click', () => showPage('summary'));
    document.getElementById('tab-items').addEventListener('click', () => showPage('items'));
    document.getElementById('tab-archive').addEventListener('click', () => showPage('archive'));
    document.getElementById('tab-settings').addEventListener('click', () => showPage('settings'));
    // Language select
    document.getElementById('language-select').addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        localStorage.setItem('shoppingListLanguage', currentLanguage);
        applyLanguage();
    });
    // Currency input to re-render summary on change
    document.getElementById('default-currency').addEventListener('input', renderSummary);
    // Receipt upload handler (displays file names only)
    const receiptInput = document.getElementById('receipt-input');
    if (receiptInput) {
        receiptInput.addEventListener('change', async () => {
            const listDiv = document.getElementById('receipt-list');
            listDiv.innerHTML = '';
            const files = Array.from(receiptInput.files);
            for (const file of files) {
                const reader = new FileReader();
                // Wrap in promise to wait for load event
                const dataUrl = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                // Store receipt in data
                data.receipts.push({ name: file.name, data: dataUrl });
                // Display file name
                const p = document.createElement('p');
                p.textContent = file.name;
                listDiv.appendChild(p);
            }
            saveData();
            // Refresh displayed receipts
            displayReceipts();
        });
    }

    // Global items events
    const addGlobalBtn = document.getElementById('add-global-item-button');
    if (addGlobalBtn) {
        addGlobalBtn.addEventListener('click', () => openGlobalItemModal());
    }
    const saveGlobalBtn = document.getElementById('save-global-item');
    if (saveGlobalBtn) {
        saveGlobalBtn.addEventListener('click', saveGlobalItem);
    }
    const cancelGlobalBtn = document.getElementById('cancel-global-item-modal');
    if (cancelGlobalBtn) {
        cancelGlobalBtn.addEventListener('click', closeGlobalItemModal);
    }

    // Import from Google Keep
    const importBtn = document.getElementById('import-button');
    if (importBtn) {
        importBtn.addEventListener('click', importFromKeep);
    }
    // Export to CSV
    const exportBtn = document.getElementById('export-csv-button');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    // Clear all data for debugging
    const clearDataBtn = document.getElementById('clear-data-button');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }

    // Add category button
    const addCategoryBtn = document.getElementById('add-category-button');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addCategory);
    }

    // Search input for filtering items in list details
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            itemSearchTerm = searchInput.value;
            const list = data.lists.find(l => l.id === editingItemListId);
            if (list) renderItems(list);
        });
    }

    // Auto-fill item info when selecting a global item name
    const itemNameInput = document.getElementById('item-name-input');
    if (itemNameInput) {
        itemNameInput.addEventListener('input', handleItemNameInput);
    }
}

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    document.getElementById(`tab-${page}`).classList.add('active');
    if (page === 'summary') renderSummary();
    if (page === 'items') renderGlobalItems();
    if (page === 'archive') renderArchive();
}

// Initialization
async function init() {
    await loadData();
    // Load language from storage
    const storedLang = localStorage.getItem('shoppingListLanguage');
    if (storedLang && translations[storedLang]) {
        currentLanguage = storedLang;
        document.getElementById('language-select').value = currentLanguage;
    }
    setupEvents();
    applyLanguage();
    renderLists();
    renderSummary();
    // Display existing receipts names if any
    displayReceipts();
    // Render global items and archive
    renderGlobalItems();
    renderCategories();

    // If using a remote server for data persistence, connect to its
    // WebSocket endpoint so that updates from other clients are pushed
    // into this instance.  The DataService will set up a socket.io
    // connection and call onRemoteDataUpdated() whenever data is updated.
    if (window.DataService && window.DataService.useServer) {
        window.DataService.initSocket();
    }
}

// Display list of uploaded receipts (names only) in summary page
function displayReceipts() {
    const listDiv = document.getElementById('receipt-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    (data.receipts || []).forEach(rec => {
        const p = document.createElement('p');
        p.textContent = rec.name;
        listDiv.appendChild(p);
    });
}

// Render archived purchases
function renderArchive() {
    const container = document.getElementById('archive-content');
    if (!container) return;
    container.innerHTML = '';
    const t = translations[currentLanguage];
    if (!data.archivedLists || data.archivedLists.length === 0) {
        const p = document.createElement('p');
        p.textContent = t.missing || 'No archives yet';
        container.appendChild(p);
        return;
    }
    const currency = document.getElementById('default-currency').value || '';
    data.archivedLists.forEach(list => {
        const section = document.createElement('div');
        section.style.marginBottom = '1rem';
        const heading = document.createElement('h3');
        heading.textContent = list.name;
        section.appendChild(heading);
        // completion date
        if (list.completedAt) {
            const dateP = document.createElement('p');
            dateP.textContent = new Date(list.completedAt).toLocaleDateString();
            section.appendChild(dateP);
        }
        // totals: compute cost using actual or estimated price with basis
        let totalActual = 0;
        let totalEst = 0;
        list.items.forEach(item => {
            const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
            const basis = item.priceBasisQuantity || 1;
            let actualCost = 0;
            if (item.actualPrice != null) {
                actualCost = item.actualPrice * (item.quantity / basis);
            } else if (globalItem && globalItem.priceUnit === item.quantityUnit) {
                actualCost = (globalItem.estimatedPrice || 0) * (item.quantity / basis);
            }
            totalActual += actualCost;
            let estCost = 0;
            if (globalItem && globalItem.priceUnit === item.quantityUnit) {
                estCost = (globalItem.estimatedPrice || 0) * (item.quantity / basis);
            }
            totalEst += estCost;
        });
        const pTotal = document.createElement('p');
        pTotal.textContent = `${t.total_cost}: ${currency}${totalActual.toFixed(2)}`;
        section.appendChild(pTotal);
        if (totalEst > 0) {
            const diff = totalActual - totalEst;
            const diffP = document.createElement('p');
            diffP.style.fontSize = '0.8rem';
            diffP.style.color = diff >= 0 ? 'red' : 'green';
            const sign = diff >= 0 ? '+' : '-';
            diffP.textContent = `Difference: ${sign}${currency}${Math.abs(diff).toFixed(2)}`;
            section.appendChild(diffP);
        }
        // receipts (names)
        if (list.receiptImages && list.receiptImages.length > 0) {
            const receiptsDiv = document.createElement('div');
            const recHeading = document.createElement('p');
            recHeading.textContent = t.receipt_label;
            receiptsDiv.appendChild(recHeading);
            list.receiptImages.forEach(r => {
                const pName = document.createElement('p');
                pName.textContent = r.name || r;
                receiptsDiv.appendChild(pName);
            });
            section.appendChild(receiptsDiv);
        }
        // View button to open archived list details for editing
        const viewBtn = document.createElement('button');
        viewBtn.textContent = t.archive_view;
        viewBtn.addEventListener('click', () => {
            openListDetails(list.id, true);
        });
        section.appendChild(viewBtn);
        container.appendChild(section);
    });
}

// Render categories in settings page
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '';
    data.categories.forEach(cat => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '0.3rem 0';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = cat.names[currentLanguage] || cat.names.en || cat.names.he || cat.id;
        li.appendChild(nameSpan);
        // Edit button for categories (rename names)
        const renameBtn = document.createElement('button');
        renameBtn.textContent = translations[currentLanguage].rename_list;
        renameBtn.addEventListener('click', () => {
            // Prompt for new names in both languages
            const newNameEn = prompt('New category name (English)', cat.names.en || '');
            if (newNameEn == null) return;
            const newNameHe = prompt('New category name (Hebrew)', cat.names.he || newNameEn);
            if (newNameHe == null) return;
            cat.names.en = newNameEn.trim() || cat.names.en;
            cat.names.he = newNameHe.trim() || cat.names.he;
            saveData();
            renderCategories();
            applyLanguage();
        });
        li.appendChild(renameBtn);
        // Delete button for custom categories (not default ones)
        if (!cat.id.startsWith('produce') && !cat.id.startsWith('dairy') && !cat.id.startsWith('meat') && !cat.id.startsWith('bakery') && !cat.id.startsWith('beverages') && cat.id !== 'other') {
            const delBtn = document.createElement('button');
            delBtn.textContent = translations[currentLanguage].delete_list;
            delBtn.addEventListener('click', () => {
                if (confirm('Delete category?')) {
                    // Remove category from data.categories
                    data.categories = data.categories.filter(c => c.id !== cat.id);
                    // Determine fallback category id (use 'other')
                    const fallbackId = 'other';
                    // Reassign items and global items using this category to fallback
                    // Update all global items using this category to fallback
                    data.globalItems.forEach(item => {
                        if (item.categoryId === cat.id) item.categoryId = fallbackId;
                    });
                    // For backwards compatibility, update old list item categoryId fields
                    data.lists.forEach(list => {
                        list.items.forEach(item => {
                            if (item.categoryId === cat.id) item.categoryId = fallbackId;
                        });
                    });
                    data.archivedLists.forEach(list => {
                        list.items.forEach(item => {
                            if (item.categoryId === cat.id) item.categoryId = fallbackId;
                        });
                    });
                    saveData();
                    renderCategories();
                    applyLanguage();
                }
            });
            li.appendChild(delBtn);
        }
        container.appendChild(li);
    });
}

function addCategory() {
    const input = document.getElementById('new-category-input');
    const name = input.value.trim();
    if (!name) return;
    // Create slug id
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') + '-' + Date.now();
    const names = { en: name, he: name };
    data.categories.push({ id, names });
    input.value = '';
    saveData();
    renderCategories();
    applyLanguage();
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
        const match = trimmed.match(/^\[( |X|x)\]\s*(.*)$/);
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
        let namePart = content;
        let notes = '';
        // Extract note after '-' character
        const dashIndex = namePart.indexOf('-');
        if (dashIndex >= 0) {
            notes = namePart.slice(dashIndex + 1).trim();
            namePart = namePart.slice(0, dashIndex).trim();
        }
        // Extract quantity and unit from patterns like "Bananas*4", "Bananas*4 kg" or "Bananas x4"
        let quantity = 1;
        let quantityUnit = 'piece';
        const qtyMatch = namePart.match(/^(.*?)(?:[\*×x]\s*(\d+(?:\.\d+)?)(?:\s*(kg|liter|package|piece))?)$/i);
        if (qtyMatch) {
            namePart = qtyMatch[1].trim();
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
        const globalName = namePart.trim();
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
    const rows = [];
    // Header
    rows.push(['List Name', 'Item Name', 'Quantity', 'Unit', 'Price', 'Basis Quantity', 'Category', 'Actual Price', 'Date Completed']);
    const allLists = [...data.lists, ...data.archivedLists];
    allLists.forEach(list => {
        list.items.forEach(item => {
            const globalItem = data.globalItems.find(g => g.id === item.globalItemId);
            // Determine item name and category from global item if available
            const itemName = globalItem ? globalItem.name : (item.name || '');
            const categoryId = globalItem ? globalItem.categoryId : item.categoryId;
            const category = data.categories.find(c => c.id === categoryId);
            const categoryName = category ? (category.names.en || category.id) : '';
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
        // Escape double quotes by doubling
        return '"' + s.replace(/"/g, '""') + '"';
    }).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shopping-data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Clear all data from localStorage and reset app
function clearAllData() {
    const t = translations[currentLanguage];
    if (!confirm(t.confirm_clear)) return;
    // Use DataService to clear persisted data
    window.DataService.clearData();
    // Reset in-memory data to defaults
    data = {
        lists: [],
        globalItems: [],
        categories: [],
        archivedLists: [],
        receipts: []
    };
    // Reload default categories and save to storage
    loadData();
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

// Run init on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Callback for remote data updates via WebSocket
// When the DataService receives a `dataUpdated` event from the server,
// it will call this function (if defined).  We merge the remote data
// into the local state and then re-render the UI to reflect the change.
window.onRemoteDataUpdated = function(remoteData) {
    if (!remoteData || typeof remoteData !== 'object') return;
    data = remoteData;
    data.lists = data.lists || [];
    data.globalItems = data.globalItems || [];
    data.categories = data.categories || [];
    data.archivedLists = data.archivedLists || [];
    data.receipts = data.receipts || [];
    // Save the remote data to local persistence as well
    window.DataService.saveData(data);
    // Update UI
    renderLists();
    renderSummary();
    renderGlobalItems();
    renderArchive();
    renderCategories();
    updateGlobalItemSuggestions();
};