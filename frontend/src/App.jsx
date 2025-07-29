import { useEffect, useState } from 'react'
import DataService from './dataService'
import './App.css'

const initialData = { lists: [], globalItems: [], categories: [], archivedLists: [], receipts: [] }

function ListsPage({ lists, onAdd }) {
  const [name, setName] = useState('')
  return (
    <div>
      <h2>Lists</h2>
      <ul>
        {lists.map(l => <li key={l.id}>{l.name}</li>)}
      </ul>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="New list" />
      <button onClick={() => { if(name.trim()) { onAdd(name.trim()); setName(''); } }}>Add</button>
    </div>
  )
}

function ItemsPage({ items }) {
  return (
    <div>
      <h2>Items</h2>
      <ul>
        {items.map(i => <li key={i.id}>{i.name}</li>)}
      </ul>
    </div>
  )
}

function CategoriesPage({ categories, onAdd }) {
  const [name, setName] = useState('')
  return (
    <div>
      <h2>Categories</h2>
      <ul>
        {categories.map(c => <li key={c.id}>{c.name}</li>)}
      </ul>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="New category" />
      <button onClick={() => { if(name.trim()) { onAdd(name.trim()); setName(''); } }}>Add</button>
    </div>
  )
}

function ArchivePage({ archived }) {
  return (
    <div>
      <h2>Archive</h2>
      <ul>
        {archived.map(l => <li key={l.id}>{l.name}</li>)}
      </ul>
    </div>
  )
}

function App() {
  const [data, setData] = useState(initialData)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState('lists')

  useEffect(() => {
    DataService.loadData().then(d => { if(d) setData(d); setLoaded(true) })
    DataService.initSocket(remote => setData(remote))
  }, [])

  useEffect(() => {
    if (loaded) DataService.saveData(data)
  }, [data, loaded])

  const addList = name => {
    setData(d => ({ ...d, lists: [...d.lists, { id: 'list-' + Date.now(), name, items: [] }] }))
  }

  const addCategory = name => {
    setData(d => ({ ...d, categories: [...d.categories, { id: 'cat-' + Date.now(), name }] }))
  }

  return (
    <div className="App">
      <nav>
        <button onClick={() => setTab('lists')}>Lists</button>
        <button onClick={() => setTab('items')}>Items</button>
        <button onClick={() => setTab('categories')}>Categories</button>
        <button onClick={() => setTab('archive')}>Archive</button>
      </nav>
      {tab === 'lists' && <ListsPage lists={data.lists} onAdd={addList} />}
      {tab === 'items' && <ItemsPage items={data.globalItems} />}
      {tab === 'categories' && <CategoriesPage categories={data.categories} onAdd={addCategory} />}
      {tab === 'archive' && <ArchivePage archived={data.archivedLists} />}
    </div>
  )
}

export default App
