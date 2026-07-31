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
    <div className="min-h-screen" style={{ background: '#08062B' }}>

      {/* Header */}
      <header style={{ background: '#0F2044', borderBottom: '1px solid rgba(4,209,255,0.1)' }}
              className="sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg ts-gradient flex items-center justify-center">
              <Zap size={13} className="text-white" fill="white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                TS Upgrade Advisor
              </span>
              <span className="text-xs hidden sm:inline" style={{ color: '#7AA8C4' }}>
                ThoughtSpot Embedded
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
              apiKey
                ? 'border-[rgba(109,210,103,0.3)] bg-[rgba(109,210,103,0.08)] text-[#6DD267]'
                : 'border-[rgba(255,192,82,0.3)] bg-[rgba(255,192,82,0.08)] text-[#FFC052]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-[#6DD267]' : 'bg-[#FFC052]'}`} />
              {apiKey ? 'API key set' : 'No API key'}
            </div>
            <button onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ border: '1px solid rgba(4,209,255,0.2)', color: '#7AA8C4', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#04D1FF'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,209,255,0.4)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#7AA8C4'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,209,255,0.2)' }}
            >
              <Settings size={13} /> Settings
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ borderBottom: '1px solid rgba(4,209,255,0.08)', background: 'linear-gradient(180deg, rgba(15,32,68,0.5) 0%, transparent 100%)' }}>
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="max-w-2xl">
            <div className="ts-pill mb-5">
              <Zap size={10} /> Powered by live ThoughtSpot docs
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-tight mb-3"
                style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }}>
              Know exactly what breaks{' '}
              <span className="ts-gradient-text">before you upgrade</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#7AA8C4' }}>
              Paste your embed code, select your upgrade path, and get a personalised impact report —
              covering breaking changes, deprecated SDK properties, and CSS variable impacts specific
              to <em>your</em> implementation.
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-[1fr,400px] gap-6">

          {/* Left */}
          <div className="space-y-5">
            <CodeInput code={code} onCodeChange={setCode} githubUrl={githubUrl} onGithubUrlChange={setGithubUrl} />
            <VersionSelector
              fromVersion={fromVersion} toVersion={toVersion} sdkVersion={sdkVersion}
              onFromChange={setFromVersion} onToChange={setToVersion} onSdkChange={setSdkVersion}
            />

            {/* Analyse button */}
            <div className="space-y-3">
              <button onClick={handleAnalyze} disabled={!canAnalyze || loading}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  canAnalyze && !loading ? 'ts-gradient text-white ts-cyan-glow hover:opacity-90' : 'text-white/30 cursor-not-allowed'
                }`}
                style={canAnalyze && !loading ? {} : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Analysing your embed code…</>
                  : <><Zap size={16} /> Analyse Upgrade Impact</>
                }
              </button>

              {!canAnalyze && !loading && (
                <div className="space-y-1.5">
                  {[
                    { done: !hasNoApiKey, label: 'Set your Anthropic API key in Settings' },
                    { done: !hasNoCode,   label: 'Add your embed code (paste, upload, or GitHub URL)' },
                    { done: !hasNoVersions, label: 'Select from and to cluster versions' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${item.done ? 'line-through' : ''}`}
                         style={{ color: item.done ? '#3A5572' : '#7AA8C4' }}>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.done ? 'bg-[#3A5572]' : 'bg-[#04D1FF]'}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl p-4 animate-fadeIn"
                   style={{ background: 'rgba(255,192,82,0.08)', border: '1px solid rgba(255,192,82,0.2)' }}>
                <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#FFC052' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#FFC052' }}>Analysis failed</p>
                  <p className="text-xs mt-1" style={{ color: '#7AA8C4' }}>{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div>
            {loading && (
              <div className="ts-card p-8 flex flex-col items-center justify-center text-center gap-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full ts-gradient flex items-center justify-center animate-cyan-pulse">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Fetching live docs…</p>
                  <p className="text-xs mt-1" style={{ color: '#7AA8C4' }}>SDK changelog + release notes + your code</p>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                         style={{ background: '#04D1FF', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {analysis && !loading && (
              <>
                <AnalysisResults analysis={analysis} fromVersion={fromVersion} toVersion={toVersion} />
                <button onClick={handleAnalyze}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-xs rounded-xl transition-colors"
                  style={{ border: '1px solid rgba(4,209,255,0.15)', color: '#7AA8C4' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#04D1FF'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#7AA8C4'}
                >
                  <RefreshCw size={12} /> Re-run analysis
                </button>
              </>
            )}

            {!analysis && !loading && (
              <div className="ts-card p-8 flex flex-col items-center justify-center text-center gap-4 h-64">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                     style={{ background: 'rgba(4,209,255,0.08)', border: '1px solid rgba(4,209,255,0.15)' }}>
                  <Zap size={20} style={{ color: '#04D1FF' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Analysis will appear here</p>
                  <p className="text-xs mt-1" style={{ color: '#7AA8C4' }}>
                    Fill in the details on the left and click Analyse
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} apiKey={apiKey} onApiKeyChange={setApiKey} />
    </div>
  )
}
