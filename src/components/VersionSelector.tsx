'use client'
import { CLUSTER_VERSIONS, SDK_VERSIONS } from '@/lib/versions'
import { ArrowRight, AlertTriangle } from 'lucide-react'

interface VersionSelectorProps {
  fromVersion: string; toVersion: string; sdkVersion: string
  onFromChange: (v: string) => void; onToChange: (v: string) => void; onSdkChange: (v: string) => void
}

export default function VersionSelector({ fromVersion, toVersion, sdkVersion, onFromChange, onToChange, onSdkChange }: VersionSelectorProps) {
  const fromIdx = CLUSTER_VERSIONS.findIndex(v => v.value === fromVersion)
  const toIdx   = CLUSTER_VERSIONS.findIndex(v => v.value === toVersion)
  const versionSpan = fromIdx !== -1 && toIdx !== -1 ? fromIdx - toIdx : 0
  const bigJump = versionSpan > 4
  const targetCluster = CLUSTER_VERSIONS.find(v => v.value === toVersion)
  const sdkBehind = targetCluster && sdkVersion && sdkVersion < targetCluster.sdkRecommended

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
      <h2 className="text-sm font-semibold text-white">Upgrade Path</h2>

      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
        <div>
          <label style={labelStyle}>From cluster version</label>
          <select value={fromVersion} onChange={e => onFromChange(e.target.value)} style={selectStyle}>
            <option value="">Select version</option>
            {CLUSTER_VERSIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ paddingTop: '20px' }}>
          <ArrowRight size={14} style={{ color: '#3A5572' }} />
        </div>
        <div>
          <label style={labelStyle}>To cluster version</label>
          <select value={toVersion} onChange={e => onToChange(e.target.value)} style={selectStyle}>
            <option value="">Select version</option>
            {CLUSTER_VERSIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {bigJump && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,192,82,0.08)', border: '1px solid rgba(255,192,82,0.2)' }}>
          <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#FFC052' }} />
          <p className="text-xs" style={{ color: '#FFC052' }}>Large version jump ({versionSpan} releases). Analysis will cover all intermediate breaking changes.</p>
        </div>
      )}

      <div>
        <label style={labelStyle}>Current SDK version <span style={{ color: '#3A5572', fontWeight: 400 }}>(check your package.json)</span></label>
        <div className="flex gap-2">
          <select value={sdkVersion} onChange={e => onSdkChange(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
            <option value="">Unknown / not sure</option>
            {SDK_VERSIONS.map(v => <option key={v} value={v}>v{v}</option>)}
          </select>
          {targetCluster && (
            <div className="flex items-center px-3 py-2 rounded-lg text-xs whitespace-nowrap"
                 style={{ background: 'rgba(4,209,255,0.06)', border: '1px solid rgba(4,209,255,0.12)', color: '#7AA8C4' }}>
              Recommended: <span style={{ color: '#04D1FF', fontWeight: 600, marginLeft: 4 }}>v{targetCluster.sdkRecommended}</span>
            </div>
          )}
        </div>
        {sdkBehind && targetCluster && (
          <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: '#FFC052' }}>
            <AlertTriangle size={11} /> SDK v{sdkVersion} is behind recommended v{targetCluster.sdkRecommended} for {toVersion}
          </p>
        )}
      </div>
    </div>
  )
}
