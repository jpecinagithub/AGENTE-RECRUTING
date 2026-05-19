import { Messages } from '../db/models.js'
import { buildSystemPrompt } from '../agent/prompts.js'
import { loadUserContext } from './memory-manager.js'

export async function buildMessages(userId, conversationId, newUserMessage) {
  const { preferences, memory, recentJobs } = await loadUserContext(userId)

  const systemPrompt = buildSystemPrompt(memory, preferences, recentJobs)

  const history = await Messages.getByConversation(conversationId, 20)
  const historyMessages = history.map(m => ({
    role: m.role,
    content: m.content,
  }))

  return [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: newUserMessage },
  ]
}
