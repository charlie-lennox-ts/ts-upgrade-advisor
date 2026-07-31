'use client'
import { useState, useEffect } from 'react'
import { Settings, Zap, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import SettingsPanel from '@/components/SettingsPanel'
import CodeInput from '@/components/CodeInput'
import VersionSelector from '@/components/VersionSelector'
import AnalysisResults from '@/components/AnalysisResults'

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [code, setCode] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [fromVersion, setFromVersion] = useState('')
  const [toVersion, setToVersion] = useState('')
  const [sdkVersion, setSdkVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ts_advisor_api_key')
    if (stored) setApiKey(stored)
  }, [])

  const canAnalyze = (code.trim() || githubUrl.trim()) && fromVersion && toVersion && apiKey

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, githubUrl, fromVersion, toVersion, sdkVersion, apiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data.analysis)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const hasNoApiKey = !apiKey
  const hasNoCode = !code.trim() && !githubUrl.trim()
  const hasNoVersions = !fromVersion || !toVersion

  return (
    <div className="min-h-screen bg-ts-gray-900">
      {/* Header */}
      <header className="border-b border-ts-gray-700/50 bg-ts-navy/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* ThoughtSpot-style logo mark */}
            <div className="w-7 h-7 rounded-lg ts-gradient flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <div>
              <span className="font-semibold text-white text-sm">TS Upgrade Advisor</span>
              <span className="text-ts-gray-500 text-xs ml-2 hidden sm:inline">ThoughtSpot Embedded</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* API key indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              apiKey 
                ? 'text-green-400 bg-green-500/10 border-green-500/20' 
                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
              {apiKey ? 'API key set' : 'No API key'}
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ts-gray-600 
                         text-ts-gray-300 hover:text-white hover:border-ts-gray-500 text-xs transition-colors"
            >
              <Settings size={13} />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-ts-gray-700/30 bg-gradient-to-b from-ts-navy/30 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ts-blue/10 border border-ts-blue/20 text-ts-blue text-xs font-medium mb-4">
              <Zap size={11} />
              Powered by live ThoughtSpot docs
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-tight mb-3">
              Know exactly what breaks{' '}
              <span className="ts-gradient-text">before you upgrade</span>
            </h1>
            <p className="text-ts-gray-400 text-sm sm:text-base leading-relaxed">
              Paste your embed code, select your upgrade path, and get a personalised impact report — 
              covering breaking changes, deprecated SDK properties, and CSS variable impacts specific 
              to <em>your</em> implementation.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6">
          {/* Left column: inputs */}
          <div className="space-y-5">
            <CodeInput
              code={code}
              onCodeChange={setCode}
              githubUrl={githubUrl}
              onGithubUrlChange={setGithubUrl}
            />

            <VersionSelector
              fromVersion={fromVersion}
              toVersion={toVersion}
              sdkVersion={sdkVersion}
              onFromChange={setFromVersion}
              onToChange={setToVersion}
              onSdkChange={setSdkVersion}
            />

            {/* Analyse button */}
            <div className="space-y-3">
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || loading}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                  ${canAnalyze && !loading
                    ? 'ts-gradient text-white shadow-ts-glow hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]'
                    : 'bg-ts-gray-700 text-ts-gray-500 cursor-not-allowed'
                  }`}
              >
                {loading 
                  ? <><Loader2 size={16} className="animate-spin" /> Analysing your embed code…</>
                  : <><Zap size={16} /> Analyse Upgrade Impact</>
                }
              </button>

              {/* Pre-flight checklist */}
              {!canAnalyze && !loading && (
                <div className="space-y-1.5">
                  {[
                    { done: !hasNoApiKey, label: 'Set your Anthropic API key in Settings' },
                    { done: !hasNoCode, label: 'Add your embed code (paste, upload, or GitHub URL)' },
                    { done: !hasNoVersions, label: 'Select from and to cluster versions' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${item.done ? 'text-ts-gray-600 line-through' : 'text-ts-gray-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.done ? 'bg-ts-gray-600' : 'bg-ts-blue'}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fadeIn">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Analysis failed</p>
                  <p className="text-xs text-red-400/80 mt-1">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column: results */}
          <div>
            {loading && (
              <div className="ts-card p-8 flex flex-col items-center justify-center text-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full ts-gradient flex items-center justify-center animate-pulse">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Fetching live docs…</p>
                  <p className="text-xs text-ts-gray-400 mt-1">SDK changelog + release notes + your code</p>
                </div>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-ts-blue rounded-full animate-bounce"
                         style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {analysis && !loading && (
              <>
                <AnalysisResults
                  analysis={analysis}
                  fromVersion={fromVersion}
                  toVersion={toVersion}
                />
                <button
                  onClick={handleAnalyze}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-xs 
                             text-ts-gray-400 hover:text-white border border-ts-gray-700 hover:border-ts-gray-600 
                             rounded-xl transition-colors"
                >
                  <RefreshCw size={12} /> Re-run analysis
                </button>
              </>
            )}

            {!analysis && !loading && (
              <div className="ts-card p-8 flex flex-col items-center justify-center text-center gap-4 h-64">
                <div className="w-12 h-12 rounded-full bg-ts-gray-700 flex items-center justify-center">
                  <Zap size={20} className="text-ts-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ts-gray-300">Analysis will appear here</p>
                  <p className="text-xs text-ts-gray-500 mt-1">
                    Fill in the details on the left and click Analyse
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />
    </div>
  )
}
