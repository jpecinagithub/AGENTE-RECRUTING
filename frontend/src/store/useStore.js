import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      conversationId: null,
      messages: [],
      jobs: [],
      activePanel: 'chat',

      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null, messages: [], jobs: [], conversationId: null }),

      setConversationId: (id) => set({ conversationId: id }),

      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      setMessages: (messages) => set({ messages }),

      addJobs: (newJobs) => set((s) => ({
        jobs: [...newJobs, ...s.jobs.filter(j => !newJobs.find(nj => nj.id === j.id))],
      })),
      setJobs: (jobs) => set({ jobs }),
      updateJob: (id, patch) => set((s) => ({
        jobs: s.jobs.map(j => j.id === id ? { ...j, ...patch } : j),
      })),

      setActivePanel: (panel) => set({ activePanel: panel }),
    }),
    { name: 'recruiting-agent', partialize: (s) => ({ token: s.token, user: s.user, conversationId: s.conversationId }) }
  )
)
