import React, { useEffect, useState } from 'react'
import { getPortals, addPortal, deletePortal } from '../../api/api.js'

export default function PortalsPanel() {
  const [portals, setPortals] = useState([])
  const [form, setForm] = useState({ name: '', url: '', type: 'scraper' })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPortals().then(res => setPortals(res.data)).catch(() => {})
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    setError(null)
    try {
      const res = await addPortal(form)
      if (res.data.success) {
        setPortals(prev => [...prev, res.data.portal])
        setForm({ name: '', url: '', type: 'scraper' })
      } else {
        setError(res.data.message)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding portal')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id) => {
    await deletePortal(id)
    setPortals(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Job Portals</h2>

      {portals.length > 0 && (
        <div className="space-y-2 mb-6">
          {portals.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium text-white">{p.name}</p>
                <p className="text-xs text-muted truncate max-w-[200px]">{p.url}</p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <p className="text-xs text-muted uppercase tracking-wide">Add Portal</p>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Portal name (e.g. LinkedIn)"
          required
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-accent"
        />
        <input
          value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })}
          placeholder="https://www.example.com/jobs"
          required
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-accent"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={adding}
          className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {adding ? 'Checking URL...' : '+ Add Portal'}
        </button>
      </form>
    </div>
  )
}
