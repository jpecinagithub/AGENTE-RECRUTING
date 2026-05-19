import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { runAgent } from '../../agent/core.js'
import { Conversations, Messages } from '../../db/models.js'
import multer from 'multer'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.use(requireAuth)

router.get('/conversations', async (req, res) => {
  const convs = await Conversations.getByUser(req.user.id)
  res.json(convs)
})

router.post('/conversations', async (req, res) => {
  const id = await Conversations.create(req.user.id, req.body.title || 'New Chat')
  res.json({ id })
})

router.get('/conversations/:id/messages', async (req, res) => {
  const conv = await Conversations.findById(req.params.id)
  if (!conv || conv.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' })
  const messages = await Messages.getByConversation(req.params.id)
  res.json(messages)
})

router.post('/message', async (req, res) => {
  const { message, conversation_id } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })

  let convId = conversation_id
  if (!convId) {
    const convs = await Conversations.getByUser(req.user.id)
    convId = convs[0]?.id || await Conversations.create(req.user.id, 'Main')
  }

  try {
    const result = await runAgent(req.user.id, convId, message)
    res.json({ ...result, conversation_id: convId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  try {
    const data = await pdfParse(req.file.buffer)
    const text = data.text.replace(/\s+/g, ' ').trim()
    res.json({ text, pages: data.numpages, filename: req.file.originalname })
  } catch (err) {
    res.status(500).json({ error: 'Could not parse PDF: ' + err.message })
  }
})

export default router
