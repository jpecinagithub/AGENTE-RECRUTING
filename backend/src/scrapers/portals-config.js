// Built-in portal configurations with verified selectors.
// When a portal's DOM changes, update the selectors object for that portal.
// Each config has: buildSearchUrl(params), selectors, maxPages

export const PORTAL_CONFIGS = {

  'tecnoempleo.com': {
    name: 'Tecnoempleo',
    baseUrl: 'https://www.tecnoempleo.com',
    buildSearchUrl: ({ query, location, page }) => {
      const q = encodeURIComponent(query || '')
      const loc = encodeURIComponent(location || '')
      const p = page > 1 ? `&pagina=${page}` : ''
      return `https://www.tecnoempleo.com/busqueda-empleo/?te=${q}&ph=${loc}${p}`
    },
    selectors: {
      // Container de cada oferta — múltiples fallbacks separados por coma
      job: '.oferta-empleo, .p-3.border-bottom, .list-group-item.border-bottom, article.oferta',
      title: 'h3.fs-5 a, h3 a, .titulo a, a.text-decoration-none[href*="oferta"]',
      company: '.text-primary.fs-6, .text-primary, .empresa, strong.d-block',
      location: '.d-none.d-sm-inline.text-muted, .ubicacion, [class*="province"], .badge-sm',
      salary: '.badge.bg-success, .badge.text-bg-success, .salario, [class*="salary"]',
      link: 'h3 a, .titulo a, a[href*="/oferta-empleo/"]',
      description: 'p.small.mt-1, .descripcion, .text-truncate',
    },
    maxPages: 3,
  },

  'computrabajo.es': {
    name: 'Computrabajo',
    baseUrl: 'https://www.computrabajo.es',
    buildSearchUrl: ({ query, location, page }) => {
      const q = encodeURIComponent(query || '')
      const loc = encodeURIComponent(location || '')
      const p = page > 1 ? `&p=${page}` : ''
      return `https://www.computrabajo.es/ofertas-de-trabajo/?q=${q}&l=${loc}${p}`
    },
    selectors: {
      job: 'article.box_offer, div[data-id], .offerBlock, article[class*="offer"]',
      title: 'h2.title a, a.js-o-link, h2 a, .tit_offer a',
      company: 'p.dBlock.color_darken, span.company, p[class*="company"]',
      location: 'p.fs16.iconMap, .location, [itemprop="addressLocality"], p[class*="location"]',
      salary: '.tag-offer.salary, .salary, [class*="salary"]',
      link: 'h2.title a, a.js-o-link, a[href*="/empleo-de"]',
      description: 'p.offer_description, .description, p[class*="description"]',
    },
    maxPages: 3,
  },

  'infojobs.net': {
    name: 'InfoJobs',
    baseUrl: 'https://www.infojobs.net',
    buildSearchUrl: ({ query, location, page }) => {
      const q = encodeURIComponent(query || '')
      const loc = encodeURIComponent(location || '')
      const p = page > 1 ? `&page=${page}` : ''
      // normalizedLocation accepts city names like "madrid", "barcelona"
      return `https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=${q}&normalizedLocation=${loc}${p}`
    },
    selectors: {
      // InfoJobs usa mucho JS pero el listado inicial sí viene en HTML
      job: '.ij-OfferCard, li[data-offer-id], [class*="OfferCard"], .offer-item',
      title: 'a.ij-OfferCard-description-title-link, [class*="title"] a, h2 a',
      company: '[class*="company"], [class*="subtitle"], .ij-OfferCard-description-subtitle a',
      location: '[class*="location"], [class*="province"], .ij-OfferCard-location',
      salary: '[class*="salary"], [class*="tag"] span',
      link: 'a[href*="infojobs.net/"], a[href*="/ofertas-trabajo/"]',
      description: '[class*="description"] p, .ij-OfferCard-description-text',
    },
    maxPages: 2, // InfoJobs bloquea más agresivamente en páginas altas
  },

}

// Lista de portales sugeridos para el seed del usuario
export const SUGGESTED_PORTALS = [
  {
    name: 'Tecnoempleo',
    url: 'https://www.tecnoempleo.com',
    type: 'scraper',
    config: { selectors: PORTAL_CONFIGS['tecnoempleo.com'].selectors, maxPages: 3 },
  },
  {
    name: 'Computrabajo',
    url: 'https://www.computrabajo.es',
    type: 'scraper',
    config: { selectors: PORTAL_CONFIGS['computrabajo.es'].selectors, maxPages: 3 },
  },
  {
    name: 'InfoJobs',
    url: 'https://www.infojobs.net',
    type: 'scraper',
    config: { selectors: PORTAL_CONFIGS['infojobs.net'].selectors, maxPages: 2 },
  },
]
