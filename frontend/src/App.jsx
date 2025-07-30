import { useEffect, useState, useRef } from 'react'
import DataService from './dataService'
import './App.css'

const initialData = { lists: [], globalItems: [], categories: [], archivedLists: [], receipts: [] }

function ListsPage({ lists, onAdd, onOpen, onDelete, onArchive }) {
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

function ListDetailsPage({ list, onBack, onAddItem, onToggleItem, onDeleteItem }) {
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
            <button onClick={() => onDeleteItem(it.id)}>Delete</button>
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

function ItemsPage({ items, onAdd }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>Items</h2>
      <ul className="simple-list">
        {items.map(i => <li key={i.id}>{i.name}</li>)}
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

function CategoriesPage({ categories, onAdd }) {
  const [name, setName] = useState('')
  return (
    <div className="page">
      <h2>Categories</h2>
      <ul className="simple-list">
        {categories.map(c => <li key={c.id}>{c.name}</li>)}
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

  const addGlobalItem = name => {
    setData(d => ({ ...d, globalItems: [...d.globalItems, { id: 'global-' + Date.now(), name }] }))
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

  return (
    <div className="App">
      <nav className="main-nav">
        <button onClick={() => setTab('lists')}>Lists</button>
        <button onClick={() => setTab('items')}>Items</button>
        <button onClick={() => setTab('categories')}>Categories</button>
        <button onClick={() => setTab('archive')}>Archive</button>
      </nav>
      {tab === 'lists' && (
        <ListsPage
          lists={data.lists}
          onAdd={addList}
          onOpen={openList}
          onDelete={deleteList}
          onArchive={archiveList}
        />
      )}
      {tab === 'listDetails' && activeListId && (
        <ListDetailsPage
          list={data.lists.find(l => l.id === activeListId) || { id: '', name: '', items: [] }}
          onBack={closeList}
          onAddItem={addItemToList}
          onToggleItem={toggleItem}
          onDeleteItem={deleteItem}
        />
      )}
      {tab === 'items' && <ItemsPage items={data.globalItems} onAdd={addGlobalItem} />}
      {tab === 'categories' && <CategoriesPage categories={data.categories} onAdd={addCategory} />}
      {tab === 'archive' && <ArchivePage archived={data.archivedLists} />}
    </div>
  )
}

export default App
