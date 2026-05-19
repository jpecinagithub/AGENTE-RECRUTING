import { AgentMemory, Preferences, JobListings } from '../db/models.js'

export async function loadUserContext(userId) {
  const [preferences, memory, recentJobs] = await Promise.all([
    Preferences.getByUser(userId),
    AgentMemory.getByUser(userId),
    JobListings.getToday(userId),
  ])

  if (preferences) {
    for (const field of ['roles', 'locations', 'keywords', 'excluded_companies', 'excluded_keywords']) {
      if (typeof preferences[field] === 'string') {
        try { preferences[field] = JSON.parse(preferences[field]) } catch { preferences[field] = [] }
      }
    }
  }

  return { preferences, memory, recentJobs }
}

export async function saveMemory(userId, type, keyName, value) {
  await AgentMemory.upsert(userId, type, keyName, typeof value === 'object' ? JSON.stringify(value) : String(value))
}

export async function extractAndSaveInferences(userId, userMessage, agentResponse) {
  const lowerMsg = userMessage.toLowerCase()

  if (lowerMsg.includes('dislike') || lowerMsg.includes('not interested') || lowerMsg.includes('hate')) {
    await saveMemory(userId, 'feedback', `dislike_${Date.now()}`, userMessage)
  }

  if (lowerMsg.includes('prefer') || lowerMsg.includes('looking for') || lowerMsg.includes('want')) {
    await saveMemory(userId, 'inferred', `preference_${Date.now()}`, userMessage)
  }
}
