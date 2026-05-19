import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { Preferences } from '../../db/models.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const prefs = await Preferences.getByUser(req.user.id)
  if (prefs) {
    for (const f of ['roles', 'locations', 'keywords', 'excluded_companies', 'excluded_keywords']) {
      if (typeof prefs[f] === 'string') { try { prefs[f] = JSON.parse(prefs[f]) } catch { prefs[f] = [] } }
    }
  }
  res.json(prefs || {})
})

router.post('/', async (req, res) => {
  const updated = await Preferences.upsert(req.user.id, req.body)
  res.json(updated)
})

export default router
