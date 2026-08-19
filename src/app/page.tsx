'use client'
import { useState, useEffect } from 'react'
import { Settings, Zap, AlertCircle, Loader2, Edit2, AlertTriangle } from 'lucide-react'
import SettingsPanel from '@/components/SettingsPanel'
import CodeInput from '@/components/CodeInput'
import VersionSelector from '@/components/VersionSelector'
import AnalysisResults from '@/components/AnalysisResults'
import { SDK_VERSIONS } from '@/lib/versions'

function detectEmbedType(code: string): string | null {
  if (/new\s+AppEmbed\s*\(/.test(code)) return 'AppEmbed'
  if (/new\s+LiveboardEmbed\s*\(/.test(code)) return 'LiveboardEmbed'
  if (/new\s+SpotterEmbed\s*\(/.test(code)) return 'SpotterEmbed'
  if (/new\s+SearchEmbed\s*\(/.test(code)) return 'SearchEmbed'
  if (/new\s+SageEmbed\s*\(/.test(code)) return 'SageEmbed'
  return null
}

interface CodeScore {
  pass: boolean
  detected: string[]
  missing: string[]
  tips: string[]
}

function scoreCode(code: string): CodeScore {
  const detected: string[] = []
  const missing: string[] = []
  const tips: string[] = []

  const hasInit = /init\s*\(/.test(code)
  const hasEmbed = /new\s+(AppEmbed|LiveboardEmbed|SpotterEmbed|SearchEmbed|SageEmbed)\s*\(/.test(code)
  const hasConfig = /authType\s*:|customizations\s*:|frameParams\s*:|liveboardId\s*:|pageId\s*:/.test(code)
  const hasCSS = /--ts-var-/.test(code)
  const hasActions = /Action\.|disabledActions|visibleActions|hiddenActions/.test(code)
  const isOnlyPackageJson = code.includes('"dependencies"') && !hasInit && !hasEmbed

  if (isOnlyPackageJson) {
    detected.push('package.json (SDK version detected)')
    missing.push('Embed initialisation code')
    tips.push('Add your embed file — the one containing init() and your component setup')
    tips.push('The SDK version has been detected but without embed code the analysis will be generic')
    return { pass: false, detected, missing, tips }
  }

  if (hasInit) detected.push('init() call found')
  else { missing.push('init() call'); tips.push('Include your ThoughtSpot init() configuration — authType, thoughtSpotHost, customizations') }

  if (hasEmbed) detected.push('Embed component instantiation found')
  else { missing.push('Embed component (AppEmbed, LiveboardEmbed etc)'); tips.push('Include the file where you instantiate your embed component with new LiveboardEmbed() or similar') }

  if (hasConfig) detected.push('Config properties found')
  else tips.push('Include component config options (liveboardId, frameParams, authType etc) for more specific findings')

  if (hasCSS) detected.push('CSS variables found — white-label analysis will be included')
  else tips.push('If you use custom CSS variables (--ts-var-*), include them for CSS impact analysis')

  if (hasActions) detected.push('Action enum usage found')

  const score = (hasInit ? 1 : 0) + (hasEmbed ? 1 : 0) + (hasConfig ? 1 : 0)
  const pass = score >= 2

  return { pass, detected, missing, tips }
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
  const [showHomeConfirm, setShowHomeConfirm] = useState(false)
  const [codeWarning, setCodeWarning] = useState<CodeScore | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('ts_advisor_api_key')
    if (stored) setApiKey(stored)
  }, [])

  const canAnalyze = (code.trim() || githubUrl.trim()) && fromVersion && toVersion && apiKey

  const handleLogoClick = () => {
    if (analysis || emailDraft) setShowHomeConfirm(true)
  }

  const handleHomeConfirm = () => {
    setAnalysis(null)
    setEmailDraft(null)
    setInputsCollapsed(false)
    setError(null)
    setShowHomeConfirm(false)
  }

  const handleAnalyzeClick = () => {
    if (!canAnalyze) return
    // Only check pasted/uploaded code — skip check for GitHub URL
    if (code.trim() && !githubUrl.trim()) {
      const score = scoreCode(code)
      if (!score.pass) {
        setCodeWarning(score)
        return
      }
    }
    runAnalysis()
  }

  const runAnalysis = async () => {
    setCodeWarning(null)
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

      {/* Home confirmation modal */}
      {showHomeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(8,6,43,0.85)' }}
               onClick={() => setShowHomeConfirm(false)} />
          <div className="relative ts-card p-6 max-w-sm mx-4 animate-fadeIn"
               style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 className="text-base font-semibold text-white mb-2">Start over?</h3>
            <p className="text-sm mb-5" style={{ color: '#7AA8C4' }}>
              This will clear your current analysis and email draft. Your embed code and version selections will stay.
            </p>
            <div className="flex gap-3">
              <button onClick={handleHomeConfirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #04D1FF, #714BFB)' }}>
                Yes, start over
              </button>
              <button onClick={() => setShowHomeConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm"
                style={{ border: '1px solid rgba(4,209,255,0.2)', color: '#7AA8C4' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code quality warning modal */}
      {codeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(8,6,43,0.85)' }}
               onClick={() => setCodeWarning(null)} />
          <div className="relative ts-card p-6 max-w-md mx-4 animate-fadeIn"
               style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,192,82,0.2)' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: 'rgba(255,192,82,0.15)', border: '1px solid rgba(255,192,82,0.25)' }}>
                <AlertTriangle size={15} style={{ color: '#FFC052' }} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Your code looks minimal</h3>
                <p className="text-xs mt-1" style={{ color: '#7AA8C4' }}>
                  The analysis will be less specific than it could be. For best results, include your full embed implementation.
                </p>
              </div>
            </div>

            {codeWarning.detected.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium mb-1.5" style={{ color: '#6DD267' }}>What we found:</p>
                <ul className="space-y-1">
                  {codeWarning.detected.map((d, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#7AA8C4' }}>
                      <span style={{ color: '#6DD267' }}>✓</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {codeWarning.tips.length > 0 && (
              <div className="rounded-lg p-3 mb-4 space-y-1.5"
                   style={{ background: 'rgba(255,192,82,0.06)', border: '1px solid rgba(255,192,82,0.15)' }}>
                <p className="text-xs font-medium" style={{ color: '#FFC052' }}>To improve your analysis, add:</p>
                {codeWarning.tips.map((tip, i) => (
                  <p key={i} className="text-xs flex items-start gap-2" style={{ color: '#7AA8C4' }}>
                    <span style={{ color: '#FFC052', marginTop: 1 }}>·</span> {tip}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setCodeWarning(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #04D1FF, #714BFB)' }}>
                Improve my code
              </button>
              <button onClick={runAnalysis}
                className="flex-1 py-2.5 rounded-lg text-sm transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#7AA8C4' }}>
                Analyse anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: '#0F2044', borderBottom: '1px solid rgba(4,209,255,0.1)' }} className="sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={handleLogoClick} className="flex items-center gap-3 transition-opacity hover:opacity-80">
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
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => setSettingsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all"
              style={apiKey
                ? { borderColor: 'rgba(109,210,103,0.3)', background: 'rgba(109,210,103,0.08)', color: '#6DD267' }
                : { borderColor: 'rgba(255,192,82,0.4)', background: 'rgba(255,192,82,0.1)', color: '#FFC052' }
              }>
              <div className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-[#6DD267] animate-pulse' : 'bg-[#FFC052]'}`} />
              {apiKey ? 'Connected' : 'Add API key'}
            </button>
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
              <button onClick={handleAnalyzeClick} disabled={!canAnalyze || loading}
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
                    { done: !hasNoApiKey,   label: 'Set your Anthropic API key in Settings' },
                    { done: !hasNoCode,     label: 'Add your embed code (paste, upload, or GitHub URL)' },
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
        )}

        {/* Loading */}
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

        {/* STEP 2 — Results */}
        {analysis && !loading && (
          <AnalysisResults analysis={analysis} fromVersion={fromVersion} toVersion={toVersion} />
        )}

        {/* STEP 3 — Email */}
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

        {emailDraft && (
          <EmailDraftCard email={emailDraft} onRegenerate={handleGenerateEmail} emailLoading={emailLoading} />
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-5 py-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(4,209,255,0.06)', marginTop: '2rem' }}>
        <p className="text-xs" style={{ color: '#3A5572' }}>
          Analysis powered by live ThoughtSpot docs · Your code is never stored
        </p>
        <a href="/how-it-works" className="text-xs hover:underline transition-colors" style={{ color: '#7AA8C4' }}>
          How it works & privacy →
        </a>
      </footer>

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
