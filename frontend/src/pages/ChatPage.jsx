import React from 'react'
import { useStore } from '../store/useStore.js'
import ChatWindow from '../components/Chat/ChatWindow.jsx'
import JobFeedPanel from '../components/JobFeed/JobFeedPanel.jsx'
import PreferencesPanel from '../components/Settings/PreferencesPanel.jsx'
import PortalsPanel from '../components/Settings/PortalsPanel.jsx'

const PANELS = [
  { id: 'chat', label: '💬', title: 'Chat' },
  { id: 'jobs', label: '📋', title: 'Jobs' },
  { id: 'prefs', label: '⚙️', title: 'Preferences' },
  { id: 'portals', label: '🌐', title: 'Portals' },
]

export default function ChatPage() {
  const { activePanel, setActivePanel, user, logout, jobs } = useStore()

  return (
    <div className="flex h-screen bg-surface">
      {/* Sidebar */}
      <div className="w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-2">
        <div className="text-xl mb-4">🤖</div>

        {PANELS.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            title={p.title}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${activePanel === p.id ? 'bg-accent/20 text-accent' : 'hover:bg-slate-700 text-muted'}`}
          >
            {p.label}
            {p.id === 'jobs' && jobs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {jobs.length > 9 ? '9+' : jobs.length}
              </span>
            )}
          </button>
        ))}

        <div className="mt-auto">
          <button
            onClick={logout}
            title="Sign out"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-900/20 transition-colors text-sm"
          >
            ↩
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat (always mounted, shown/hidden) */}
        <div className={`flex-1 flex flex-col ${activePanel !== 'chat' ? 'hidden' : ''}`}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h1 className="font-semibold text-white text-sm">Recruiting Agent</h1>
            <span className="text-xs text-muted">{user?.name || user?.email}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </div>

        {/* Side panels */}
        {activePanel !== 'chat' && (
          <div className="flex-1 overflow-hidden border-l border-border">
            {activePanel === 'jobs' && <JobFeedPanel />}
            {activePanel === 'prefs' && <PreferencesPanel />}
            {activePanel === 'portals' && <PortalsPanel />}
          </div>
        )}
      </div>
    </div>
  )
}
