'use client'
import { useState, useEffect } from 'react'
import { CLUSTER_VERSIONS, SDK_VERSIONS } from '@/lib/versions'
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'

interface VersionSelectorProps {
  fromVersion: string; toVersion: string; sdkVersion: string
  onFromChange: (v: string) => void; onToChange: (v: string) => void; onSdkChange: (v: string) => void
}

function isNewerCluster(a: string, b: string): boolean {
  const parse = (v: string) => v.replace('.cl', '').split('.').map(Number)
  const [aMaj, aMin] = parse(a)
  const [bMaj, bMin] = parse(b)
  if (aMaj !== bMaj) return aMaj > bMaj
  return aMin > bMin
}

function isNewerSdk(a: string, b: string): boolean {
  const parseMinor = (v: string) => parseFloat(v.replace('1.', '').replace('.x', '.0').replace(/^(\d+)\..*/, '$1'))
  return parseMinor(a) > parseMinor(b)
}

export default function VersionSelector({ fromVersion, toVersion, sdkVersion, onFromChange, onToChange, onSdkChange }: VersionSelectorProps) {
  const [clusterVersions, setClusterVersions] = useState(CLUSTER_VERSIONS)
  const [sdkVersions, setSdkVersions] = useState(SDK_VERSIONS)
  const [newClusterFound, setNewClusterFound] = useState<string | null>(null)
  const [newSdkFound, setNewSdkFound] = useState<string | null>(null)

  useEffect(() => {
    // Auto-detect latest cluster version
    fetch('/api/latest-version')
      .then(r => r.json())
      .then(data => {
        if (!data.latest) return
        const currentLatest = CLUSTER_VERSIONS[0].value
        if (isNewerCluster(data.latest, currentLatest)) {
          setNewClusterFound(data.latest)
          setClusterVersions([
            { value: data.latest, label: `${data.latest} ✦ New` },
            ...CLUSTER_VERSIONS
          ])
        }
      })
      .catch(() => {})

    // Auto-detect latest SDK version
    fetch('/api/latest-sdk-version')
      .then(r => r.json())
      .then(data => {
        if (!data.latest) return
        const currentLatest = SDK_VERSIONS[0]
        if (isNewerSdk(data.latest, currentLatest)) {
          setNewSdkFound(data.latest)
          setSdkVersions([data.latest + ' ✦ New', ...SDK_VERSIONS])
        }
      })
      .catch(() => {})
  }, [])

  const fromIdx = clusterVersions.findIndex(v => v.value === fromVersion)
  const toIdx   = clusterVersions.findIndex(v => v.value === toVersion)
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
            {[newClusterFound, newSdkFound].filter(Boolean).join(' · ')} detected
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
            {clusterVersions.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
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
          {sdkVersions.map(v => <option key={v} value={v}>v{v}</option>)}
        </select>
        <p className="text-xs mt-2" style={{ color: '#3A5572' }}>
          SDK version recommendations are sourced from live ThoughtSpot documentation during analysis — not from this tool.
        </p>
      </div>
    </div>
  )
}
