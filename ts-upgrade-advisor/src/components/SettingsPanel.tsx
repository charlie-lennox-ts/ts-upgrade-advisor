'use client'
import { useState, useEffect } from 'react'
import { Key, X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  onApiKeyChange: (key: string) => void
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

  const handleClear = () => {
    setLocalKey('')
    onApiKeyChange('')
    localStorage.removeItem('ts_advisor_api_key')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ts-card w-full max-w-lg mx-4 p-6 animate-fadeIn shadow-ts-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ts-blue/20 flex items-center justify-center">
              <Key size={16} className="text-ts-blue" />
            </div>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="text-ts-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* API Key section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ts-gray-300 mb-2">
              Anthropic API Key
            </label>
            <p className="text-xs text-ts-gray-400 mb-3">
              Your key is stored only in your browser (localStorage) and sent directly to the Anthropic API. 
              It is never stored on our servers.
            </p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full bg-ts-gray-700 border border-ts-gray-600 rounded-lg px-4 py-3 pr-12
                           text-white text-sm placeholder:text-ts-gray-500
                           focus:outline-none focus:border-ts-blue focus:ring-1 focus:ring-ts-blue/30
                           font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ts-gray-400 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Key status */}
          {localKey && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              localKey.startsWith('sk-ant-') 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {localKey.startsWith('sk-ant-') 
                ? <><CheckCircle size={12} /> Looks like a valid Anthropic key</>
                : <><AlertCircle size={12} /> This doesn't look like an Anthropic API key (should start with sk-ant-)</>
              }
            </div>
          )}

          <div className="text-xs text-ts-gray-500 bg-ts-gray-800/50 rounded-lg p-3 border border-ts-gray-700">
            <strong className="text-ts-gray-400">Get an API key:</strong> Visit{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer"
               className="text-ts-blue hover:underline">
              console.anthropic.com
            </a>
            {' '}→ Settings → API Keys. Analysis uses claude-sonnet-4-6 (~$0.003 per analysis).
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 bg-ts-blue hover:bg-ts-blue-dark text-white text-sm font-medium 
                         rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saved ? <><CheckCircle size={14} /> Saved!</> : 'Save Key'}
            </button>
            {localKey && (
              <button
                onClick={handleClear}
                className="py-2.5 px-4 border border-ts-gray-600 hover:border-red-500/50 
                           text-ts-gray-400 hover:text-red-400 text-sm rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-ts-gray-700">
          <p className="text-xs text-ts-gray-500">
            <strong className="text-ts-gray-400">Data privacy:</strong> Your embed code is sent directly 
            to Anthropic's API using your key. ThoughtSpot Upgrade Advisor does not log, store, or 
            transmit your code to any other service.
          </p>
        </div>
      </div>
    </div>
  )
}
