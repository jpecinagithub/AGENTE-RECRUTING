import { JobSources, JobListings, Preferences } from '../../db/models.js'
import { query } from '../../db/connection.js'
import { scrapePortal } from '../../scrapers/engine.js'
import { readMemoryFile } from '../../mcp/file-memory.js'
import { chat } from '../../llm/client.js'

export async function searchJobs(args, userId) {
  const prefs = await Preferences.getByUser(userId)
  const sources = await JobSources.getByUser(userId)
  const memory = readMemoryFile(userId)

  if (!sources.length) {
    return { success: false, message: 'No hay portales de empleo configurados. Añade alguno primero.' }
  }

  const searchParams = {
    roles: args.roles || parseJson(prefs?.roles),
    keywords: args.keywords || parseJson(prefs?.keywords),
    locations: args.locations || parseJson(prefs?.locations),
    remote: args.remote ?? prefs?.remote_only ?? false,
    excluded_companies: parseJson(prefs?.excluded_companies),
    excluded_keywords: parseJson(prefs?.excluded_keywords),
  }

  // Load already-seen URLs to deduplicate
  const seenRows = await query('SELECT apply_url FROM job_listings WHERE user_id = ? AND apply_url IS NOT NULL', [userId])
  const seenUrls = new Set(seenRows.map(r => r.apply_url))

  const allJobs = []

  for (const source of sources) {
    try {
      const config = typeof source.config === 'string' ? JSON.parse(source.config) : (source.config || {})
      const jobs = await scrapePortal(source.url, config, searchParams)

      for (const job of jobs) {
        // Skip jobs already in the DB
        if (job.apply_url && seenUrls.has(job.apply_url)) continue

        // Skip excluded companies/keywords
        if (isExcluded(job, searchParams)) continue

        const id = await JobListings.create(userId, source.id, { ...job, relevance_score: 0 })
        seenUrls.add(job.apply_url)
        allJobs.push({ id, ...job, source_name: source.name })
      }
    } catch (err) {
      console.error(`[search_jobs] Error scraping ${source.name}:`, err.message)
    }
  }

  if (!allJobs.length) {
    return { success: true, jobs: [], total: 0, message: 'No se han encontrado nuevas ofertas. Prueba a ampliar los criterios de búsqueda.' }
  }

  const rankedJobs = await rankJobsByRelevance(allJobs, searchParams, memory)

  // Persist relevance scores
  for (const job of rankedJobs) {
    if (job.id && job.relevance_score != null) {
      await query('UPDATE job_listings SET relevance_score = ? WHERE id = ?', [job.relevance_score, job.id])
    }
  }

  return { success: true, jobs: rankedJobs, total: rankedJobs.length }
}

function isExcluded(job, { excluded_companies = [], excluded_keywords = [] }) {
  const text = `${job.title} ${job.company} ${job.description || ''}`.toLowerCase()
  if (excluded_companies.some(c => job.company?.toLowerCase().includes(c.toLowerCase()))) return true
  if (excluded_keywords.some(k => text.includes(k.toLowerCase()))) return true
  return false
}

async function rankJobsByRelevance(jobs, preferences, memory = '') {
  if (jobs.length <= 2) return jobs.map(j => ({ ...j, relevance_score: 0.5 }))

  try {
    const memorySection = memory?.trim() ? `\nUser profile from memory:\n${memory.trim()}\n` : ''

    const prompt = `Rate the relevance of each job listing (0.0 to 1.0) for a candidate with these criteria:
Roles: ${preferences.roles.join(', ') || 'not specified'}
Keywords: ${preferences.keywords.join(', ') || 'not specified'}
Locations: ${preferences.locations.join(', ') || 'not specified'}
Remote only: ${preferences.remote}
${memorySection}
Jobs to rate:
${JSON.stringify(jobs.slice(0, 20).map(j => ({
  id: j.id,
  title: j.title,
  company: j.company,
  location: j.location,
  description: j.description?.slice(0, 200),
})))}

Return ONLY a JSON array: [{"id": 1, "score": 0.85}, ...]`

    const response = await chat([{ role: 'user', content: prompt }])
    const match = response.content.match(/\[[\s\S]*\]/)
    const scores = match ? JSON.parse(match[0]) : []
    const scoreMap = Object.fromEntries(scores.map(s => [s.id, s.score]))

    return jobs
      .map(j => ({ ...j, relevance_score: scoreMap[j.id] ?? 0.5 }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
  } catch {
    return jobs.map(j => ({ ...j, relevance_score: 0.5 }))
  }
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}
