import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

import authRouter from './api/routes/auth.js'
import chatRouter from './api/routes/chat.js'
import jobsRouter from './api/routes/jobs.js'
import portalsRouter from './api/routes/portals.js'
import preferencesRouter from './api/routes/preferences.js'

import { runAgentStream } from './agent/core.js'
import { Conversations } from './db/models.js'
import { startScheduler } from './scheduler/daily-report.js'
import { isMock, MODEL } from './llm/client.js'

const app = express()
const server = createServer(app)
const PORT = parseInt(process.env.PORT) || 3020

app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/chat', chatRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/portals', portalsRouter)
app.use('/api/preferences', preferencesRouter)

// Serve built frontend
const FRONTEND_DIST = join(__dirname, '../../frontend/dist')
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST))
  app.get(/^(?!\/api).*$/, (_, res) => res.sendFile(join(FRONTEND_DIST, 'index.html')))
}

app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  model: MODEL,
  mock: isMock,
  time: new Date().toISOString(),
}))

// WebSocket server for streaming chat
const wss = new WebSocketServer({ server, path: '/ws/chat' })

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/ws/chat?', ''))
  const token = params.get('token')

  let user
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
  } catch {
    ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
    ws.close()
    return
  }

  ws.on('message', async (data) => {
    try {
      const { message, conversation_id } = JSON.parse(data)
      let convId = conversation_id
      if (!convId) {
        const convs = await Conversations.getByUser(user.id)
        convId = convs[0]?.id || await Conversations.create(user.id, 'Main')
      }
      await runAgentStream(user.id, convId, message, ws)
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: err.message }))
    }
  })
})

startScheduler()

server.listen(PORT, () => {
  console.log(`\n🤖 Recruiting Agent backend running on port ${PORT}`)
  console.log(`   LLM: ${isMock ? '⚠️  MOCK MODE (set LLM_API_KEY in .env)' : `✅ ${MODEL}`}`)
  console.log(`   API: http://localhost:${PORT}/api`)
  console.log(`   WS:  ws://localhost:${PORT}/ws/chat\n`)
})
