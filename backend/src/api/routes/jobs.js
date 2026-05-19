import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { JobListings } from '../../db/models.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const { saved } = req.query
  const jobs = await JobListings.getByUser(req.user.id, { savedOnly: saved === 'true' })
  res.json(jobs)
})

router.post('/:id/save', async (req, res) => {
  await JobListings.save(req.params.id, req.user.id)
  res.json({ success: true })
})

router.post('/:id/feedback', async (req, res) => {
  const { feedback } = req.body
  if (!['relevant', 'not_relevant'].includes(feedback)) return res.status(400).json({ error: 'Invalid feedback' })
  await JobListings.feedback(req.params.id, req.user.id, feedback)
  res.json({ success: true })
})

export default router
