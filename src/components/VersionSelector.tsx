'use client'
import { useState, useEffect } from 'react'
import { CLUSTER_VERSIONS, SDK_VERSIONS } from '@/lib/versions'
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'

interface VersionSelectorProps {
  fromVersion: string; toVersion: string; sdkVersion: string
  onFromChange: (v: string) => void; onToChange: (v: string) => void; onSdkChange: (v: string) => void
}

const parseCluster = (v: string) => v.replace('.cl', '').split('.').map(n => parseInt(n, 10) || 0)
// Newest-first comparator for cluster versions like 26.10.0.cl
function compareCluster(a: string, b: string): number {
  const [x, y] = [parseCluster(a), parseCluster(b)]
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0)
  return 0
}
// SDK versions are compared on their minor number (1.52.x, 1.52.0 -> 52)
const sdkMinor = (v: string) => parseInt(v.split('.')[1], 10) || 0

export default function VersionSelector({ fromVersion, toVersion, sdkVersion, onFromChange, onToChange, onSdkChange }: VersionSelectorProps) {
  const [clusterVersions, setClusterVersions] = useState(CLUSTER_VERSIONS)
  const [sdkVersions, setSdkVersions] = useState(SDK_VERSIONS.map(v => ({ value: v, label: `v${v}` })))
  const [newClusterFound, setNewClusterFound] = useState<string | null>(null)
  const [newSdkFound, setNewSdkFound] = useState<string | null>(null)
  const [showAllTo, setShowAllTo] = useState(false)

  useEffect(() => {
    // Auto-detect cluster releases. Every release found in the docs that is missing from the
    // known list is merged in (so none are skipped); only the newest one is flagged "New".
    fetch('/api/latest-version')
      .then(r => r.json())
      .then(data => {
        const found: string[] = data.all?.length ? data.all : data.latest ? [data.latest] : []
        const known = new Set(CLUSTER_VERSIONS.map(v => v.value))
        const missing = found.filter(v => !known.has(v))
        if (missing.length === 0) return
        const topKnown = CLUSTER_VERSIONS[0].value
        const latest = [...found].sort(compareCluster)[0]
        const merged = [...CLUSTER_VERSIONS, ...missing.map(v => ({ value: v, label: v }))]
          .sort((a, b) => compareCluster(a.value, b.value))
          .map(v => v.value === latest && compareCluster(latest, topKnown) < 0
            ? { ...v, label: `${v.value} ✦ New` } : v)
        setClusterVersions(merged)
        if (compareCluster(latest, topKnown) < 0) setNewClusterFound(latest)
      })
      .catch(() => {})

    // Auto-detect SDK releases, same approach
    fetch('/api/latest-sdk-version')
      .then(r => r.json())
      .then(data => {
        const found: string[] = data.all?.length ? data.all : data.latest ? [data.latest] : []
        const knownMinors = new Set(SDK_VERSIONS.map(sdkMinor))
        const missing = found.filter(v => !knownMinors.has(sdkMinor(v)))
        if (missing.length === 0) return
        const topKnown = sdkMinor(SDK_VERSIONS[0])
        const latest = [...found].sort((a, b) => sdkMinor(b) - sdkMinor(a))[0]
        const merged = [...SDK_VERSIONS, ...missing]
          .sort((a, b) => sdkMinor(b) - sdkMinor(a))
          .map(v => ({ value: v, label: v === latest && sdkMinor(latest) > topKnown ? `v${v} ✦ New` : `v${v}` }))
        setSdkVersions(merged)
        if (sdkMinor(latest) > topKnown) setNewSdkFound(latest)
      })
      .catch(() => {})
  }, [])

  const fromIdx = clusterVersions.findIndex(v => v.value === fromVersion)
  const toIdx   = clusterVersions.findIndex(v => v.value === toVersion)

  // The list is ordered newest-first, so versions newer than "From" are those before it.
  // With no "From" selected (or the toggle on) the full list is shown.
  const toVersions = !showAllTo && fromIdx > 0 ? clusterVersions.slice(0, fromIdx) : clusterVersions
  const noNewerVersions = !showAllTo && fromIdx === 0

  // If "From" changes so the chosen "To" is no longer a valid upgrade, clear it.
  useEffect(() => {
    if (!showAllTo && fromIdx !== -1 && toVersion && toIdx !== -1 && toIdx >= fromIdx) onToChange('')
  }, [showAllTo, fromIdx, toIdx, toVersion, onToChange])
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
        {(newClusterFound || newSdkFound) && (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
               style={{ background: 'rgba(109,210,103,0.1)', border: '1px solid rgba(109,210,103,0.2)', color: '#6DD267' }}>
            <RefreshCw size={10} />
            Latest release: {[newClusterFound, newSdkFound && `SDK ${newSdkFound}`].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
        <div>
          <label style={labelStyle}>From cluster version</label>
          <select value={fromVersion} onChange={e => onFromChange(e.target.value)} style={selectStyle}>
            <option value="">Select version</option>
            {clusterVersions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ paddingTop: '20px' }}>
          <ArrowRight size={14} style={{ color: '#3A5572' }} />
        </div>
        <div>
          <label style={labelStyle}>To cluster version</label>
          <select value={toVersion} onChange={e => onToChange(e.target.value)} style={selectStyle}>
            <option value="">Select version</option>
            {toVersions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          {noNewerVersions && (
            <p className="text-xs mt-1.5" style={{ color: '#FFC052' }}>No newer versions than {fromVersion}.</p>
          )}
          {fromIdx !== -1 && (
            <button type="button" onClick={() => setShowAllTo(s => !s)}
                    className="text-xs mt-1.5 underline" style={{ color: '#7AA8C4' }}>
              {showAllTo ? 'Show upgrades only' : 'Show all versions (including downgrades)'}
            </button>
          )}
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
          {sdkVersions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
        <p className="text-xs mt-2" style={{ color: '#3A5572' }}>
          SDK version recommendations are sourced from live ThoughtSpot documentation during analysis — not from this tool.
        </p>
      </div>
    </div>
  )
}
