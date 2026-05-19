import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { JobSources } from '../../db/models.js'
import { addJobPortal } from '../../agent/tools/add_job_portal.js'
import { SUGGESTED_PORTALS } from '../../scrapers/portals-config.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const portals = await JobSources.getByUser(req.user.id)
  res.json(portals)
})

router.post('/', async (req, res) => {
  const { name, url, type, selectors } = req.body
  if (!name || !url) return res.status(400).json({ error: 'Name and URL required' })
  const result = await addJobPortal({ name, url, type, selectors }, req.user.id)
  res.status(result.success ? 201 : 400).json(result)
})

router.delete('/:id', async (req, res) => {
  await JobSources.delete(req.params.id, req.user.id)
  res.json({ success: true })
})

// Añade los portales sugeridos que el usuario aún no tiene
router.post('/seed', async (req, res) => {
  const existing = await JobSources.getByUser(req.user.id)
  const existingUrls = new Set(existing.map(p => new URL(p.url).hostname))

  const added = []
  const skipped = []

  for (const portal of SUGGESTED_PORTALS) {
    let hostname
    try { hostname = new URL(portal.url).hostname } catch { continue }

    if (existingUrls.has(hostname)) {
      skipped.push(portal.name)
      continue
    }

    await JobSources.create(req.user.id, portal.name, portal.url, portal.type, portal.config)
    added.push(portal.name)
  }

  const updated = await JobSources.getByUser(req.user.id)
  res.json({ added, skipped, portals: updated })
})

export default router
