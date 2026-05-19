import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore.js'
import { sendMessage } from '../../api/api.js'
import MessageBubble from './MessageBubble.jsx'

export default function ChatWindow() {
  const { messages, addMessage, conversationId, token } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const text = input.trim()
    setInput('')
    addMessage({ role: 'user', content: text, id: Date.now() })
    setLoading(true)

    try {
      const res = await sendMessage(text, conversationId)
      addMessage({
        role: 'assistant',
        content: res.data.content,
        tools_executed: res.data.tools_executed,
        job_results: res.data.job_results,
        id: Date.now() + 1,
      })
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unknown error'
      addMessage({ role: 'assistant', content: `❌ Error: ${msg}`, id: Date.now() + 1 })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend(e)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 text-muted">
            <div className="text-5xl">🤖</div>
            <div>
              <p className="text-white font-semibold text-lg">Hi, I'm your Recruiting Agent</p>
              <p className="text-sm mt-1">Tell me what kind of job you're looking for and I'll find the best matches.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 max-w-sm w-full">
              {[
                "I'm looking for a React developer job in Madrid",
                "Find remote Python backend roles, €60k+",
                "Search for UX Designer positions in Barcelona",
                "Show me today's job report",
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="text-left text-xs bg-card border border-border rounded-lg px-3 py-2 hover:border-accent/50 transition-colors text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id || i}
            message={msg}
            isLast={i === messages.length - 1}
            isLoading={loading && i === messages.length - 1}
          />
        ))}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <MessageBubble
            message={{ role: 'assistant', content: '' }}
            isLast
            isLoading
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what kind of job you're looking for..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted resize-none outline-none focus:border-accent transition-colors min-h-[48px] max-h-32"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors h-12 flex-shrink-0"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
