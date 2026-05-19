import React, { useEffect, useState } from 'react'
import { getReports, runDailyReport } from '../../api/api.js'
import ReactMarkdown from 'react-markdown'

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShortDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isToday(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default function ReportsPanel() {
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await getReports()
      setReports(res.data)
      if (res.data.length > 0) setSelected(res.data[0])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleRunNow = async () => {
    setRunning(true)
    try {
      await runDailyReport()
      await loadReports()
    } catch (err) {
      alert(err.response?.data?.error || 'Error generando el reporte')
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Cargando reportes...
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar list */}
      <div className="w-56 flex-shrink-0 border-r border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">Historial</span>
          <button
            onClick={handleRunNow}
            disabled={running}
            title="Generar reporte ahora"
            className="text-xs text-accent hover:text-white disabled:opacity-40 transition-colors"
          >
            {running ? '⏳' : '+ Nuevo'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reports.length === 0 ? (
            <div className="p-4 text-xs text-muted text-center">
              <p className="mb-2">Sin reportes todavía.</p>
              <p>El primero se generará automáticamente a las 9:00.</p>
            </div>
          ) : (
            reports.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-3 py-3 border-b border-border/50 transition-colors ${
                  selected?.id === r.id ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-white">
                    {isToday(r.created_at) ? 'Hoy' : formatShortDate(r.created_at)}
                  </span>
                  {r.total != null && (
                    <span className="text-[10px] bg-accent/20 text-accent rounded-full px-1.5 py-0.5 font-medium">
                      {r.total} ofertas
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted capitalize">
                  {new Date(r.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Report content */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="p-6 max-w-2xl">
            <div className="text-xs text-muted mb-4 capitalize">
              {formatDate(selected.created_at)}
            </div>
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-h2:text-base prose-h2:mt-0 prose-h2:mb-4
              prose-h3:text-sm prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-slate-300 prose-p:my-1.5
              prose-strong:text-white
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-hr:border-border prose-hr:my-4
              prose-em:text-muted prose-em:not-italic prose-em:text-xs">
              <ReactMarkdown>{selected.content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm">
            Selecciona un reporte para verlo
          </div>
        )}
      </div>
    </div>
  )
}
