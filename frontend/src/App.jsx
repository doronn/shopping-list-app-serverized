import { useEffect, useState, useRef } from 'react'
import DataService from './dataService'
import './App.css'

const initialData = { lists: [], globalItems: [], categories: [], archivedLists: [], receipts: [] }

function ListsPage({ lists, onAdd, onOpen, onDelete, onArchive, onRename }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>Lists</h2>
      <ul className="simple-list">
        {lists.map(l => (
          <li key={l.id}>
            <button onClick={() => onOpen(l.id)}>{l.name}</button>
            <div className="actions">
              <button onClick={() => onArchive(l.id)}>Archive</button>
              <button onClick={() => {
                const newName = window.prompt('Rename list', l.name)
                if (newName) onRename(l.id, newName)
              }}>Rename</button>
              <button onClick={() => onDelete(l.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New list"
        />
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim())
              setName('')
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ListDetailsPage({ list, onBack, onAddItem, onToggleItem, onDeleteItem, onRenameItem }) {
  const [itemName, setItemName] = useState('')
  return (
    <div className="page">
      <h2>{list.name}</h2>
      <ul className="simple-list">
        {list.items.map(it => (
          <li key={it.id}>
            <label>
              <input
                type="checkbox"
                checked={it.purchased}
                onChange={() => onToggleItem(it.id)}
              />
              {it.name}
            </label>
            <div className="actions">
              <button onClick={() => {
                const newName = window.prompt('Rename item', it.name)
                if (newName) onRenameItem(it.id, newName)
              }}>Rename</button>
              <button onClick={() => onDeleteItem(it.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={itemName}
          onChange={e => setItemName(e.target.value)}
          placeholder="New item"
        />
        <button
          onClick={() => {
            if (itemName.trim()) {
              onAddItem(itemName.trim())
              setItemName('')
            }
          }}
        >
          Add
        </button>
      </div>
      <button onClick={onBack}>Back to Lists</button>
    </div>
  )
}

function ItemsPage({ items, onAdd, onRename, onDelete }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>Items</h2>
      <ul className="simple-list">
        {items.map(i => (
          <li key={i.id}>
            {i.name}
            <div className="actions">
              <button onClick={() => {
                const newName = window.prompt('Rename item', i.name)
                if (newName) onRename(i.id, newName)
              }}>Rename</button>
              <button onClick={() => onDelete(i.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New item"
        />
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim())
              setName('')
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function CategoriesPage({ categories, onAdd, onRename, onDelete }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>Categories</h2>
      <ul className="simple-list">
        {categories.map(c => (
          <li key={c.id}>
            {c.name}
            <div className="actions">
              <button onClick={() => {
                const newName = window.prompt('Rename category', c.name)
                if (newName) onRename(c.id, newName)
              }}>Rename</button>
              <button onClick={() => onDelete(c.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="add-form">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New category"
        />
        <button
          onClick={() => {
            if (name.trim()) {
              onAdd(name.trim())
              setName('')
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ArchivePage({ archived }) {
  return (
    <div className="page">
      <h2>Archive</h2>
      <ul className="simple-list">
        {archived.map(l => (
          <li key={l.id}>{l.name}</li>
        ))}
      </ul>
    </div>
  )
}

function SummaryPage({ lists }) {
  return (
    <div className="page">
      <h2>Summary</h2>
      <ul className="simple-list">
        {lists.map(l => {
          const purchased = l.items.filter(i => i.purchased).length
          return (
            <li key={l.id}>
              {l.name}: {purchased}/{l.items.length} purchased
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SettingsPage({ onImport, exportData, onClear }) {
  const [text, setText] = useState('')
  return (
    <div className="page">
      <h2>Settings</h2>
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

  const addGlobalItem = name => {
    setData(d => ({ ...d, globalItems: [...d.globalItems, { id: 'global-' + Date.now(), name }] }))
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

  const addItemToList = name => {
    setData(d => ({
      ...d,
      lists: d.lists.map(l =>
        l.id === activeListId
          ? { ...l, items: [...l.items, { id: 'item-' + Date.now(), name, purchased: false }] }
          : l
      )
    }))
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
        <button onClick={() => setTab('lists')}>Lists</button>
        <button onClick={() => setTab('items')}>Items</button>
        <button onClick={() => setTab('categories')}>Categories</button>
        <button onClick={() => setTab('archive')}>Archive</button>
        <button onClick={() => setTab('summary')}>Summary</button>
        <button onClick={() => setTab('settings')}>Settings</button>
      </nav>
      {tab === 'lists' && (
        <ListsPage
          lists={data.lists}
          onAdd={addList}
          onOpen={openList}
          onDelete={deleteList}
          onArchive={archiveList}
          onRename={renameList}
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
        />
      )}
      {tab === 'items' && (
        <ItemsPage
          items={data.globalItems}
          onAdd={addGlobalItem}
          onRename={renameGlobalItem}
          onDelete={deleteGlobalItem}
        />
      )}
      {tab === 'categories' && (
        <CategoriesPage
          categories={data.categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
        />
      )}
      {tab === 'archive' && <ArchivePage archived={data.archivedLists} />}
      {tab === 'summary' && <SummaryPage lists={data.lists} />}
      {tab === 'settings' && (
        <SettingsPage onImport={importData} exportData={exportData} onClear={clearAll} />
      )}
    </div>
  )
}

export default App
