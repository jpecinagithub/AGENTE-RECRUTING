import { JobListings } from '../../db/models.js'
import { searchJobs } from './search_jobs.js'

export async function generateDailyReport(args, userId) {
  const searchResult = await searchJobs({}, userId)

  if (!searchResult.success || !searchResult.jobs?.length) {
    return { success: true, message: 'No new jobs found for today.', jobs: [] }
  }

  const topJobs = searchResult.jobs.slice(0, 10)

  return {
    success: true,
    report_date: new Date().toISOString().split('T')[0],
    total_found: searchResult.total,
    top_jobs: topJobs,
    message: `Found ${searchResult.total} jobs. Here are the top ${topJobs.length} matches.`,
  }
}
