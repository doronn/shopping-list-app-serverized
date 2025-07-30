import { useEffect, useState, useRef } from 'react'
import DataService from './dataService'
import { translations } from './i18n'
import './App.css'

function useTranslation() {
  const [lang, setLang] = useState(() =>
    window.localStorage.getItem('lang') || 'en'
  )
  useEffect(() => {
    window.localStorage.setItem('lang', lang)
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
  }, [lang])
  const t = key => translations[lang][key] || key
  return { t, lang, setLang }
}

// Provide a basic initial state so the app has one category to choose from
const initialData = {
  lists: [],
  globalItems: [],
  categories: [{ id: 'cat-1', name: 'General' }],
  archivedLists: [],
  receipts: []
}

function ListsPage({ lists, onAdd, onOpen, onDelete, onArchive, onRename, t }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>{t('lists')}</h2>
      <ul className="simple-list">
        {lists.map(l => (
          <li key={l.id}>
            <button onClick={() => onOpen(l.id)}>{l.name}</button>
            <div className="actions">
              <button onClick={() => onArchive(l.id)}>{t('archive')}</button>
              <button onClick={() => {
                const newName = window.prompt(t('rename'), l.name)
                if (newName) onRename(l.id, newName)
              }}>{t('rename')}</button>
              <button onClick={() => onDelete(l.id)}>{t('delete')}</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('new_list')}
        />
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim())
              setName('')
            }
          }}
        >{t('add')}</button>
      </div>
    </div>
  )
}

