import cron from 'node-cron'
import { query } from '../db/connection.js'
import { generateDailyReport } from '../agent/tools/generate_daily_report.js'

export function startScheduler() {
  // Every day at 09:00
  cron.schedule('0 9 * * *', async () => {
    console.log('[scheduler] Running daily job report...')

    try {
      const users = await query('SELECT id FROM users')

      for (const user of users) {
        try {
          const report = await generateDailyReport({}, user.id)
          console.log(`[scheduler] User ${user.id}: ${report.total_found || 0} jobs found`)
        } catch (err) {
          console.error(`[scheduler] Error for user ${user.id}:`, err.message)
        }
      }
    } catch (err) {
      console.error('[scheduler] Fatal error:', err.message)
    }
  })

  console.log('[scheduler] Daily job report scheduled at 09:00')
}
