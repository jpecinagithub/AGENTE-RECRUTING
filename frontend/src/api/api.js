import axios from 'axios'
import { useStore } from '../store/useStore.js'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = (email, password) => api.post('/auth/login', { email, password })
export const register = (email, password, name) => api.post('/auth/register', { email, password, name })

export const sendMessage = (message, conversation_id) => api.post('/chat/message', { message, conversation_id })
export const getConversations = () => api.get('/chat/conversations')
export const getMessages = (convId) => api.get(`/chat/conversations/${convId}/messages`)

export const getJobs = (savedOnly = false) => api.get(`/jobs${savedOnly ? '?saved=true' : ''}`)
export const saveJob = (id) => api.post(`/jobs/${id}/save`)
export const feedbackJob = (id, feedback) => api.post(`/jobs/${id}/feedback`, { feedback })

export const getPortals = () => api.get('/portals')
export const addPortal = (data) => api.post('/portals', data)
export const deletePortal = (id) => api.delete(`/portals/${id}`)

export const getPreferences = () => api.get('/preferences')
export const updatePreferences = (data) => api.post('/preferences', data)

export default api
