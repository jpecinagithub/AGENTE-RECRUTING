import { JobSources, JobListings, Preferences } from '../../db/models.js'
import { query } from '../../db/connection.js'
import { scrapePortal } from '../../scrapers/engine.js'
import { readMemoryFile } from '../../mcp/file-memory.js'
import { chat } from '../../llm/client.js'

const RANK_BATCH = 15 // jobs por llamada al LLM

export async function searchJobs(args, userId) {
  const [prefs, sources, memory] = await Promise.all([
    Preferences.getByUser(userId),
    JobSources.getByUser(userId),
    Promise.resolve(readMemoryFile(userId)),
  ])

  if (!sources.length) {
    return { success: false, message: 'No hay portales configurados. Pulsa "Portales sugeridos" para añadir los principales portales españoles.' }
  }

  const searchParams = {
    roles:              args.roles     || parseJson(prefs?.roles),
    keywords:           args.keywords  || parseJson(prefs?.keywords),
    locations:          args.locations || parseJson(prefs?.locations),
    remote:             args.remote    ?? prefs?.remote_only ?? false,
    excluded_companies: parseJson(prefs?.excluded_companies),
    excluded_keywords:  parseJson(prefs?.excluded_keywords),
  }

  // Cargar URLs ya vistas para deduplicar
  const seenRows = await query(
    'SELECT apply_url FROM job_listings WHERE user_id = ? AND apply_url IS NOT NULL',
    [userId]
  )
  const seenUrls = new Set(seenRows.map(r => r.apply_url))

  // Scraping de todos los portales
  const newJobs = []
  const errors = []

  for (const source of sources) {
    try {
      const config = typeof source.config === 'string'
        ? JSON.parse(source.config)
        : (source.config || {})

      const scraped = await scrapePortal(source.url, config, searchParams)

      for (const job of scraped) {
        if (job.apply_url && seenUrls.has(job.apply_url)) continue
        if (isExcluded(job, searchParams)) continue

        const id = await JobListings.create(userId, source.id, { ...job, relevance_score: 0 })
        if (job.apply_url) seenUrls.add(job.apply_url)
        newJobs.push({ id, ...job, source_name: source.name })
      }
    } catch (err) {
      const msg = `${source.name}: ${err.message}`
      errors.push(msg)
      console.error(`[search_jobs] ${msg}`)
    }
  }

  if (!newJobs.length) {
    const errorHint = errors.length ? ` Errores: ${errors.join('; ')}` : ''
    return {
      success: true,
      jobs: [],
      total: 0,
      message: `No se encontraron nuevas ofertas.${errorHint}`,
    }
  }

  // Rankear en batches cubriendo TODOS los resultados
  const feedback = await JobListings.getFeedback(userId)
  const rankedJobs = await rankAllJobs(newJobs, searchParams, memory, feedback)

  // Persistir puntuaciones
  await Promise.all(
    rankedJobs.map(j =>
      j.id != null && j.relevance_score != null
        ? query('UPDATE job_listings SET relevance_score = ? WHERE id = ?', [j.relevance_score, j.id])
        : Promise.resolve()
    )
  )

  return { success: true, jobs: rankedJobs, total: rankedJobs.length, errors }
}

// ── Ranking ────────────────────────────────────────────────────────────────────

async function rankAllJobs(jobs, preferences, memory, feedback) {
  if (jobs.length <= 2) return jobs.map(j => ({ ...j, relevance_score: 0.5 }))

  const likedTitles = feedback.filter(f => f.feedback === 'positive').map(f => f.title)
  const dislikedTitles = feedback.filter(f => f.feedback === 'negative').map(f => f.title)

  const allScored = []

  for (let i = 0; i < jobs.length; i += RANK_BATCH) {
    const batch = jobs.slice(i, i + RANK_BATCH)
    const scores = await rankBatch(batch, preferences, memory, likedTitles, dislikedTitles)
    allScored.push(...batch.map(j => ({ ...j, relevance_score: scores[j.id] ?? 0.5 })))
  }

  return allScored.sort((a, b) => b.relevance_score - a.relevance_score)
}

async function rankBatch(jobs, preferences, memory, likedTitles, dislikedTitles) {
  const memSection = memory?.trim()
    ? `\nPerfil del candidato (memoria):\n${memory.trim().slice(0, 600)}\n`
    : ''

  const likedSection = likedTitles.length
    ? `\nOfertas que le gustaron al usuario: ${likedTitles.slice(0, 10).join(', ')}\n`
    : ''

  const dislikedSection = dislikedTitles.length
    ? `\nOfertas que NO le gustaron: ${dislikedTitles.slice(0, 10).join(', ')}\n`
    : ''

  const prompt = `Puntúa la relevancia de cada oferta (0.0 a 1.0) para un candidato con estos criterios:
Roles buscados: ${preferences.roles.join(', ') || 'no especificado'}
Palabras clave: ${preferences.keywords.join(', ') || 'no especificado'}
Ubicaciones: ${preferences.locations.join(', ') || 'cualquiera'}
Solo remoto: ${preferences.remote ? 'sí' : 'no'}
${memSection}${likedSection}${dislikedSection}
Ofertas a puntuar:
${JSON.stringify(jobs.map(j => ({
  id: j.id,
  title: j.title,
  company: j.company,
  location: j.location,
  description: j.description?.slice(0, 300),
})))}

Devuelve ÚNICAMENTE un JSON array: [{"id": 1, "score": 0.85}, ...]
Sin texto adicional.`

  try {
    const response = await chat([{ role: 'user', content: prompt }])
    const match = response.content.match(/\[[\s\S]*?\]/)
    if (!match) return {}
    const scores = JSON.parse(match[0])
    return Object.fromEntries(scores.map(s => [s.id, parseFloat(s.score)]))
  } catch {
    return {}
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function isExcluded(job, { excluded_companies = [], excluded_keywords = [] }) {
  const company = (job.company || '').toLowerCase()
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase()

  if (excluded_companies.some(c => company.includes(c.toLowerCase()))) return true
  if (excluded_keywords.some(k => text.includes(k.toLowerCase()))) return true
  return false
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}
