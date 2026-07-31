'use client'
import { useState, useRef } from 'react'
import { Code2, Upload, Github, X, FileCode, CheckCircle } from 'lucide-react'

type InputMode = 'paste' | 'file' | 'github'

interface CodeInputProps {
  code: string
  onCodeChange: (code: string) => void
  githubUrl: string
  onGithubUrlChange: (url: string) => void
}

export default function CodeInput({ code, onCodeChange, githubUrl, onGithubUrlChange }: CodeInputProps) {
  const [mode, setMode] = useState<InputMode>('paste')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError(null)

    const validExts = ['.js', '.ts', '.jsx', '.tsx', '.mjs']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validExts.includes(ext)) {
      setFileError('Please upload a .js, .ts, .jsx, or .tsx file')
      return
    }
    if (file.size > 500_000) {
      setFileError('File too large — max 500KB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      onCodeChange(ev.target?.result as string)
      setFileName(file.name)
    }
    reader.readAsText(file)
  }

  const tabs: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'paste', label: 'Paste code', icon: <Code2 size={14} /> },
    { id: 'file', label: 'Upload file', icon: <Upload size={14} /> },
    { id: 'github', label: 'GitHub URL', icon: <Github size={14} /> },
  ]

  return (
    <div className="ts-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Your Embed Code</h2>
        <div className="flex bg-ts-gray-800 rounded-lg p-1 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                mode === tab.id
                  ? 'bg-ts-blue text-white shadow-sm'
                  : 'text-ts-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Paste mode */}
      {mode === 'paste' && (
        <div className="relative">
          <textarea
            value={code}
            onChange={e => onCodeChange(e.target.value)}
            placeholder={`Paste your ThoughtSpot embed code here…\n\nExamples:\n  import { LiveboardEmbed } from '@thoughtspot/visual-embed-sdk'\n  const embed = new AppEmbed('#container', { ... })\n  init({ thoughtSpotHost: '...', authType: AuthType.TrustedAuthToken })`}
            className="w-full h-64 bg-ts-gray-800/80 border border-ts-gray-600 rounded-lg px-4 py-3
                       text-white text-sm font-mono placeholder:text-ts-gray-600 placeholder:font-sans
                       focus:outline-none focus:border-ts-blue focus:ring-1 focus:ring-ts-blue/30
                       resize-none leading-relaxed"
          />
          {code && (
            <button
              onClick={() => onCodeChange('')}
              className="absolute top-3 right-3 text-ts-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
          {code && (
            <div className="absolute bottom-3 right-3 text-xs text-ts-gray-600 font-mono">
              {code.split('\n').length} lines
            </div>
          )}
        </div>
      )}

      {/* File upload mode */}
      {mode === 'file' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".js,.ts,.jsx,.tsx,.mjs"
            onChange={handleFile}
            className="hidden"
          />
          {!fileName ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-ts-gray-600 hover:border-ts-blue 
                         rounded-lg flex flex-col items-center justify-center gap-3 
                         text-ts-gray-400 hover:text-white transition-all group"
            >
              <Upload size={24} className="group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload your embed file</p>
                <p className="text-xs text-ts-gray-500 mt-1">.js .ts .jsx .tsx — max 500KB</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-ts-gray-800/80 border border-ts-green/30 
                            rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-ts-green" />
                <div>
                  <p className="text-sm font-medium text-white">{fileName}</p>
                  <p className="text-xs text-ts-gray-400">{code.split('\n').length} lines loaded</p>
                </div>
              </div>
              <button
                onClick={() => { setFileName(null); onCodeChange(''); if (fileRef.current) fileRef.current.value = '' }}
                className="text-ts-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {fileError && (
            <p className="mt-2 text-xs text-red-400">{fileError}</p>
          )}
          <p className="mt-3 text-xs text-ts-gray-500">
            Tip: Upload your main embed initialisation file — the one containing <code className="text-ts-gray-300">init()</code> and your embed component configs.
          </p>
        </div>
      )}

      {/* GitHub URL mode */}
      {mode === 'github' && (
        <div className="space-y-3">
          <div className="relative">
            <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-gray-500" />
            <input
              type="url"
              value={githubUrl}
              onChange={e => onGithubUrlChange(e.target.value)}
              placeholder="https://github.com/your-org/repo/blob/main/src/embed.ts"
              className="w-full bg-ts-gray-800/80 border border-ts-gray-600 rounded-lg pl-9 pr-4 py-3
                         text-white text-sm placeholder:text-ts-gray-600
                         focus:outline-none focus:border-ts-blue focus:ring-1 focus:ring-ts-blue/30"
            />
            {githubUrl && (
              <button
                onClick={() => onGithubUrlChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ts-gray-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="bg-ts-gray-800/50 border border-ts-gray-700 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-ts-gray-300">Supported URL formats</p>
            <div className="space-y-1">
              {[
                'https://github.com/org/repo/blob/main/src/embed.ts',
                'https://github.com/org/repo/blob/main/src/tsInit.js',
              ].map(example => (
                <button
                  key={example}
                  onClick={() => onGithubUrlChange(example)}
                  className="block w-full text-left text-xs font-mono text-ts-gray-500 hover:text-ts-gray-300 
                             truncate transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-ts-gray-500">
            The file is fetched fresh on each analysis run — always reflects your latest commit. 
            Works with public repos and any branch.
          </p>
          {githubUrl && (
            <div className="flex items-center gap-2 text-xs text-ts-blue">
              <FileCode size={12} />
              Will fetch: {githubUrl.replace('https://github.com/', '').replace('/blob/', '/')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
