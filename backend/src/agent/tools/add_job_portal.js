import axios from 'axios'
import { JobSources } from '../../db/models.js'

export async function addJobPortal({ name, url, type = 'scraper', selectors }, userId) {
  try {
    await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } })
  } catch {
    return { success: false, message: `Cannot reach ${url}. Check the URL and try again.` }
  }

  const config = type === 'scraper' ? { selectors: selectors || {} } : {}
  const id = await JobSources.create(userId, name, url, type, config)

  return {
    success: true,
    message: `Portal "${name}" added successfully.`,
    portal: { id, name, url, type },
  }
}
