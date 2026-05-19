import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { DailyReports } from '../../db/models.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const rows = await DailyReports.getByUser(req.user.id)
  const reports = rows.map(r => ({
    id: r.id,
    content: r.content,
    created_at: r.created_at,
    ...(typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {})),
  }))
  res.json(reports)
})

export default router
