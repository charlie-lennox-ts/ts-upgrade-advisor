'use client'
import { useState } from 'react'
import { AlertTriangle, Info, Zap, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Copy, Sparkles } from 'lucide-react'

interface Issue {
  id: string; severity: 'critical' | 'warning' | 'info'; category: string
  title: string; detail: string; affectedCode?: string; fix?: string; docsLink?: string
}
interface Opportunity { title: string; detail: string; docsLink?: string }
interface Analysis {
  summary: string; sdkVersionWarning?: string
  issues: Issue[]; opportunities: Opportunity[]
}
interface AnalysisResultsProps { analysis: Analysis; fromVersion: string; toVersion: string }

const SEV = {
  critical: { label: 'Breaking Change', border: 'rgba(255,192,82,0.5)',  bg: 'rgba(255,192,82,0.05)',  badge: { bg: 'rgba(255,192,82,0.1)',  color: '#FFC052', border: 'rgba(255,192,82,0.25)' } },
  warning:  { label: 'Deprecation',    border: 'rgba(113,75,251,0.5)',   bg: 'rgba(113,75,251,0.05)',  badge: { bg: 'rgba(113,75,251,0.1)',  color: '#A78BFA', border: 'rgba(113,75,251,0.25)' } },
  info:     { label: 'Change',         border: 'rgba(4,209,255,0.4)',    bg: 'rgba(4,209,255,0.04)',   badge: { bg: 'rgba(4,209,255,0.08)', color: '#04D1FF', border: 'rgba(4,209,255,0.2)' } },
}

function IssueCard({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEV[issue.severity]
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `2px solid ${cfg.border}`, background: cfg.bg }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start justify-between gap-3 p-4 text-left">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5"
                style={{ background: cfg.badge.bg, color: cfg.badge.color, border: `1px solid ${cfg.badge.border}` }}>
            {issue.severity === 'info' ? <Info size={11} /> : <AlertTriangle size={11} />}
            {cfg.label}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{issue.title}</p>
            {issue.affectedCode && <code className="text-xs font-mono truncate block mt-0.5" style={{ color: '#7AA8C4' }}>{issue.affectedCode}</code>}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: '#3A5572', marginTop: 4 }} /> : <ChevronDown size={14} style={{ color: '#3A5572', marginTop: 4 }} />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
          <p className="text-sm leading-relaxed" style={{ color: '#D0E8F5' }}>{issue.detail}</p>
          {issue.fix && (
            <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(4,209,255,0.08)' }}>
              <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: '#7AA8C4' }}><Zap size={11} style={{ color: '#04D1FF' }} /> Required action</p>
              <p className="text-sm font-mono leading-relaxed whitespace-pre-wrap text-white">{issue.fix}</p>
            </div>
          )}
          {issue.docsLink && (
            <a href={issue.docsLink} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-xs hover:underline" style={{ color: '#04D1FF' }}>
              <ExternalLink size={11} /> View documentation
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function AnalysisResults({ analysis, fromVersion, toVersion }: AnalysisResultsProps) {
  const [copiedAnalysis, setCopiedAnalysis] = useState(false)

  const criticalCount = analysis.issues.filter(i => i.severity === 'critical').length
  const warningCount  = analysis.issues.filter(i => i.severity === 'warning').length
  const infoCount     = analysis.issues.filter(i => i.severity === 'info').length

  const handleCopyAnalysis = () => {
    const lines = [
      `ThoughtSpot Upgrade Impact Analysis: ${fromVersion} → ${toVersion}`,
      '',
      analysis.summary,
      '',
      ...analysis.issues
        .sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]))
        .map(i => `[${i.severity.toUpperCase()}] ${i.title}\n${i.detail}${i.fix ? `\nAction: ${i.fix}` : ''}`),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopiedAnalysis(true)
    setTimeout(() => setCopiedAnalysis(false), 2000)
  }

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Summary */}
      <div className="ts-card p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-semibold text-white">Impact Analysis</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7AA8C4' }}>{fromVersion} → {toVersion}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {criticalCount > 0 && <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: 'rgba(255,192,82,0.1)', color: '#FFC052', border: '1px solid rgba(255,192,82,0.25)' }}><AlertTriangle size={11} /> {criticalCount} critical</span>}
            {warningCount > 0  && <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(113,75,251,0.1)', color: '#A78BFA', border: '1px solid rgba(113,75,251,0.25)' }}>{warningCount} warnings</span>}
            {infoCount > 0     && <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(4,209,255,0.08)', color: '#04D1FF', border: '1px solid rgba(4,209,255,0.2)' }}>{infoCount} info</span>}
            {analysis.issues.length === 0 && <span className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1" style={{ background: 'rgba(109,210,103,0.1)', color: '#6DD267', border: '1px solid rgba(109,210,103,0.25)' }}><CheckCircle size={11} /> No issues</span>}
            <button onClick={handleCopyAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
              style={{ background: copiedAnalysis ? 'rgba(109,210,103,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copiedAnalysis ? 'rgba(109,210,103,0.3)' : 'rgba(255,255,255,0.1)'}`, color: copiedAnalysis ? '#6DD267' : '#7AA8C4' }}>
              {copiedAnalysis ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
            </button>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#D0E8F5' }}>{analysis.summary}</p>
        {analysis.sdkVersionWarning && (
          <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,192,82,0.08)', border: '1px solid rgba(255,192,82,0.2)' }}>
            <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#FFC052' }} />
            <p className="text-xs" style={{ color: '#FFC052' }}>{analysis.sdkVersionWarning}</p>
          </div>
        )}
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="ts-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={13} style={{ color: '#FFC052' }} /> Issues to resolve ({analysis.issues.length})
          </h3>
          <div className="space-y-2">
            {[...analysis.issues]
              .sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]))
              .map(issue => <IssueCard key={issue.id} issue={issue} />)}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {analysis.opportunities?.length > 0 && (
        <div className="ts-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles size={13} style={{ color: '#04D1FF' }} /> New features available ({analysis.opportunities.length})
          </h3>
          <div className="space-y-3">
            {analysis.opportunities.map((opp, i) => (
              <div key={i} className="rounded-lg p-4" style={{ border: '1px solid rgba(255,255,255,0.06)', borderLeft: '2px solid rgba(4,209,255,0.4)', background: 'rgba(4,209,255,0.04)' }}>
                <p className="text-sm font-medium text-white mb-1">{opp.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#7AA8C4' }}>{opp.detail}</p>
                {opp.docsLink && (
                  <a href={opp.docsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs mt-2 hover:underline" style={{ color: '#04D1FF' }}>
                    <ExternalLink size={11} /> Learn more
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
