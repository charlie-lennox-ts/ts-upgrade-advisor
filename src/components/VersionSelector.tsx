'use client'
import { useState, useEffect } from 'react'
import { CLUSTER_VERSIONS, SDK_VERSIONS } from '@/lib/versions'
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'

interface VersionSelectorProps {
  fromVersion: string; toVersion: string; sdkVersion: string
  onFromChange: (v: string) => void; onToChange: (v: string) => void; onSdkChange: (v: string) => void
}

function isNewerVersion(a: string, b: string): boolean {
  // Returns true if a is newer than b
  const parse = (v: string) => v.replace('.cl', '').split('.').map(Number)
  const [aMaj, aMin] = parse(a)
  const [bMaj, bMin] = parse(b)
  if (aMaj !== bMaj) return aMaj > bMaj
  return aMin > bMin
}

export default function VersionSelector({ fromVersion, toVersion, sdkVersion, onFromChange, onToChange, onSdkChange }: VersionSelectorProps) {
  const [versions, setVersions] = useState(CLUSTER_VERSIONS)
  const [newVersionFound, setNewVersionFound] = useState<string | null>(null)

  useEffect(() => {
    // Fetch latest version from ThoughtSpot docs on mount
    fetch('/api/latest-version')
      .then(r => r.json())
      .then(data => {
        if (!data.latest) return
        const currentLatest = CLUSTER_VERSIONS[0].value
        if (isNewerVersion(data.latest, currentLatest)) {
          setNewVersionFound(data.latest)
          setVersions([
            { value: data.latest, label: `${data.latest} ✦ New` },
            ...CLUSTER_VERSIONS
          ])
        }
      })
      .catch(() => {}) // silently fail — hardcoded list is the fallback
  }, [])

  const fromIdx = versions.findIndex(v => v.value === fromVersion)
  const toIdx   = versions.findIndex(v => v.value === toVersion)
  const versionSpan = fromIdx !== -1 && toIdx !== -1 ? fromIdx - toIdx : 0
  const bigJump = versionSpan > 4

  const selectStyle = {
    width: '100%',
    background: 'rgba(4,209,255,0.04)',
    border: '1px solid rgba(4,209,255,0.12)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#D0E8F5',
    fontSize: '12px',
    appearance: 'none' as const,
    cursor: 'pointer',
  }

  const labelStyle = { display: 'block', fontSize: '11px', color: '#7AA8C4', marginBottom: '6px', fontWeight: '500' as const }

  return (
    <div className="ts-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Upgrade Path</h2>
        {newVersionFound && (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
               style={{ background: 'rgba(109,210,103,0.1)', border: '1px solid rgba(109,210,103,0.2)', color: '#6DD267' }}>
            <RefreshCw size={10} />
            {newVersionFound} detected from live docs
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
        <div>
          <label style={labelStyle}>From cluster version</label>
          <select value={fromVersion} onChange={e => onFromChange(e.target.value)} style={selectStyle}>
            <option value="">Select version</option>
            {versions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ paddingTop: '20px' }}>
          <ArrowRight size={14} style={{ color: '#3A5572' }} />
        </div>
        <div>
          <label style={labelStyle}>To cluster version</label>
          <select value={toVersion} onChange={e => onToChange(e.target.value)} style={selectStyle}>
            <option value="">Select version</option>
            {versions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {bigJump && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,192,82,0.08)', border: '1px solid rgba(255,192,82,0.2)' }}>
          <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#FFC052' }} />
          <p className="text-xs" style={{ color: '#FFC052' }}>Large version jump ({versionSpan} releases). The analysis will cover all intermediate breaking changes — there may be several items to address.</p>
        </div>
      )}

      <div>
        <label style={labelStyle}>
          Current SDK version
          <span style={{ color: '#3A5572', fontWeight: 400, marginLeft: 4 }}>(check your package.json)</span>
        </label>
        <select value={sdkVersion} onChange={e => onSdkChange(e.target.value)} style={selectStyle}>
          <option value="">Unknown / not sure</option>
          {SDK_VERSIONS.map(v => <option key={v} value={v}>v{v}</option>)}
        </select>
        <p className="text-xs mt-2" style={{ color: '#3A5572' }}>
          SDK version recommendations are sourced from live ThoughtSpot documentation during analysis — not from this tool.
        </p>
      </div>
    </div>
  )
}
