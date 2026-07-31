'use client'
import { useState } from 'react'
import { 
  AlertTriangle, Info, Zap, CheckCircle, ExternalLink, 
  ChevronDown, ChevronUp, Copy, Mail, Sparkles
} from 'lucide-react'

interface Issue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  detail: string
  affectedCode?: string
  fix?: string
  docsLink?: string
}

interface Opportunity {
  title: string
  detail: string
  docsLink?: string
}

interface EmailDraft {
  subject: string
  body: string
}

interface Analysis {
  summary: string
  sdkVersionWarning?: string
  issues: Issue[]
  opportunities: Opportunity[]
  emailDraft: EmailDraft
}

interface AnalysisResultsProps {
  analysis: Analysis
  fromVersion: string
  toVersion: string
}

const SEVERITY_CONFIG = {
  critical: {
    icon: <AlertTriangle size={14} />,
    label: 'Breaking Change',
    badgeClass: 'badge-critical',
    borderClass: 'border-l-red-500',
    bgClass: 'bg-red-500/5',
  },
  warning: {
    icon: <AlertTriangle size={14} />,
    label: 'Deprecation',
    badgeClass: 'badge-warning',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-500/5',
  },
  info: {
    icon: <Info size={14} />,
    label: 'Change',
    badgeClass: 'badge-info',
    borderClass: 'border-l-ts-blue',
    bgClass: 'bg-ts-blue/5',
  },
}

function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false)
  const config = SEVERITY_CONFIG[issue.severity]

  return (
    <div className={`border border-ts-gray-700 border-l-2 ${config.borderClass} ${config.bgClass} rounded-lg overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5 ${config.badgeClass}`}>
            {config.icon}
            {config.label}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{issue.title}</p>
            {issue.affectedCode && (
              <code className="text-xs text-ts-gray-400 font-mono truncate block mt-0.5">
                {issue.affectedCode}
              </code>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-ts-gray-500 mt-1 shrink-0" /> : <ChevronDown size={14} className="text-ts-gray-500 mt-1 shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-ts-gray-700/50 pt-3">
          <p className="text-sm text-ts-gray-300 leading-relaxed">{issue.detail}</p>

          {issue.fix && (
            <div className="bg-ts-gray-800 rounded-lg p-3">
              <p className="text-xs font-medium text-ts-gray-400 mb-1.5 flex items-center gap-1">
                <Zap size={11} /> Required action
              </p>
              <p className="text-sm text-white font-mono leading-relaxed whitespace-pre-wrap">{issue.fix}</p>
            </div>
          )}

          {issue.docsLink && (
            <a
              href={issue.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-ts-blue hover:underline"
            >
              <ExternalLink size={11} /> View documentation
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function AnalysisResults({ analysis, fromVersion, toVersion }: AnalysisResultsProps) {
  const [showEmail, setShowEmail] = useState(false)
  const [copied, setCopied] = useState(false)

  const criticalCount = analysis.issues.filter(i => i.severity === 'critical').length
  const warningCount = analysis.issues.filter(i => i.severity === 'warning').length
  const infoCount = analysis.issues.filter(i => i.severity === 'info').length

  const handleCopyEmail = () => {
    const text = `Subject: ${analysis.emailDraft.subject}\n\n${analysis.emailDraft.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Summary header */}
      <div className="ts-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Impact Analysis</h2>
            <p className="text-xs text-ts-gray-400 mt-0.5">{fromVersion} → {toVersion}</p>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <span className="badge-critical px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <AlertTriangle size={11} /> {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="badge-warning px-2.5 py-1 rounded-full text-xs font-medium">
                {warningCount} warnings
              </span>
            )}
            {infoCount > 0 && (
              <span className="badge-info px-2.5 py-1 rounded-full text-xs font-medium">
                {infoCount} info
              </span>
            )}
            {analysis.issues.length === 0 && (
              <span className="badge-positive px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle size={11} /> No issues
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-ts-gray-300 leading-relaxed">{analysis.summary}</p>

        {analysis.sdkVersionWarning && (
          <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">{analysis.sdkVersionWarning}</p>
          </div>
        )}
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="ts-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            Issues to resolve ({analysis.issues.length})
          </h3>
          <div className="space-y-2">
            {/* Critical first */}
            {[...analysis.issues]
              .sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2 }
                return order[a.severity] - order[b.severity]
              })
              .map(issue => <IssueCard key={issue.id} issue={issue} />)
            }
          </div>
        </div>
      )}

      {/* Opportunities */}
      {analysis.opportunities?.length > 0 && (
        <div className="ts-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-ts-teal" />
            New features you could use ({analysis.opportunities.length})
          </h3>
          <div className="space-y-3">
            {analysis.opportunities.map((opp, i) => (
              <div key={i} className="border border-ts-gray-700 border-l-2 border-l-ts-teal bg-ts-teal/5 rounded-lg p-4">
                <p className="text-sm font-medium text-white mb-1">{opp.title}</p>
                <p className="text-xs text-ts-gray-300 leading-relaxed">{opp.detail}</p>
                {opp.docsLink && (
                  <a href={opp.docsLink} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 text-xs text-ts-teal hover:underline mt-2">
                    <ExternalLink size={11} /> Learn more
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email draft */}
      {analysis.emailDraft && (
        <div className="ts-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail size={14} className="text-ts-purple" />
              Draft upgrade email
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopyEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-ts-gray-700 hover:bg-ts-gray-600 
                           text-white rounded-lg transition-colors"
              >
                {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-ts-purple/20 hover:bg-ts-purple/30 
                           text-ts-purple rounded-lg transition-colors"
              >
                {showEmail ? 'Hide' : 'Show email'}
                {showEmail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {showEmail && (
            <div className="animate-fadeIn">
              <div className="bg-ts-gray-800/60 border border-ts-gray-700 rounded-lg p-4 space-y-3">
                <div className="pb-3 border-b border-ts-gray-700">
                  <p className="text-xs text-ts-gray-500 font-medium uppercase tracking-wide mb-1">Subject</p>
                  <p className="text-sm text-white">{analysis.emailDraft.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-ts-gray-500 font-medium uppercase tracking-wide mb-2">Body</p>
                  <pre className="text-sm text-ts-gray-300 font-sans whitespace-pre-wrap leading-relaxed">
                    {analysis.emailDraft.body}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
