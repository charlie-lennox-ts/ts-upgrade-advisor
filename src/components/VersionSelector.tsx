'use client'
import { CLUSTER_VERSIONS, SDK_VERSIONS } from '@/lib/versions'
import { ArrowRight, AlertTriangle } from 'lucide-react'

interface VersionSelectorProps {
  fromVersion: string
  toVersion: string
  sdkVersion: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onSdkChange: (v: string) => void
}

export default function VersionSelector({
  fromVersion, toVersion, sdkVersion,
  onFromChange, onToChange, onSdkChange
}: VersionSelectorProps) {

  const fromIdx = CLUSTER_VERSIONS.findIndex(v => v.value === fromVersion)
  const toIdx = CLUSTER_VERSIONS.findIndex(v => v.value === toVersion)
  const versionSpan = fromIdx !== -1 && toIdx !== -1 ? fromIdx - toIdx : 0
  const bigJump = versionSpan > 4

  const targetCluster = CLUSTER_VERSIONS.find(v => v.value === toVersion)
  const sdkBehind = targetCluster && sdkVersion && 
    sdkVersion < targetCluster.sdkRecommended

  return (
    <div className="ts-card p-5 space-y-5">
      <h2 className="text-sm font-semibold text-white">Upgrade Path</h2>

      {/* Cluster versions */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
        <div>
          <label className="block text-xs text-ts-gray-400 mb-1.5 font-medium">From cluster version</label>
          <select
            value={fromVersion}
            onChange={e => onFromChange(e.target.value)}
            className="w-full bg-ts-gray-800 border border-ts-gray-600 rounded-lg px-3 py-2.5
                       text-white text-sm focus:outline-none focus:border-ts-blue appearance-none cursor-pointer"
          >
            <option value="">Select version</option>
            {CLUSTER_VERSIONS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col items-center pt-5">
          <ArrowRight size={16} className="text-ts-gray-500" />
        </div>

        <div>
          <label className="block text-xs text-ts-gray-400 mb-1.5 font-medium">To cluster version</label>
          <select
            value={toVersion}
            onChange={e => onToChange(e.target.value)}
            className="w-full bg-ts-gray-800 border border-ts-gray-600 rounded-lg px-3 py-2.5
                       text-white text-sm focus:outline-none focus:border-ts-blue appearance-none cursor-pointer"
          >
            <option value="">Select version</option>
            {CLUSTER_VERSIONS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Big jump warning */}
      {bigJump && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300">
            This is a large version jump ({versionSpan} releases). The analysis will cover all intermediate 
            deprecations and breaking changes — there may be several items to address.
          </p>
        </div>
      )}

      {/* SDK version */}
      <div>
        <label className="block text-xs text-ts-gray-400 mb-1.5 font-medium">
          Current SDK version in use
          <span className="text-ts-gray-600 font-normal ml-1">(check your package.json)</span>
        </label>
        <div className="flex gap-2">
          <select
            value={sdkVersion}
            onChange={e => onSdkChange(e.target.value)}
            className="flex-1 bg-ts-gray-800 border border-ts-gray-600 rounded-lg px-3 py-2.5
                       text-white text-sm focus:outline-none focus:border-ts-blue appearance-none cursor-pointer"
          >
            <option value="">Unknown / not sure</option>
            {SDK_VERSIONS.map(v => (
              <option key={v} value={v}>v{v}</option>
            ))}
          </select>
          {targetCluster && (
            <div className="flex items-center px-3 py-2 bg-ts-gray-800 border border-ts-gray-700 
                            rounded-lg text-xs text-ts-gray-400 whitespace-nowrap">
              Recommended: <span className="text-ts-blue font-medium ml-1">v{targetCluster.sdkRecommended}</span>
            </div>
          )}
        </div>
        {sdkBehind && targetCluster && (
          <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
            <AlertTriangle size={11} />
            SDK v{sdkVersion} is behind recommended v{targetCluster.sdkRecommended} for {toVersion}
          </p>
        )}
      </div>
    </div>
  )
}
