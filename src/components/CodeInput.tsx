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
    if (!validExts.includes(ext)) { setFileError('Please upload a .js, .ts, .jsx, or .tsx file'); return }
    if (file.size > 500_000) { setFileError('File too large — max 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => { onCodeChange(ev.target?.result as string); setFileName(file.name) }
    reader.readAsText(file)
  }

  const tabs: { id: InputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'paste',  label: 'Paste code',  icon: <Code2 size={13} /> },
    { id: 'file',   label: 'Upload file', icon: <Upload size={13} /> },
    { id: 'github', label: 'GitHub URL',  icon: <Github size={13} /> },
  ]

  const inputStyle = {
    background: 'rgba(4,209,255,0.04)',
    border: '1px solid rgba(4,209,255,0.12)',
    borderRadius: '8px',
    color: '#D0E8F5',
  }

  return (
    <div className="ts-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Your Embed Code</h2>
        <div className="flex rounded-lg p-1 gap-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={mode === tab.id
                ? { background: 'rgba(4,209,255,0.15)', color: '#04D1FF', border: '1px solid rgba(4,209,255,0.25)' }
                : { color: '#7AA8C4', border: '1px solid transparent' }
              }
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'paste' && (
        <div className="relative">
          <textarea value={code} onChange={e => onCodeChange(e.target.value)}
            placeholder={`Paste your ThoughtSpot embed code here…\n\nExamples:\n  import { LiveboardEmbed } from '@thoughtspot/visual-embed-sdk'\n  const embed = new AppEmbed('#container', { ... })\n  init({ thoughtSpotHost: '...', authType: AuthType.TrustedAuthToken })`}
            className="w-full h-64 px-4 py-3 text-sm font-mono resize-none leading-relaxed focus:outline-none"
            style={{ ...inputStyle, caretColor: '#04D1FF' }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.35)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(4,209,255,0.06)' }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.12)'; (e.target as HTMLElement).style.boxShadow = 'none' }}
          />
          {code && <button onClick={() => onCodeChange('')} className="absolute top-3 right-3 transition-colors" style={{ color: '#3A5572' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#04D1FF'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3A5572'}><X size={14} /></button>}
          {code && <div className="absolute bottom-3 right-3 text-xs font-mono" style={{ color: '#3A5572' }}>{code.split('\n').length} lines</div>}
        </div>
      )}

      {mode === 'file' && (
        <div>
          <input ref={fileRef} type="file" accept=".js,.ts,.jsx,.tsx,.mjs" onChange={handleFile} className="hidden" />
          {!fileName ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-40 flex flex-col items-center justify-center gap-3 rounded-lg transition-all group"
              style={{ border: '2px dashed rgba(4,209,255,0.15)', color: '#7AA8C4' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,209,255,0.4)'; (e.currentTarget as HTMLElement).style.color = '#04D1FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,209,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#7AA8C4' }}
            >
              <Upload size={24} />
              <div className="text-center">
                <p className="text-sm font-medium">Click to upload your embed file</p>
                <p className="text-xs mt-1" style={{ color: '#3A5572' }}>.js .ts .jsx .tsx — max 500KB</p>
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(109,210,103,0.08)', border: '1px solid rgba(109,210,103,0.2)' }}>
              <div className="flex items-center gap-3">
                <CheckCircle size={16} style={{ color: '#6DD267' }} />
                <div>
                  <p className="text-sm font-medium text-white">{fileName}</p>
                  <p className="text-xs" style={{ color: '#7AA8C4' }}>{code.split('\n').length} lines loaded</p>
                </div>
              </div>
              <button onClick={() => { setFileName(null); onCodeChange(''); if (fileRef.current) fileRef.current.value = '' }} style={{ color: '#3A5572' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFC052'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#3A5572'}><X size={16} /></button>
            </div>
          )}
          {fileError && <p className="mt-2 text-xs" style={{ color: '#FFC052' }}>{fileError}</p>}
        </div>
      )}

      {mode === 'github' && (
        <div className="space-y-3">
          <div className="relative">
            <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#3A5572' }} />
            <input type="url" value={githubUrl} onChange={e => onGithubUrlChange(e.target.value)}
              placeholder="https://github.com/your-org/repo/blob/main/src/embed.ts"
              className="w-full pl-9 pr-10 py-3 text-sm focus:outline-none"
              style={inputStyle}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.35)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(4,209,255,0.06)' }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.12)'; (e.target as HTMLElement).style.boxShadow = 'none' }}
            />
            {githubUrl && <button onClick={() => onGithubUrlChange('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#3A5572' }}><X size={14} /></button>}
          </div>
          <div className="p-3 rounded-lg space-y-1.5" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(4,209,255,0.08)' }}>
            <p className="text-xs font-medium" style={{ color: '#7AA8C4' }}>Fetched fresh on every analysis run</p>
            <p className="text-xs" style={{ color: '#3A5572' }}>Works with public repos on any branch. Paste a github.com file URL — we convert it to raw automatically.</p>
          </div>
          {githubUrl && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#04D1FF' }}>
              <FileCode size={12} />
              {githubUrl.replace('https://github.com/', '').replace('/blob/', '/')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
