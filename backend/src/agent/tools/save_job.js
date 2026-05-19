import { JobListings } from '../../db/models.js'

export async function saveJob({ job_id }, userId) {
  await JobListings.save(job_id, userId)
  return { success: true, message: `Job ${job_id} saved to your shortlist.` }
}
