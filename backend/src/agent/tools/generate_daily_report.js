import { Preferences } from '../../db/models.js'
import { searchJobs } from './search_jobs.js'
import { readMemoryFile } from '../../mcp/file-memory.js'

export async function generateDailyReport(args, userId) {
  const prefs = await Preferences.getByUser(userId)
  const memory = readMemoryFile(userId)

  const searchResult = await searchJobs({}, userId)

  if (!searchResult.success) {
    return {
      success: false,
      message: searchResult.message || 'Could not run job search. Make sure you have portals configured.',
      report: null,
    }
  }

  if (!searchResult.jobs?.length) {
    return {
      success: true,
      message: 'No new jobs found today. All results may already be in your feed from previous searches.',
      total_found: 0,
    }
  }

  const topJobs = searchResult.jobs.slice(0, 10)
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const roles = parseJson(prefs?.roles) || []
  const locations = parseJson(prefs?.locations) || []
  const keywords = parseJson(prefs?.keywords) || []

  const criteriaLine = [
    roles.length && `Roles: ${roles.join(', ')}`,
    locations.length && `Ubicaciones: ${locations.join(', ')}`,
    prefs?.remote_only && 'Solo remoto',
    prefs?.salary_min && `Salario mín: ${prefs.salary_min}€`,
  ].filter(Boolean).join(' · ')

  let report = `## 📋 Reporte Diario de Empleo — ${today}\n\n`
  report += `Se han encontrado **${searchResult.total} nuevas ofertas** que coinciden con tu perfil.\n\n`

  if (criteriaLine) {
    report += `_Criterios: ${criteriaLine}_\n\n`
  }

  if (memory?.trim()) {
    report += `_Perfil del candidato aplicado desde tu memoria guardada._\n\n`
  }

  report += `### 🏆 Mejores Coincidencias\n\n`

  topJobs.forEach((job, i) => {
    const score = job.relevance_score != null ? ` · ${Math.round(job.relevance_score * 100)}% de relevancia` : ''
    const salary = job.salary ? ` · 💰 ${job.salary}` : ''
    const location = job.location ? `📍 ${job.location}` : '📍 Sin especificar'
    const remote = (job.location?.toLowerCase().includes('remote') || job.location?.toLowerCase().includes('remoto') || prefs?.remote_only) ? ' · 🌐 Remoto' : ''
    const source = job.source_name ? ` — _vía ${job.source_name}_` : ''

    report += `**${i + 1}. ${job.title}** — ${job.company}${source}\n`
    report += `${location}${remote}${salary}${score}\n`
    if (job.description) {
      report += `${job.description.slice(0, 120).trim()}…\n`
    }
    if (job.apply_url) report += `[Ver oferta →](${job.apply_url})\n`
    report += '\n'
  })

  if (searchResult.total > 10) {
    report += `_...y ${searchResult.total - 10} más. Abre el panel de Empleos (📋) para verlos todos._\n\n`
  }

  report += `---\n_Puedes guardar ofertas con 👍 o descartarlas con 👎 para mejorar futuras búsquedas._`

  return {
    success: true,
    report_date: new Date().toISOString().split('T')[0],
    total_found: searchResult.total,
    top_jobs: topJobs,
    message: report,
  }
}

function parseJson(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return [] }
}
