import { JobSources } from '../../db/models.js'

export async function addJobPortal({ name, url, type = 'scraper', selectors }, userId) {
  const config = type === 'scraper' ? { selectors: selectors || {} } : {}
  const id = await JobSources.create(userId, name, url, type, config)

  return {
    success: true,
    message: `Portal "${name}" added successfully.`,
    portal: { id, name, url, type },
  }
}
