'use client'
import { useState, useRef } from 'react'
import { Code2, Upload, Github, X, FileCode, CheckCircle, Sparkles, AlertTriangle } from 'lucide-react'

type InputMode = 'paste' | 'file' | 'github'

interface CodeInputProps {
  code: string
  onCodeChange: (code: string) => void
  githubUrl: string
  onGithubUrlChange: (url: string) => void
  onSdkDetected?: (version: string) => void
}

function detectSdkVersion(text: string): string | null {
  const pkgMatch = text.match(/"@thoughtspot\/visual-embed-sdk":\s*"[\^~]?(\d+\.\d+[\.\d]*)"/)
  if (pkgMatch) return pkgMatch[1]
  const npmMatch = text.match(/@thoughtspot\/visual-embed-sdk@(\d+\.\d+[\.\d]*)/)
  if (npmMatch) return npmMatch[1]
  const commentMatch = text.match(/\/\/\s*SDK\s*v?(\d+\.\d+[\.\d]*)/)
  if (commentMatch) return commentMatch[1]
  return null
}

const RELEVANT_FILES = [
  'package.json',
  'src/embed.ts / embed.js',
  'src/thoughtspot.ts / thoughtspot.js',
  'Any file containing init(), AppEmbed, LiveboardEmbed, SpotterEmbed',
]

const IGNORE_FILES = ['node_modules/', 'package-lock.json', 'yarn.lock', '.env', 'dist/', '.git/']

