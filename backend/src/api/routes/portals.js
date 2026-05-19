import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { JobSources } from '../../db/models.js'
import { addJobPortal } from '../../agent/tools/add_job_portal.js'

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

export default router
