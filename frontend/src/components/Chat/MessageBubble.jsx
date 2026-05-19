import React from 'react'
import ReactMarkdown from 'react-markdown'
import JobCard from './JobCard.jsx'
import { useStore } from '../../store/useStore.js'

export default function MessageBubble({ message, isLast, isLoading }) {
  const isUser = message.role === 'user'
  const addJobs = useStore(s => s.addJobs)

  const jobResults = message.job_results
  if (jobResults?.length) addJobs(jobResults)

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isUser ? 'bg-accent text-white' : 'bg-slate-700 text-white'}`}>
        {isUser ? 'JO' : '🤖'}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-accent text-white rounded-tr-sm' : 'bg-card border border-border text-slate-200 rounded-tl-sm'} ${isLoading && isLast && !isUser ? 'opacity-70' : ''}`}>
          {isLoading && isLast && !isUser ? (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : (
            <ReactMarkdown className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {jobResults?.length > 0 && (
          <div className="w-full">
            {jobResults.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}

        {message.tools_executed?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {message.tools_executed.map((t, i) => (
              <span key={i} className="text-xs bg-slate-800 text-muted px-2 py-0.5 rounded-full border border-border">
                ⚡ {t.tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
