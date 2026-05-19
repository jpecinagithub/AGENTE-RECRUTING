import React from 'react'
import { saveJob, feedbackJob } from '../../api/api.js'
import { useStore } from '../../store/useStore.js'

export default function JobCard({ job }) {
  const updateJob = useStore(s => s.updateJob)

  const handleSave = async () => {
    await saveJob(job.id)
    updateJob(job.id, { is_saved: true })
  }

  const handleFeedback = async (feedback) => {
    await feedbackJob(job.id, feedback)
    updateJob(job.id, { feedback })
  }

  const score = job.relevance_score ? Math.round(job.relevance_score * 100) : null

  return (
    <div className="bg-card border border-border rounded-xl p-4 my-2 hover:border-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight">{job.title}</h3>
          <p className="text-muted text-xs mt-1">{job.company} · {job.location}</p>
          {job.salary && <p className="text-green-400 text-xs mt-1">{job.salary}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {score !== null && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${score >= 70 ? 'bg-green-900 text-green-300' : score >= 40 ? 'bg-yellow-900 text-yellow-300' : 'bg-slate-700 text-muted'}`}>
              {score}%
            </span>
          )}
          {job.source_name && <span className="text-xs text-muted">{job.source_name}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Apply →
          </a>
        )}
        <button
          onClick={handleSave}
          disabled={job.is_saved}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${job.is_saved ? 'border-border text-muted cursor-default' : 'border-border text-muted hover:border-accent hover:text-accent'}`}
        >
          {job.is_saved ? '✓ Saved' : 'Save'}
        </button>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => handleFeedback('relevant')}
            className={`text-sm px-2 py-1 rounded transition-colors ${job.feedback === 'relevant' ? 'bg-green-900 text-green-300' : 'hover:bg-slate-700'}`}
            title="Relevant"
          >👍</button>
          <button
            onClick={() => handleFeedback('not_relevant')}
            className={`text-sm px-2 py-1 rounded transition-colors ${job.feedback === 'not_relevant' ? 'bg-red-900 text-red-300' : 'hover:bg-slate-700'}`}
            title="Not relevant"
          >👎</button>
        </div>
      </div>
    </div>
  )
}