function ListDetailsPage({ list, onBack, onAddItem, onToggleItem, onDeleteItem, onRenameItem, globalItems, t }) {
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('piece')
  const [filter, setFilter] = useState('')
  const filtered = list.items.filter(it => it.name.toLowerCase().includes(filter.toLowerCase()))
  const suggestions = globalItems.filter(g => g.name.toLowerCase().includes(itemName.toLowerCase())).slice(0,5)
  return (
    <div className="page">
      <h2>{list.name}</h2>
      <input
        placeholder="Search"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />
      <ul className="simple-list">
        {filtered.map(it => (
          <li key={it.id}>
            <label>
              <input
                type="checkbox"
                checked={it.purchased}
                onChange={() => onToggleItem(it.id)}
              />
              {it.name} ({it.quantity} {it.unit})
            </label>
            <div className="actions">
              <button onClick={() => {
                const newName = window.prompt(t('rename'), it.name)
                if (newName) onRenameItem(it.id, newName)
              }}>{t('rename')}</button>
              <button onClick={() => onDeleteItem(it.id)}>{t('delete')}</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          placeholder={t('new_item')}
          list="suggestions"
        />
        <datalist id="suggestions">
          {suggestions.map(s => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
        <input
          type="number"
          style={{ width: '4rem' }}
          min="1"
          value={quantity}
          onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
        />
        <select value={unit} onChange={e => setUnit(e.target.value)}>
          <option value="piece">piece</option>
          <option value="kg">kg</option>
          <option value="liter">liter</option>
          <option value="package">package</option>
        </select>
        <button
          onClick={() => {
            if (itemName.trim()) {
              onAddItem({ name: itemName.trim(), quantity, unit })
              setItemName('')
              setQuantity(1)
            }
          }}
        >{t('add')}</button>
      </div>
      <button onClick={onBack}>{t('back')}</button>
    </div>
  )
}

function ItemsPage({ items, categories, onAdd, onRename, onDelete, t }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [price, setPrice] = useState(0)
  const [unit, setUnit] = useState('piece')
  return (
    <div className="page">
      <h2>{t('items')}</h2>
      <ul className="simple-list">
        {items.map(i => (
          <li key={i.id}>
            {i.name} – {i.estimatedPrice.toFixed(2)} {i.priceUnit}
            <div className="actions">
              <button onClick={() => {
                const newName = window.prompt(t('rename'), i.name)
                if (newName) onRename(i.id, newName)
              }}>{t('rename')}</button>
              <button onClick={() => onDelete(i.id)}>{t('delete')}</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('new_item')}
        />
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          style={{ width: '5rem' }}
          min="0"
          step="0.01"
          value={price}
          onChange={e => setPrice(parseFloat(e.target.value) || 0)}
        />
        <select value={unit} onChange={e => setUnit(e.target.value)}>
          <option value="piece">piece</option>
          <option value="kg">kg</option>
          <option value="liter">liter</option>
          <option value="package">package</option>
        </select>
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd({ name: name.trim(), categoryId, estimatedPrice: price, priceUnit: unit })
              setName('')
              setPrice(0)
            }
          }}
        >{t('add')}</button>
      </div>
    </div>
  )
}

function CategoriesPage({ categories, onAdd, onRename, onDelete, t }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>{t('categories')}</h2>
      <ul className="simple-list">
        {categories.map(c => (
          <li key={c.id}>
            {c.name}
            <div className="actions">
              <button onClick={() => {
                const newName = window.prompt(t('rename'), c.name)
                if (newName) onRename(c.id, newName)
              }}>{t('rename')}</button>
              <button onClick={() => onDelete(c.id)}>{t('delete')}</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('new_category')}
        />
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim())
              setName('')
            }
          }}
        >{t('add')}</button>
      </div>
    </div>
  )
}

function ArchivePage({ archived, t }) {
  return (
    <div className="page">
      <h2>{t('archive')}</h2>
      <ul className="simple-list">
        {archived.map(l => (
          <li key={l.id}>{l.name}</li>
        ))}
      </ul>
    </div>
  )
}

function SummaryPage({ lists, t }) {
  let grand = 0
  return (
    <div className="page">
      <h2>{t('summary')}</h2>
      <ul className="simple-list">
        {lists.map(l => {
          const purchased = l.items.filter(i => i.purchased).length
          const total = l.items.reduce((sum, it) => sum + it.quantity * it.price, 0)
          grand += total
          return (
            <li key={l.id}>
              {l.name}: {purchased}/{l.items.length} – {total.toFixed(2)}
            </li>
          )
        })}
      </ul>
      <p>{t('total_cost') || 'Total'}: {grand.toFixed(2)}</p>
    </div>
  )
}

function SettingsPage({ onImport, exportData, onClear, lang, setLang, t }) {
  const [text, setText] = useState('')
  return (
    <div className="page">
      <h2>{t('settings')}</h2>
      <div style={{ marginBottom: '0.5rem' }}>
        <label>{t('language')}</label>
        <select value={lang} onChange={e => setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="he">עברית</option>
        </select>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        style={{ width: '100%' }}
        placeholder="Paste JSON here"
      />
      <div className="add-form" style={{ marginTop: '0.5rem' }}>
        <button onClick={() => onImport(text)}>Import</button>
        <button onClick={() => setText(exportData())}>Export</button>
        <button onClick={onClear}>Clear Data</button>
      </div>
    </div>
  )
}

function App() {
  const [data, setData] = useState(initialData)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('lists')
  const [activeListId, setActiveListId] = useState(null)
  const ignoreSaveRef = useRef(false)
  const { t, lang, setLang } = useTranslation()

  useEffect(() => {
    DataService.loadData().then(d => {
      if (d) setData(d)
      setLoaded(true)
    })
    DataService.initSocket(remote => {
      ignoreSaveRef.current = true
      setData(remote)
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (ignoreSaveRef.current) {
      ignoreSaveRef.current = false
      return
    }
    DataService.saveData(data)
  }, [data, loaded])

  const addList = name => {
    setData(d => ({ ...d, lists: [...d.lists, { id: 'list-' + Date.now(), name, items: [] }] }))
  }

  const renameList = (id, name) => {
    setData(d => ({
      ...d,
      lists: d.lists.map(l => (l.id === id ? { ...l, name } : l))
    }))
  }

  const deleteList = id => {
    setData(d => ({ ...d, lists: d.lists.filter(l => l.id !== id) }))
  }

  const archiveList = id => {
    setData(d => {
      const list = d.lists.find(l => l.id === id)
      if (!list) return d
      return {
        ...d,
        lists: d.lists.filter(l => l.id !== id),
        archivedLists: [...d.archivedLists, list]
      }
    })
  }

  const addCategory = name => {
    setData(d => ({ ...d, categories: [...d.categories, { id: 'cat-' + Date.now(), name }] }))
  }

  const renameCategory = (id, name) => {
    setData(d => ({
      ...d,
      categories: d.categories.map(c => (c.id === id ? { ...c, name } : c))
    }))
  }

  const deleteCategory = id => {
    setData(d => ({ ...d, categories: d.categories.filter(c => c.id !== id) }))
  }

  const addGlobalItem = ({ name, categoryId, estimatedPrice, priceUnit }) => {
    setData(d => ({
      ...d,
      globalItems: [
        ...d.globalItems,
        {
          id: 'global-' + Date.now(),
          name,
          categoryId,
          estimatedPrice,
          priceUnit
        }
      ]
    }))
  }

  const renameGlobalItem = (id, name) => {
    setData(d => ({
      ...d,
      globalItems: d.globalItems.map(i => (i.id === id ? { ...i, name } : i))
    }))
  }

  const deleteGlobalItem = id => {
    setData(d => ({ ...d, globalItems: d.globalItems.filter(i => i.id !== id) }))
  }

  const openList = id => {
    setActiveListId(id)
    setTab('listDetails')
  }

  const closeList = () => {
    setActiveListId(null)
    setTab('lists')
  }

  const addItemToList = ({ name, quantity, unit }) => {
    setData(d => {
      const global = d.globalItems.find(g => g.name.toLowerCase() === name.toLowerCase())
      const item = {
        id: 'item-' + Date.now(),
        name,
        quantity,
        unit,
        purchased: false,
        categoryId: global ? global.categoryId : d.categories[0]?.id,
        price: global ? global.estimatedPrice : 0
      }
      return {
        ...d,
        lists: d.lists.map(l =>
          l.id === activeListId ? { ...l, items: [...l.items, item] } : l
        )
      }
    })
  }

  const renameItem = (itemId, name) => {
    setData(d => ({
      ...d,
      lists: d.lists.map(l =>
        l.id === activeListId
          ? {
              ...l,
              items: l.items.map(it => (it.id === itemId ? { ...it, name } : it))
            }
          : l
      )
    }))
  }

  const toggleItem = itemId => {
    setData(d => ({
      ...d,
      lists: d.lists.map(l =>
        l.id === activeListId
          ? {
              ...l,
              items: l.items.map(it =>
                it.id === itemId ? { ...it, purchased: !it.purchased } : it
              )
            }
          : l
      )
    }))
  }

  const deleteItem = itemId => {
    setData(d => ({
      ...d,
      lists: d.lists.map(l =>
        l.id === activeListId ? { ...l, items: l.items.filter(it => it.id !== itemId) } : l
      )
    }))
  }

  const importData = jsonStr => {
    try {
      const obj = JSON.parse(jsonStr)
      setData(obj)
    } catch {
      window.alert('Invalid JSON')
    }
  }

  const exportData = () => JSON.stringify(data, null, 2)

  const clearAll = () => {
    if (window.confirm('Clear all data?')) {
      setData(initialData)
    }
  }

  return (
    <div className="App">
      <nav className="main-nav">
        <button onClick={() => setTab('lists')}>{t('lists')}</button>
        <button onClick={() => setTab('items')}>{t('items')}</button>
        <button onClick={() => setTab('categories')}>{t('categories')}</button>
        <button onClick={() => setTab('archive')}>{t('archive')}</button>
        <button onClick={() => setTab('summary')}>{t('summary')}</button>
        <button onClick={() => setTab('settings')}>{t('settings')}</button>
      </nav>
      {tab === 'lists' && (
        <ListsPage
          lists={data.lists}
          onAdd={addList}
          onOpen={openList}
          onDelete={deleteList}
          onArchive={archiveList}
          onRename={renameList}
          t={t}
        />
      )}
      {tab === 'listDetails' && activeListId && (
        <ListDetailsPage
          list={data.lists.find(l => l.id === activeListId) || { id: '', name: '', items: [] }}
          onBack={closeList}
          onAddItem={addItemToList}
          onToggleItem={toggleItem}
          onDeleteItem={deleteItem}
          onRenameItem={renameItem}
          globalItems={data.globalItems}
          t={t}
        />
      )}
      {tab === 'items' && (
        <ItemsPage
          items={data.globalItems}
          categories={data.categories}
          onAdd={addGlobalItem}
          onRename={renameGlobalItem}
          onDelete={deleteGlobalItem}
          t={t}
        />
      )}
      {tab === 'categories' && (
        <CategoriesPage
          categories={data.categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
          t={t}
        />
      )}
      {tab === 'archive' && <ArchivePage archived={data.archivedLists} t={t} />}
      {tab === 'summary' && <SummaryPage lists={data.lists} t={t} />}
      {tab === 'settings' && (
        <SettingsPage onImport={importData} exportData={exportData} onClear={clearAll} lang={lang} setLang={setLang} t={t} />
      )}
    </div>
  )
}

export default App
