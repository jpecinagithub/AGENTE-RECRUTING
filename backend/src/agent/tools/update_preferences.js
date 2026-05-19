import { Preferences } from '../../db/models.js'
import { saveMemory } from '../../mcp/memory-manager.js'

export async function updatePreferences(args, userId) {
  const updated = await Preferences.upsert(userId, args)

  if (args.raw_preferences) {
    await saveMemory(userId, 'preference', 'raw_summary', args.raw_preferences)
  }

  return {
    success: true,
    message: 'Preferences updated successfully.',
    preferences: updated,
  }
}
