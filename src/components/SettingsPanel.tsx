'use client'
import { useState, useEffect } from 'react'
import { Key, X, Eye, EyeOff, CheckCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean; onClose: () => void; apiKey: string; onApiKeyChange: (key: string) => void
}

export default function SettingsPanel({ isOpen, onClose, apiKey, onApiKeyChange }: SettingsPanelProps) {
  const [localKey, setLocalKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => { setLocalKey(apiKey) }, [apiKey])

  const handleSave = () => {
    onApiKeyChange(localKey)
    localStorage.setItem('ts_advisor_api_key', localKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleClear = () => {
    setLocalKey('')
    onApiKeyChange('')
    localStorage.removeItem('ts_advisor_api_key')
  }

  const isValid = localKey.startsWith('sk-ant-')
  const isConnected = apiKey.startsWith('sk-ant-')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(8,6,43,0.85)' }} onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 p-6 animate-fadeIn ts-card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: isConnected ? 'rgba(109,210,103,0.1)' : 'rgba(4,209,255,0.1)', border: `1px solid ${isConnected ? 'rgba(109,210,103,0.25)' : 'rgba(4,209,255,0.2)'}` }}>
              <Key size={15} style={{ color: isConnected ? '#6DD267' : '#04D1FF' }} />
            </div>
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} style={{ color: '#3A5572' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D0E8F5'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3A5572'}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Connected status banner */}
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg animate-fadeIn"
                 style={{ background: 'rgba(109,210,103,0.08)', border: '1px solid rgba(109,210,103,0.2)' }}>
              <CheckCircle size={14} style={{ color: '#6DD267' }} />
              <p className="text-sm font-medium" style={{ color: '#6DD267' }}>Connected — ready to analyse</p>
            </div>
          )}

          {/* API key input */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">Anthropic API Key</label>
            <p className="text-xs mb-3" style={{ color: '#7AA8C4' }}>
              Stored only in your browser. Sent directly to Anthropic — never logged or stored by this service.
            </p>
            <div className="relative">
              <input type={showKey ? 'text' : 'password'} value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full px-4 py-3 pr-12 text-sm font-mono focus:outline-none"
                style={{ background: 'rgba(4,209,255,0.04)', border: '1px solid rgba(4,209,255,0.15)', borderRadius: '8px', color: '#D0E8F5' }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.4)'}
                onBlur={e => (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.15)'}
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#3A5572' }}>
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Validation indicator */}
          {localKey && !isValid && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                 style={{ background: 'rgba(255,192,82,0.08)', color: '#FFC052', border: '1px solid rgba(255,192,82,0.2)' }}>
              <AlertCircle size={12} /> Key should start with sk-ant-api03-
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={handleSave}
              className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #04D1FF, #714BFB)', color: 'white' }}>
              {saved ? <><CheckCircle size={13} /> Saved!</> : 'Save Key'}
            </button>
            {localKey && (
              <button onClick={handleClear} className="py-2.5 px-4 text-sm rounded-lg transition-colors"
                style={{ border: '1px solid rgba(255,192,82,0.2)', color: '#FFC052', background: 'transparent' }}>
                Clear
              </button>
            )}
          </div>

          {/* Don't have a key? */}
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(4,209,255,0.1)' }}>
            <button onClick={() => setHelpOpen(!helpOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
              style={{ background: 'rgba(4,209,255,0.04)', color: '#7AA8C4' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D0E8F5'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#7AA8C4'}>
              <span>Don't have an API key?</span>
              {helpOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {helpOpen && (
              <div className="px-4 py-4 space-y-4 animate-fadeIn" style={{ borderTop: '1px solid rgba(4,209,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>

                {/* Company key */}
                <div>
                  <p className="text-xs font-semibold text-white mb-1.5">Using a company Anthropic account?</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#7AA8C4' }}>
                    Ask your IT admin or Anthropic workspace owner for an API key. If you have console access, visit{' '}
                    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                       style={{ color: '#04D1FF' }}>console.anthropic.com</a>
                    {' '}→ Settings → API Keys → Create Key.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                {/* Personal key */}
                <div>
                  <p className="text-xs font-semibold text-white mb-1.5">Setting up a personal key?</p>
                  <div className="space-y-1.5">
                    {[
                      'Go to console.anthropic.com → click Individual',
                      'Sign up with any email address',
                      'Settings → API Keys → Create Key',
                      'Copy the key — it starts with sk-ant-api03-',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs" style={{ color: '#7AA8C4' }}>
                        <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium mt-0.5"
                              style={{ background: 'rgba(4,209,255,0.15)', color: '#04D1FF' }}>{i + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(4,209,255,0.06)', color: '#7AA8C4', border: '1px solid rgba(4,209,255,0.1)' }}>
                    ~$0.003 per analysis · $5 free credit = ~1,600 analyses · your key never leaves your browser
                  </div>
                </div>

                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium transition-colors"
                   style={{ background: 'rgba(4,209,255,0.1)', border: '1px solid rgba(4,209,255,0.2)', color: '#04D1FF' }}>
                  Open Anthropic Console <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
