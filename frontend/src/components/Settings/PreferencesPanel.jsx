import React, { useEffect, useState } from 'react'
import { getPreferences, updatePreferences } from '../../api/api.js'

function TagInput({ label, value = [], onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setInput('')
  }

  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-wide">{label}</label>
      <div className="flex flex-wrap gap-1 mt-1 mb-1">
        {value.map(tag => (
          <span key={tag} className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
            {tag}
            <button onClick={() => onChange(value.filter(t => t !== tag))} className="hover:text-white">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-muted outline-none focus:border-accent text-xs"
        />
        <button onClick={add} className="text-xs bg-card border border-border rounded-lg px-2 hover:border-accent transition-colors">+</button>
      </div>
    </div>
  )
}

export default function PreferencesPanel() {
  const [prefs, setPrefs] = useState({ roles: [], keywords: [], locations: [], excluded_companies: [], excluded_keywords: [], remote_only: false, salary_min: '', salary_max: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getPreferences().then(res => {
      if (res.data && Object.keys(res.data).length) setPrefs({ ...prefs, ...res.data })
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await updatePreferences(prefs)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Job Preferences</h2>

      <div className="space-y-4">
        <TagInput label="Target Roles" value={prefs.roles} onChange={v => setPrefs({ ...prefs, roles: v })} />
        <TagInput label="Keywords" value={prefs.keywords} onChange={v => setPrefs({ ...prefs, keywords: v })} />
        <TagInput label="Locations" value={prefs.locations} onChange={v => setPrefs({ ...prefs, locations: v })} />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted uppercase tracking-wide">Min Salary (€)</label>
            <input
              type="number"
              value={prefs.salary_min || ''}
              onChange={e => setPrefs({ ...prefs, salary_min: e.target.value })}
              className="mt-1 w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted uppercase tracking-wide">Max Salary (€)</label>
            <input
              type="number"
              value={prefs.salary_max || ''}
              onChange={e => setPrefs({ ...prefs, salary_max: e.target.value })}
              className="mt-1 w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-accent"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!prefs.remote_only} onChange={e => setPrefs({ ...prefs, remote_only: e.target.checked })} className="accent-indigo-500" />
          <span className="text-sm text-slate-300">Remote only</span>
        </label>

        <TagInput label="Excluded Companies" value={prefs.excluded_companies || []} onChange={v => setPrefs({ ...prefs, excluded_companies: v })} />
        <TagInput label="Excluded Keywords" value={prefs.excluded_keywords || []} onChange={v => setPrefs({ ...prefs, excluded_keywords: v })} />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