export default function CodeInput({ code, onCodeChange, githubUrl, onGithubUrlChange, onSdkDetected }: CodeInputProps) {
  const [mode, setMode] = useState<InputMode>('paste')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [detectedSdk, setDetectedSdk] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleCodeChange = (text: string) => {
    onCodeChange(text)
    const detected = detectSdkVersion(text)
    if (detected) {
      setDetectedSdk(detected)
      onSdkDetected?.(detected)
    } else {
      setDetectedSdk(null)
    }
  }

  const processZip = async (file: File) => {
    setProcessing(true)
    setFileError(null)
    try {
      const JSZip = (await import('jszip')).default
      const buffer = await file.arrayBuffer()
      const zip = await JSZip.loadAsync(buffer)

      const relevantExts = ['.js', '.ts', '.jsx', '.tsx', '.json']
      const ignorePaths = ['node_modules/', 'dist/', '.git/', 'package-lock', 'yarn.lock', '.env']

      const fileList = Object.keys(zip.files).filter(name => {
        if (zip.files[name].dir) return false
        if (ignorePaths.some(p => name.includes(p))) return false
        const ext = '.' + name.split('.').pop()?.toLowerCase()
        return relevantExts.includes(ext)
      })

      const sorted = fileList.sort((a, b) => {
        const aScore = a.includes('package.json') ? 0 : a.toLowerCase().includes('embed') ? 1 : 2
        const bScore = b.includes('package.json') ? 0 : b.toLowerCase().includes('embed') ? 1 : 2
        return aScore - bScore
      })

      let combined = ''
      const filesFound: string[] = []

      for (const name of sorted.slice(0, 20)) {
        const content = await zip.files[name].async('string')
        if (content.length > 50000) continue
        combined += `\n// FILE: ${name}\n${content}\n`
        filesFound.push(name)
        if (combined.length > 80000) break
      }

      if (!combined.trim()) {
        setFileError('No relevant files found in zip. Make sure it contains .js, .ts, or package.json files.')
        setProcessing(false)
        return
      }

      handleCodeChange(combined)
      setFileName(`${file.name} (${filesFound.length} files extracted)`)
    } catch (e) {
      setFileError('Could not read zip file. Try uploading individual files instead.')
    }
    setProcessing(false)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError(null)

    if (file.name.endsWith('.zip')) {
      if (file.size > 5_000_000) { setFileError('Zip too large — max 5MB'); return }
      await processZip(file)
      return
    }

    const validExts = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.json']
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validExts.includes(ext)) { setFileError('Please upload a .js, .ts, .jsx, .tsx, .json, or .zip file'); return }
    if (file.size > 500_000) { setFileError('File too large — max 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      handleCodeChange(text)
      setFileName(file.name)
    }
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
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Your Embed Code</h2>
          {detectedSdk && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                 style={{ background: 'rgba(109,210,103,0.1)', border: '1px solid rgba(109,210,103,0.25)', color: '#6DD267' }}>
              <Sparkles size={10} /> SDK v{detectedSdk} detected
            </div>
          )}
        </div>
        <div className="flex rounded-lg p-1 gap-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={mode === tab.id
                ? { background: 'rgba(4,209,255,0.15)', color: '#04D1FF', border: '1px solid rgba(4,209,255,0.25)' }
                : { color: '#7AA8C4', border: '1px solid transparent' }
              }>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'paste' && (
        <div className="relative">
          <textarea value={code} onChange={e => handleCodeChange(e.target.value)}
            placeholder={`Paste your ThoughtSpot embed code here…\n\nTip: paste your package.json to auto-detect SDK version, then add your embed code below it.`}
            className="w-full h-64 px-4 py-3 text-sm font-mono resize-none leading-relaxed focus:outline-none"
            style={{ ...inputStyle, caretColor: '#04D1FF' }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.35)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(4,209,255,0.06)' }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(4,209,255,0.12)'; (e.target as HTMLElement).style.boxShadow = 'none' }}
          />
          {code && <button onClick={() => { handleCodeChange(''); setDetectedSdk(null) }} className="absolute top-3 right-3" style={{ color: '#3A5572' }}><X size={14} /></button>}
          {code && <div className="absolute bottom-3 right-3 text-xs font-mono" style={{ color: '#3A5572' }}>{code.split('\n').length} lines</div>}
        </div>
      )}

      {mode === 'file' && (
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept=".js,.ts,.jsx,.tsx,.mjs,.json,.zip" onChange={handleFile} className="hidden" />
          {!fileName ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-36 flex flex-col items-center justify-center gap-3 rounded-lg transition-all"
              style={{ border: '2px dashed rgba(4,209,255,0.15)', color: '#7AA8C4' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,209,255,0.4)'; (e.currentTarget as HTMLElement).style.color = '#04D1FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,209,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#7AA8C4' }}
            >
              {processing
                ? <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span className="text-sm">Processing zip…</span></>
                : <>
                    <Upload size={22} />
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload a file or .zip of your project</p>
                      <p className="text-xs mt-1" style={{ color: '#3A5572' }}>.js .ts .jsx .tsx .json .zip — max 5MB</p>
                    </div>
                  </>
              }
            </button>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg"
                 style={{ background: 'rgba(109,210,103,0.08)', border: '1px solid rgba(109,210,103,0.2)' }}>
              <div className="flex items-center gap-3">
                <CheckCircle size={16} style={{ color: '#6DD267' }} />
                <div>
                  <p className="text-sm font-medium text-white">{fileName}</p>
                  <p className="text-xs" style={{ color: '#7AA8C4' }}>{code.split('\n').length} lines{detectedSdk ? ` · SDK v${detectedSdk} detected` : ''}</p>
                </div>
              </div>
              <button onClick={() => { setFileName(null); handleCodeChange(''); if (fileRef.current) fileRef.current.value = '' }}
                      style={{ color: '#3A5572' }}><X size={16} /></button>
            </div>
          )}
          {fileError && <p className="text-xs" style={{ color: '#FFC052' }}>{fileError}</p>}
          <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(4,209,255,0.08)' }}>
            <p className="text-xs font-medium text-white">Recommended files to include</p>
            <ul className="space-y-1">
              {RELEVANT_FILES.map((f, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#7AA8C4' }}>
                  <span style={{ color: '#04D1FF', marginTop: 1 }}>·</span> {f}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2" style={{ color: '#3A5572' }}>
              If uploading a zip, these will be auto-extracted. Ignored: {IGNORE_FILES.join(', ')}
            </p>
          </div>
        </div>
      )}

      {mode === 'github' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg px-3 py-2.5"
               style={{ background: 'rgba(255,192,82,0.08)', border: '1px solid rgba(255,192,82,0.2)' }}>
            <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#FFC052' }} />
            <p className="text-xs" style={{ color: '#FFC052' }}>
              <strong>Public repos only.</strong> This fetches raw file content from GitHub — it will not work with private repositories. For private repos, download and upload the relevant files instead.
            </p>
          </div>
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
          <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(4,209,255,0.08)' }}>
            <p className="text-xs font-medium text-white">Recommended files to point at</p>
            <ul className="space-y-1">
              {RELEVANT_FILES.map((f, i) => (
                <li key={i} className="text-xs flex items-start gap-2" style={{ color: '#7AA8C4' }}>
                  <span style={{ color: '#04D1FF', marginTop: 1 }}>·</span> {f}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2" style={{ color: '#3A5572' }}>Fetched fresh on every run. Paste a github.com file URL — we convert it to raw automatically.</p>
          </div>
          {githubUrl && (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#04D1FF' }}>
              <FileCode size={12} /> {githubUrl.replace('https://github.com/', '').replace('/blob/', '/')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
