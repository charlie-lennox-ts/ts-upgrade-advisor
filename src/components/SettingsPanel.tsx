'use client'
import { useState, useEffect } from 'react'
import { Key, X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean; onClose: () => void; apiKey: string; onApiKeyChange: (key: string) => void
}

export default function SettingsPanel({ isOpen, onClose, apiKey, onApiKeyChange }: SettingsPanelProps) {
  const [localKey, setLocalKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setLocalKey(apiKey) }, [apiKey])

  const handleSave = () => {
    onApiKeyChange(localKey)
    localStorage.setItem('ts_advisor_api_key', localKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(8,6,43,0.8)' }} onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 p-6 animate-fadeIn ts-card" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(4,209,255,0.1)', border: '1px solid rgba(4,209,255,0.2)' }}>
              <Key size={15} style={{ color: '#04D1FF' }} />
            </div>
            <h2 className="text-base font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} style={{ color: '#3A5572' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D0E8F5'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3A5572'}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Anthropic API Key</label>
            <p className="text-xs mb-3" style={{ color: '#7AA8C4' }}>
              Stored only in your browser. Sent directly to Anthropic — never logged by this service.
            </p>
            <div className="relative">
              <input type={showKey ? 'text' : 'password'} value={localKey} onChange={e => setLocalKey(e.target.value)}
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

          {localKey && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${localKey.startsWith('sk-ant-') ? '' : ''}`}
                 style={localKey.startsWith('sk-ant-')
                   ? { background: 'rgba(109,210,103,0.08)', color: '#6DD267', border: '1px solid rgba(109,210,103,0.2)' }
                   : { background: 'rgba(255,192,82,0.08)', color: '#FFC052', border: '1px solid rgba(255,192,82,0.2)' }
                 }>
              {localKey.startsWith('sk-ant-')
                ? <><CheckCircle size={12} /> Looks like a valid Anthropic key</>
                : <><AlertCircle size={12} /> Should start with sk-ant-</>
              }
            </div>
          )}

          <div className="text-xs p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(4,209,255,0.08)', color: '#7AA8C4' }}>
            Get a key at{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#04D1FF' }}>
              console.anthropic.com
            </a>
            {' '}→ Settings → API Keys. Each analysis costs ~$0.003.
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleSave}
              className="flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ts-gradient text-white"
            >
              {saved ? <><CheckCircle size={13} /> Saved!</> : 'Save Key'}
            </button>
            {localKey && (
              <button onClick={() => { setLocalKey(''); onApiKeyChange(''); localStorage.removeItem('ts_advisor_api_key') }}
                className="py-2.5 px-4 text-sm rounded-lg transition-colors"
                style={{ border: '1px solid rgba(255,192,82,0.2)', color: '#FFC052', background: 'transparent' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
