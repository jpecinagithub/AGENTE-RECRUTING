import React, { useEffect } from 'react'
import { useStore } from '../../store/useStore.js'
import { getJobs } from '../../api/api.js'
import JobCard from '../Chat/JobCard.jsx'

export default function JobFeedPanel() {
  const { jobs, setJobs } = useStore()

  useEffect(() => {
    getJobs().then(res => setJobs(res.data)).catch(() => {})
  }, [])

  const saved = jobs.filter(j => j.is_saved)
  const today = jobs.filter(j => !j.is_saved)

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">Job Feed</h2>

      {!jobs.length && (
        <div className="text-center text-muted text-sm py-12">
          <div className="text-3xl mb-3">📋</div>
          <p>No jobs yet. Ask the agent to search for positions.</p>
        </div>
      )}

      {saved.length > 0 && (
        <>
          <p className="text-xs text-muted uppercase tracking-wide mb-2">Saved ({saved.length})</p>
          {saved.map(job => <JobCard key={job.id} job={job} />)}
          <div className="border-t border-border my-4" />
        </>
      )}

      {today.length > 0 && (
        <>
          <p className="text-xs text-muted uppercase tracking-wide mb-2">Latest Results ({today.length})</p>
          {today.map(job => <JobCard key={job.id} job={job} />)}
        </>
      )}
    </div>
  )
}
