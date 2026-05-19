import cron from 'node-cron'
import { query } from '../db/connection.js'
import { generateDailyReport } from '../agent/tools/generate_daily_report.js'
import { Conversations, Messages } from '../db/models.js'

export function startScheduler() {
  // 07:00 UTC = 09:00 Spain (CEST, UTC+2)
  cron.schedule('0 7 * * *', async () => {
    console.log('[scheduler] Running daily job report...')
    await runAllUserReports()
  })

  console.log('[scheduler] Daily job report scheduled at 07:00 UTC (09:00 Spain time)')
}

export async function runAllUserReports() {
  try {
    const users = await query('SELECT id FROM users')
    for (const user of users) {
      try {
        await runDailyReportForUser(user.id)
      } catch (err) {
        console.error(`[scheduler] Error for user ${user.id}:`, err.message)
      }
    }
  } catch (err) {
    console.error('[scheduler] Fatal error:', err.message)
  }
}

async function runDailyReportForUser(userId) {
  const report = await generateDailyReport({}, userId)

  const noJobsMsg = report.total_found === 0
    ? `## 📋 Reporte Diario\n\nHoy no se han encontrado nuevas ofertas. Revisa que tienes portales configurados y que tus preferencias están actualizadas.`
    : null

  const messageContent = report.message || noJobsMsg
  if (!messageContent) return

  // Find or create the main conversation for this user
  const convs = await Conversations.getByUser(userId)
  const convId = convs[0]?.id || await Conversations.create(userId, 'Reporte Diario')

  await Messages.create(convId, userId, 'assistant', messageContent, {
    type: 'daily_report',
    date: report.report_date,
    total: report.total_found || 0,
  })

  console.log(`[scheduler] User ${userId}: report delivered — ${report.total_found || 0} jobs found`)
}
