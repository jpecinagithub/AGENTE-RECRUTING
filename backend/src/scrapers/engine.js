import axios from 'axios'
import * as cheerio from 'cheerio'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
}

export async function scrapePortal(baseUrl, config, searchParams) {
  const { selectors } = config

  if (!selectors?.job) {
    console.warn(`[scraper] No selectors configured for ${baseUrl}`)
    return []
  }

  const searchUrl = buildSearchUrl(baseUrl, searchParams)

  try {
    const { data } = await axios.get(searchUrl, {
      headers: HEADERS,
      timeout: 10000,
    })

    const $ = cheerio.load(data)
    const jobs = []

    $(selectors.job).each((_, el) => {
      const $el = $(el)

      const linkEl = $el.find(selectors.link || 'a').first()
      let applyUrl = linkEl.attr('href') || ''
      if (applyUrl && !applyUrl.startsWith('http')) {
        applyUrl = new URL(applyUrl, baseUrl).href
      }

      const job = {
        title: $el.find(selectors.title).first().text().trim(),
        company: $el.find(selectors.company).first().text().trim(),
        location: $el.find(selectors.location).first().text().trim(),
        salary: selectors.salary ? $el.find(selectors.salary).first().text().trim() : null,
        apply_url: applyUrl,
        description: selectors.description ? $el.find(selectors.description).first().text().trim().slice(0, 500) : null,
      }

      if (job.title) jobs.push(job)
    })

    return jobs
  } catch (err) {
    console.error(`[scraper] Error fetching ${searchUrl}:`, err.message)
    return []
  }
}

function buildSearchUrl(baseUrl, { roles, keywords, locations, remote }) {
  const query = [...roles, ...keywords].join(' ')
  const location = locations[0] || ''

  if (baseUrl.includes('infojobs.net')) {
    const q = encodeURIComponent(query)
    const l = encodeURIComponent(location)
    return `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${q}&provinceIds=28&showFilters=true`
  }

  if (baseUrl.includes('tecnoempleo.com')) {
    const q = encodeURIComponent(query)
    return `https://www.tecnoempleo.com/busqueda-empleo/?te=${q}`
  }

  // Generic: append query params
  const url = new URL(baseUrl)
  if (query) url.searchParams.set('q', query)
  if (location) url.searchParams.set('l', location)
  return url.href
}
