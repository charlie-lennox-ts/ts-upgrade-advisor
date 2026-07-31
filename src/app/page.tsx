'use client'
import { useState, useEffect } from 'react'
import { Settings, Zap, AlertCircle, Loader2, ChevronDown, ChevronUp, Edit2 } from 'lucide-react'
import SettingsPanel from '@/components/SettingsPanel'
import CodeInput from '@/components/CodeInput'
import VersionSelector from '@/components/VersionSelector'
import AnalysisResults from '@/components/AnalysisResults'
import { SDK_VERSIONS } from '@/lib/versions'

function detectEmbedType(code: string): string | null {
  if (code.includes('AppEmbed')) return 'AppEmbed'
  if (code.includes('LiveboardEmbed')) return 'LiveboardEmbed'
  if (code.includes('SpotterEmbed')) return 'SpotterEmbed'
  if (code.includes('SearchEmbed')) return 'SearchEmbed'
  if (code.includes('SageEmbed')) return 'SageEmbed'
  return null
}

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [code, setCode] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [fromVersion, setFromVersion] = useState('')
  const [toVersion, setToVersion] = useState('')
  const [sdkVersion, setSdkVersion] = useState('')
  const [inputsCollapsed, setInputsCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

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
    setEmailDraft(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, githubUrl, fromVersion, toVersion, sdkVersion, apiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data.analysis)
      setInputsCollapsed(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateEmail = async () => {
    if (!analysis || !apiKey) return
    setEmailLoading(true)
    setEmailError(null)
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, fromVersion, toVersion, sdkVersion, apiKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Email generation failed')
      setEmailDraft(data.email)
    } catch (e) {
      setEmailError((e as Error).message)
    } finally {
      setEmailLoading(false)
    }
  }

  const embedType = detectEmbedType(code)
  const hasNoApiKey = !apiKey
  const hasNoCode = !code.trim() && !githubUrl.trim()
  const hasNoVersions = !fromVersion || !toVersion

  return (
    <div className="min-h-screen" style={{ background: '#08062B' }}>

      {/* Header */}
      <header style={{ background: '#0F2044', borderBottom: '1px solid rgba(4,209,255,0.1)' }} className="sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="22" height="23" viewBox="0 0 46 47" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M45.9298 0H0V8.50682H45.9298V0Z" fill="white"/>
              <path d="M45.9278 11.3438H28.4766V19.8506H45.9278V11.3438Z" fill="white"/>
              <path d="M11.1499 11.3438H0V19.8506H11.1499C15.3158 19.8506 18.7115 23.2463 18.7115 27.4122V45.9312H27.2183V27.4122C27.2183 18.5553 20.0068 11.3438 11.1499 11.3438Z" fill="white"/>
              <path d="M37.2118 32.207C33.2735 32.207 30.0703 35.4102 30.0703 39.3486C30.0703 43.2869 33.2735 46.4901 37.2118 46.4901C41.1502 46.4901 44.3534 43.2869 44.3534 39.3486C44.3534 35.4102 41.1502 32.207 37.2118 32.207Z" fill="white"/>
            </svg>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Space Grotesk' }}>ThoughtSpot</span>
                <span className="text-sm font-light" style={{ color: '#04D1FF' }}>Upgrade Advisor</span>
              </div>
              <p className="text-xs" style={{ color: '#7AA8C4', marginTop: '-1px' }}>Understand your upgrade</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
              apiKey ? 'border-[rgba(109,210,103,0.3)] bg-[rgba(109,210,103,0.08)] text-[#6DD267]'
                     : 'border-[rgba(255,192,82,0.3)] bg-[rgba(255,192,82,0.08)] text-[#FFC052]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-[#6DD267]' : 'bg-[#FFC052]'}`} />
              {apiKey ? 'API key set' : 'No API key'}
            </div>
            <button onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ border: '1px solid rgba(4,209,255,0.2)', color: '#7AA8C4' }}>
              <Settings size={13} /> Settings
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={{ borderBottom: '1px solid rgba(4,209,255,0.08)', background: 'linear-gradient(180deg, rgba(15,32,68,0.5) 0%, transparent 100%)' }}>
        <div className="max-w-4xl mx-auto px-5 py-8">
          <div className="ts-pill mb-4"><Zap size={10} /> Tailored to your implementation</div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white leading-tight mb-3" style={{ fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }}>
            Know exactly what breaks <span className="ts-gradient-text">before you upgrade</span>
          </h1>
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: '#7AA8C4' }}>
            Paste your embed code, select your upgrade path, and get a personalised impact report — covering breaking changes, deprecated SDK properties, and CSS variable impacts specific to <em>your</em> implementation.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 py-8 space-y-5">

        {/* STEP 1 — Inputs */}
        {inputsCollapsed ? (
          /* Collapsed summary bar */
          <div className="ts-card px-5 py-3 flex items-center justify-between"
               style={{ border: '1px solid rgba(4,209,255,0.2)' }}>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {embedType && (
                <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(4,209,255,0.1)', color: '#04D1FF' }}>
                  {embedType}
                </span>
              )}
              {sdkVersion && <span style={{ color: '#7AA8C4' }}>SDK {sdkVersion}</span>}
              {sdkVersion && (fromVersion || toVersion) && <span style={{ color: '#3A5572' }}>·</span>}
              {fromVersion && <span style={{ color: '#D0E8F5' }}>{fromVersion}</span>}
              {fromVersion && toVersion && <span style={{ color: '#3A5572' }}>→</span>}
              {toVersion && <span style={{ color: '#04D1FF' }}>{toVersion}</span>}
            </div>
            <button onClick={() => setInputsCollapsed(false)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid rgba(4,209,255,0.2)', color: '#7AA8C4' }}>
              <Edit2 size={12} /> Edit
            </button>
          </div>
        ) : (
          /* Expanded inputs */
          <div className="space-y-5">
            <CodeInput code={code} onCodeChange={setCode} githubUrl={githubUrl} onGithubUrlChange={setGithubUrl}
              onSdkDetected={(v) => {
                const major = v.split('.').slice(0,2).join('.')
                const match = SDK_VERSIONS.find(sv => sv.startsWith(major))
                setSdkVersion(match || v)
              }}
            />
            <VersionSelector fromVersion={fromVersion} toVersion={toVersion} sdkVersion={sdkVersion}
              onFromChange={setFromVersion} onToChange={setToVersion} onSdkChange={setSdkVersion} />

            <div className="space-y-3">
              <button onClick={handleAnalyze} disabled={!canAnalyze || loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={canAnalyze && !loading
                  ? { background: 'linear-gradient(135deg, #04D1FF, #714BFB)', color: 'white', boxShadow: '0 0 20px rgba(4,209,255,0.2)' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
                }>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing your embed code…</> : <><Zap size={16} /> Analyse Upgrade Impact</>}
              </button>

              {!canAnalyze && !loading && (
                <div className="space-y-1.5">
                  {[
                    { done: !hasNoApiKey,    label: 'Set your Anthropic API key in Settings' },
                    { done: !hasNoCode,      label: 'Add your embed code (paste, upload, or GitHub URL)' },
                    { done: !hasNoVersions,  label: 'Select from and to cluster versions' },
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
        )}

        {/* Loading state */}
        {loading && (
          <div className="ts-card p-10 flex flex-col items-center justify-center text-center gap-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-full flex items-center justify-center animate-cyan-pulse"
                 style={{ background: 'linear-gradient(135deg, #04D1FF, #714BFB)' }}>
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Fetching live docs and analysing your code…</p>
              <p className="text-xs mt-1" style={{ color: '#7AA8C4' }}>SDK changelog · release notes · your implementation</p>
            </div>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                     style={{ background: '#04D1FF', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Analysis results */}
        {analysis && !loading && (
          <AnalysisResults analysis={analysis} fromVersion={fromVersion} toVersion={toVersion} />
        )}

        {/* STEP 3 — Generate email */}
        {analysis && !loading && !emailDraft && (
          <div className="ts-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Generate upgrade email</h3>
                <p className="text-xs mt-1" style={{ color: '#7AA8C4' }}>
                  Draft a ready-to-send email for your dev team based on the analysis above
                </p>
              </div>
              <button onClick={handleGenerateEmail} disabled={emailLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0"
                style={{ background: 'rgba(113,75,251,0.15)', border: '1px solid rgba(113,75,251,0.3)', color: '#A78BFA' }}>
                {emailLoading ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : <><Zap size={14} /> Generate email</>}
              </button>
            </div>
            {emailError && <p className="mt-3 text-xs" style={{ color: '#FFC052' }}>{emailError}</p>}
          </div>
        )}

        {/* Email draft */}
        {emailDraft && (
          <EmailDraftCard email={emailDraft} onRegenerate={handleGenerateEmail} emailLoading={emailLoading} />
        )}

      </main>

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} apiKey={apiKey} onApiKeyChange={setApiKey} />
    </div>
  )
}

function EmailDraftCard({ email, onRegenerate, emailLoading }: { email: { subject: string; body: string }; onRegenerate: () => void; emailLoading: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ts-card p-5 animate-fadeIn space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Upgrade email draft</h3>
        <div className="flex gap-2">
          <button onClick={onRegenerate} disabled={emailLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
            style={{ border: '1px solid rgba(4,209,255,0.2)', color: '#7AA8C4' }}>
            {emailLoading ? <Loader2 size={12} className="animate-spin" /> : '↺'} Regenerate
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium"
            style={{ background: copied ? 'rgba(109,210,103,0.15)' : 'rgba(113,75,251,0.15)', border: `1px solid ${copied ? 'rgba(109,210,103,0.3)' : 'rgba(113,75,251,0.3)'}`, color: copied ? '#6DD267' : '#A78BFA' }}>
            {copied ? '✓ Copied!' : '⎘ Copy to clipboard'}
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(4,209,255,0.1)' }}>
        <div className="px-4 py-3" style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(4,209,255,0.08)' }}>
          <span className="text-xs font-medium uppercase tracking-wide mr-3" style={{ color: '#3A5572' }}>Subject</span>
          <span className="text-sm text-white">{email.subject}</span>
        </div>
        <div className="px-4 py-4" style={{ background: 'rgba(4,209,255,0.02)' }}>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#D0E8F5', fontFamily: 'inherit' }}>
            {email.body}
          </pre>
        </div>
      </div>
    </div>
  )
}
