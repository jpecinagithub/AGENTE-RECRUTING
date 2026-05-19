import axios from 'axios'
import * as cheerio from 'cheerio'
import { PORTAL_CONFIGS } from './portals-config.js'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function buildHeaders(pageUrl) {
  const origin = new URL(pageUrl).origin
  return {
    'User-Agent': randomUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': origin + '/',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
  }
}

async function fetchWithRetry(url, maxRetries = 2) {
  let lastErr
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, status } = await axios.get(url, {
        headers: buildHeaders(url),
        timeout: 14000,
        maxRedirects: 5,
        validateStatus: (s) => s < 500, // no tirar en 4xx, manejar manualmente
      })
      if (status === 403 || status === 429) {
        throw Object.assign(new Error(`HTTP ${status}`), { status })
      }
      return data
    } catch (err) {
      lastErr = err
      if (attempt < maxRetries) {
        const delay = attempt * 2000 + Math.random() * 1000
        await sleep(delay)
      }
    }
  }
  throw lastErr
}

function extractJobs($, selectors, baseUrl) {
  const jobs = []

  $(selectors.job).each((_, el) => {
    const $el = $(el)

    const title = firstText($el, selectors.title)
    if (!title || title.length < 3) return

    const linkHref = firstAttr($el, selectors.link || selectors.title, 'href')
      || firstAttr($el, 'a', 'href')
    const applyUrl = resolveUrl(linkHref, baseUrl)

    const company = firstText($el, selectors.company) || null
    const location = firstText($el, selectors.location) || null
    const salary = selectors.salary ? firstText($el, selectors.salary) || null : null
    const description = selectors.description
      ? $el.find(selectors.description).first().text().replace(/\s+/g, ' ').trim().slice(0, 400) || null
      : null

    jobs.push({ title, company, location, salary, description, apply_url: applyUrl })
  })

  return jobs
}

function firstText($el, selector) {
  if (!selector) return null
  return $el.find(selector).first().text().replace(/\s+/g, ' ').trim() || null
}

function firstAttr($el, selector, attr) {
  if (!selector) return null
  return $el.find(selector).first().attr(attr) || null
}

function resolveUrl(href, baseUrl) {
  if (!href) return null
  if (href.startsWith('http')) return href
  if (href.startsWith('//')) return 'https:' + href
  try { return new URL(href, baseUrl).href } catch { return null }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// Detecta la key del portal usando el dominio de la URL
function detectPortalConfig(url) {
  try {
    const host = new URL(url).hostname
    return Object.keys(PORTAL_CONFIGS).find(k => host.includes(k)) || null
  } catch { return null }
}

export async function scrapePortal(baseUrl, config, searchParams) {
  const userSelectors = config?.selectors
  const portalKey = detectPortalConfig(baseUrl)
  const builtIn = portalKey ? PORTAL_CONFIGS[portalKey] : null

  // Selectors: primero los del usuario (si tiene), si no los built-in
  const selectors = (userSelectors?.job ? userSelectors : null) || builtIn?.selectors

  if (!selectors?.job) {
    console.warn(`[scraper] Sin selectores para ${baseUrl} — añade selectores al portal o usa un portal soportado`)
    return []
  }

  const query = [
    ...(searchParams.roles || []),
    ...(searchParams.keywords || []),
  ].join(' ')
  const location = (searchParams.locations || [])[0] || ''
  const maxPages = config?.maxPages || builtIn?.maxPages || 1

  const allJobs = []

  for (let page = 1; page <= maxPages; page++) {
    if (page > 1) await sleep(1500 + Math.random() * 1000)

    let url
    if (builtIn?.buildSearchUrl) {
      url = builtIn.buildSearchUrl({ query, location, page })
    } else {
      url = buildGenericUrl(baseUrl, searchParams, page)
    }

    try {
      const html = await fetchWithRetry(url)
      const $ = cheerio.load(html)
      const pageJobs = extractJobs($, selectors, baseUrl)

      console.log(`[scraper] ${new URL(baseUrl).hostname} p${page}: ${pageJobs.length} ofertas`)

      if (!pageJobs.length) break // sin más resultados, parar paginación

      allJobs.push(...pageJobs)
    } catch (err) {
      const status = err?.status || err?.response?.status
      if (status === 403 || status === 429) {
        console.warn(`[scraper] ${new URL(baseUrl).hostname} bloqueado (${status}) en página ${page}`)
      } else {
        console.error(`[scraper] ${new URL(baseUrl).hostname} p${page}: ${err.message}`)
      }
      break
    }
  }

  console.log(`[scraper] ${new URL(baseUrl).hostname} total: ${allJobs.length} ofertas`)
  return allJobs
}

function buildGenericUrl(baseUrl, { roles, keywords, locations }, page) {
  const q = [...(roles || []), ...(keywords || [])].join(' ')
  const loc = (locations || [])[0] || ''
  const url = new URL(baseUrl)
  if (q) url.searchParams.set('q', q)
  if (loc) url.searchParams.set('l', loc)
  if (page > 1) url.searchParams.set('page', page)
  return url.href
}
