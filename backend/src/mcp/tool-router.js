import { searchJobs } from '../agent/tools/search_jobs.js'
import { updatePreferences } from '../agent/tools/update_preferences.js'
import { saveJob } from '../agent/tools/save_job.js'
import { addJobPortal } from '../agent/tools/add_job_portal.js'
import { generateDailyReport } from '../agent/tools/generate_daily_report.js'

const TOOLS = {
  search_jobs: searchJobs,
  update_preferences: updatePreferences,
  save_job: saveJob,
  add_job_portal: addJobPortal,
  generate_daily_report: generateDailyReport,
}

export async function executeTool(toolName, args, userId) {
  const tool = TOOLS[toolName]
  if (!tool) throw new Error(`Unknown tool: ${toolName}`)
  return tool(args, userId)
}

export async function executeToolCalls(toolCalls, userId) {
  const results = []
  for (const call of toolCalls) {
    try {
      const args = JSON.parse(call.function.arguments)
      const result = await executeTool(call.function.name, args, userId)
      results.push({ tool: call.function.name, result, call_id: call.id })
    } catch (err) {
      results.push({ tool: call.function.name, error: err.message, call_id: call.id })
    }
  }
  return results
}
