import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Users } from '../../db/models.js'
import { Conversations } from '../../db/models.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const existing = await Users.findByEmail(email)
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const userId = await Users.create(email, hash, name || email.split('@')[0])

    // Create default conversation
    await Conversations.create(userId, 'Main')

    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' })
    res.json({ token, user: { id: userId, email, name: name || email.split('@')[0] } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const user = await Users.findByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
