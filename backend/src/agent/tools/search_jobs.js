import { JobSources, JobListings, Preferences } from '../../db/models.js'
import { scrapePortal } from '../../scrapers/engine.js'
import { chat } from '../../llm/client.js'

export async function searchJobs(args, userId) {
  const prefs = await Preferences.getByUser(userId)
  const sources = await JobSources.getByUser(userId)

  const searchParams = {
    roles: args.roles || (prefs?.roles ? JSON.parse(prefs.roles) : []),
    keywords: args.keywords || (prefs?.keywords ? JSON.parse(prefs.keywords) : []),
    locations: args.locations || (prefs?.locations ? JSON.parse(prefs.locations) : []),
    remote: args.remote ?? prefs?.remote_only ?? false,
  }

  if (!sources.length) {
    return { success: false, message: 'No job portals configured. Add a portal first.' }
  }

  const allJobs = []
  for (const source of sources) {
    try {
      const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config
      const jobs = await scrapePortal(source.url, config, searchParams)
      for (const job of jobs) {
        const id = await JobListings.create(userId, source.id, { ...job, relevance_score: 0 })
        allJobs.push({ id, ...job, source_name: source.name })
      }
    } catch (err) {
      console.error(`[search_jobs] Error scraping ${source.name}:`, err.message)
    }
  }

  if (!allJobs.length) {
    return { success: true, jobs: [], message: 'No jobs found. Try broadening your search criteria.' }
  }

  const rankedJobs = await rankJobsByRelevance(allJobs, searchParams)
  return { success: true, jobs: rankedJobs, total: rankedJobs.length }
}

async function rankJobsByRelevance(jobs, preferences) {
  if (jobs.length <= 3) return jobs.map(j => ({ ...j, relevance_score: 0.5 }))

  try {
    const prompt = `Rate the relevance of each job (0.0 to 1.0) for a candidate with these preferences:
Roles: ${preferences.roles.join(', ')}
Keywords: ${preferences.keywords.join(', ')}
Locations: ${preferences.locations.join(', ')}
Remote: ${preferences.remote}

Jobs to rate (JSON array, return only JSON array of {id, score}):
${JSON.stringify(jobs.slice(0, 20).map(j => ({ id: j.id, title: j.title, company: j.company, location: j.location })))}

Return ONLY valid JSON: [{"id": 1, "score": 0.8}, ...]`

    const response = await chat([{ role: 'user', content: prompt }])
    const scores = JSON.parse(response.content.match(/\[.*\]/s)?.[0] || '[]')
    const scoreMap = Object.fromEntries(scores.map(s => [s.id, s.score]))

    return jobs.map(j => ({ ...j, relevance_score: scoreMap[j.id] ?? 0.5 }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
  } catch {
    return jobs.map(j => ({ ...j, relevance_score: 0.5 }))
  }
}
