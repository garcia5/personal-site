import React, { useState, useEffect } from 'react'
import { GithubIcon, ChevronIcon } from '../assets/Icons'

interface CommitFile {
  filename: string
  additions: number
  deletions: number
  status: string
}

interface CommitDetails {
  sha: string
  commit: {
    author: {
      date: string
      name: string
    }
    message: string
  }
  html_url: string
  files?: CommitFile[]
  stats?: {
    total: number
    additions: number
    deletions: number
  }
}

const CommitDetails: React.FC<{ commit: CommitDetails }> = ({ commit }) => {
  return (
    <div key={commit.sha} className="relative z-10 pl-4">
      {/* Commit Dot */}
      <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-ctp-green border border-[#11111b]" />

      {/* Header: SHA - Refs - Message */}
      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
        <a
          href={commit.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ctp-green hover:underline font-bold"
        >
          {commit.sha.substring(0, 7)}
        </a>
        <span className="text-ctp-rosewater font-bold break-words leading-tight">
          {commit.commit.message.split('\n')[0]}
        </span>
      </div>

      {/* Metadata: Date - Author */}
      <div className="text-ctp-subtext1 mb-2">
        ({new Date(commit.commit.author.date).toLocaleDateString('en-US')}
        {' - '}
        {commit.commit.author.name})
      </div>

      {/* Stats */}
      {commit.files && (
        <div className="space-y-1 mt-1 pl-1 border-l-2 border-ctp-surface0/50 ml-1">
          {commit.files.slice(0, 4).map((file) => (
            <div
              key={file.filename}
              className="flex items-center justify-between gap-4 text-ctp-overlay2 opacity-80"
            >
              <span className="truncate max-w-[140px]" title={file.filename}>
                {file.filename.split('/').pop()}
              </span>
              <div className="flex items-center gap-[1px] text-[8px] tracking-tighter font-bold">
                {/* Render + for additions, - for deletions. Cap at 5 chars total */}
                {Array.from({ length: Math.min(file.additions, 5) }).map(
                  (_, i) => (
                    <span key={`add-${i}`} className="text-ctp-green">
                      +
                    </span>
                  )
                )}
                {Array.from({ length: Math.min(file.deletions, 5) }).map(
                  (_, i) => (
                    <span key={`del-${i}`} className="text-ctp-red">
                      -
                    </span>
                  )
                )}
              </div>
            </div>
          ))}
          {commit.files.length > 4 && (
            <div className="text-ctp-overlay0 italic">
              ... {commit.files.length - 4} more files
            </div>
          )}
          <div className="text-ctp-overlay1 mt-1 pt-1 border-t border-ctp-surface0/30">
            {commit.files.length} files changed,{' '}
            <span className="text-ctp-green">{commit.stats?.additions}(+)</span>{' '}
            <span className="text-ctp-red">{commit.stats?.deletions}(-)</span>
          </div>
        </div>
      )}
    </div>
  )
}

const GitLog: React.FC = () => {
  const [commits, setCommits] = useState<CommitDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        // 1. Fetch the list of commits
        const listRes = await fetch(
          'https://api.github.com/repos/garcia5/dotfiles/commits?per_page=5'
        )
        const listData = await listRes.json()

        if (!Array.isArray(listData)) {
          setLoading(false)
          return
        }

        // 2. Fetch details for each commit to get stats/files
        // We do this in parallel
        const detailsPromises = listData.map((commit: Record<string, string>) =>
          fetch(commit.url).then((res) => res.json())
        )

        const detailsData = await Promise.all(detailsPromises)
        setCommits(detailsData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching git log:', error)
        setLoading(false)
      }
    }

    fetchCommits()
  }, [])

  if (loading)
    return (
      <div className="w-full h-64 rounded-lg bg-ctp-crust border border-ctp-surface0 animate-pulse flex items-center justify-center">
        <span className="text-ctp-subtext0">Loading git log...</span>
      </div>
    )

  if (commits.length === 0) return null

  return (
    <div className="w-full font-mono text-xs bg-ctp-crust p-4 rounded-lg border border-ctp-surface0 shadow-xl overflow-hidden transition-all duration-300">
      <div
        className={`flex flex-col gap-2 ${
          isExpanded ? 'border-b border-ctp-surface1 pb-3 mb-4' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-ctp-mauve font-bold flex items-center gap-2">
              <span className="text-ctp-green">➜</span>
              <span>git log --stat</span>
            </h3>
            <a
              href="https://github.com/garcia5/dotfiles"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ctp-blue hover:underline flex items-center gap-1 opacity-80"
            >
              <GithubIcon className="w-3 h-3" />
              garcia5/dotfiles
            </a>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-ctp-surface0 rounded-md transition-colors text-ctp-overlay1 hover:text-ctp-mauve"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <ChevronIcon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>
            <span className="text-ctp-overlay0 text-[10px]">origin/master</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 relative">
          {/* Vertical line connecting commits */}
          <div className="absolute left-[3.5px] top-2 bottom-2 w-px bg-ctp-surface1 z-0" />

          {commits.map((commit) => (
            <CommitDetails key={commit.sha} commit={commit} />
          ))}
        </div>
      )}
    </div>
  )
}

export default GitLog
