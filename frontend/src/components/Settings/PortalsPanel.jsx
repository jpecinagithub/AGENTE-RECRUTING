import React, { useEffect, useState } from 'react'
import { getPortals, addPortal, deletePortal, seedPortals } from '../../api/api.js'

export default function PortalsPanel() {
  const [portals, setPortals] = useState([])
  const [form, setForm] = useState({ name: '', url: '', type: 'scraper' })
  const [adding, setAdding] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState(null)
  const [seedMsg, setSeedMsg] = useState(null)

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
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al añadir portal')
    } finally {
      setAdding(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setSeedMsg(null)
    setError(null)
    try {
      const res = await seedPortals()
      const { added, skipped, portals: updated } = res.data
      setPortals(updated)
      if (added.length) {
        setSeedMsg(`Añadidos: ${added.join(', ')}`)
      } else {
        setSeedMsg('Ya tienes todos los portales sugeridos.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al añadir portales sugeridos')
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id) => {
    await deletePortal(id)
    setPortals(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Portales configurados</h2>

        {portals.length === 0 ? (
          <p className="text-xs text-muted">Sin portales todavía. Añade los sugeridos o configura uno manualmente.</p>
        ) : (
          <div className="space-y-2">
            {portals.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-muted truncate max-w-[210px]">{p.url}</p>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 ml-2"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portales sugeridos */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Portales sugeridos</h2>
        <p className="text-xs text-muted mb-3">
          Añade Tecnoempleo, Computrabajo e InfoJobs con un clic — ya vienen configurados con los selectores correctos.
        </p>
        {seedMsg && <p className="text-xs text-green-400 mb-2">{seedMsg}</p>}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full border border-accent/40 text-accent hover:bg-accent/10 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-40"
        >
          {seeding ? 'Añadiendo...' : '✦ Añadir portales sugeridos'}
        </button>
      </div>

      {/* Añadir manual */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Añadir portal manual</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre (ej. LinkedIn)"
            required
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-accent"
          />
          <input
            value={form.url}
            onChange={e => setForm({ ...form, url: e.target.value })}
            placeholder="https://www.ejemplo.com/empleos"
            required
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted outline-none focus:border-accent"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={adding}
            className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {adding ? 'Guardando...' : '+ Añadir portal'}
          </button>
        </form>
      </div>
    </div>
  )
}
