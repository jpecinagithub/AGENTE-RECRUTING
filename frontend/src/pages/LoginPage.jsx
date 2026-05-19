import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/api.js'
import { useStore } from '../store/useStore.js'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { setAuth, setConversationId } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.email, form.password, form.name)

      setAuth(res.data.token, res.data.user)

      // Load first conversation
      const { getConversations } = await import('../api/api.js')
      const convRes = await getConversations()
      if (convRes.data?.[0]) setConversationId(convRes.data[0].id)

      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤖</div>
          <h1 className="text-2xl font-bold text-white">Recruiting Agent</h1>
          <p className="text-muted text-sm mt-1">Your AI-powered job search assistant</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex rounded-lg bg-surface p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${mode === m ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted outline-none focus:border-accent transition-colors"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted outline-none focus:border-accent transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-muted outline-none focus:border-accent transition-colors"
            />

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
