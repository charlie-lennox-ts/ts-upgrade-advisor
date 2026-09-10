import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const SDK_CHANGELOG_URL = 'https://developer-docs-26-3-0-cl.vercel.app/docs/embed-sdk-changelog'
const WHATS_NEW_URL = 'https://developers.thoughtspot.com/docs/whats-new'

async function fetchDoc(url: string): Promise<string> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const html = await res.text()
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 40000)
  } catch {
    return `[Could not fetch ${url}]`
  }
}

async function fetchGitHubRaw(url: string): Promise<string> {
  const rawUrl = url
    .replace('https://github.com/', 'https://raw.githubusercontent.com/')
    .replace('/blob/', '/')
  const res = await fetch(rawUrl)
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)
  return res.text()
}

function loadPreviewNotes(): { content: string; version: string | null; isDraft: boolean } {
  try {
    const filePath = join(process.cwd(), 'src/data/preview-release-notes.json')
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)
    if (!data.releaseNotes || data.releaseNotes.length < 100) {
      return { content: '', version: null, isDraft: false }
    }
    return {
      content: `${data.releaseNotes}\n${data.embeddedNotes}`.substring(0, 30000),
      version: data.version,
      isDraft: data.isDraft === true,
    }
  } catch {
    return { content: '', version: null, isDraft: false }
  }
}

function extractJSON(text: string): string {
  const stripped = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
  try { JSON.parse(stripped); return stripped } catch {}
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = text.substring(firstBrace, lastBrace + 1)
    try { JSON.parse(extracted); return extracted } catch {}
  }
  throw new Error('Could not extract valid JSON from response')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, fromVersion, toVersion, sdkVersion, apiKey, githubUrl } = body

    if (!apiKey) return NextResponse.json({ error: 'API key required' }, { status: 400 })

    let embedCode = code || ''
    if (githubUrl) {
      try { embedCode = await fetchGitHubRaw(githubUrl) }
      catch (e) { return NextResponse.json({ error: `Could not fetch GitHub file: ${(e as Error).message}` }, { status: 400 }) }
    }
    if (!embedCode.trim()) return NextResponse.json({ error: 'No embed code provided' }, { status: 400 })

    const [changelog, whatsNew, previewNotes] = await Promise.all([
      fetchDoc(SDK_CHANGELOG_URL),
      fetchDoc(WHATS_NEW_URL),
      Promise.resolve(loadPreviewNotes()),
    ])

    const hasPreviewNotes = previewNotes.content.length > 100

    const systemPrompt = `You are an expert ThoughtSpot Embedded (TSE) upgrade advisor.
Analyze the customer's embed code and identify exactly what will be impacted when they upgrade.

Only flag things that are ACTUALLY in the customer's code. Do not flag placeholder values, empty arrays, or template comments.
If the upgrade is low risk, say so clearly and keep the issues list short.

${hasPreviewNotes ? `PREVIEW NOTES AVAILABLE: Some documentation below includes DRAFT release notes for ${previewNotes.version} — not yet public, subject to change before GA. If your analysis uses these, set "usedPreviewNotes" to true.` : ''}

Return ONLY a raw JSON object starting with { and ending with }:
{
  "summary": "2-3 sentence summary",
  "sdkVersionWarning": null,
  "usedPreviewNotes": false,
  "issues": [{
    "id": "unique-id",
    "severity": "critical|warning|info",
    "category": "breaking-change|deprecation|css-variable|new-feature|sdk-version",
    "title": "Short title",
    "detail": "Detailed explanation",
    "affectedCode": "exact property/variable affected",
    "fix": "exact action required",
    "docsLink": ""
  }],
  "opportunities": [{
    "title": "feature title",
    "detail": "why relevant",
    "docsLink": ""
  }]
}`

    const userPrompt = `EMBED CODE:
\`\`\`
${embedCode.substring(0, 15000)}
\`\`\`

UPGRADE: ${fromVersion} → ${toVersion}
SDK: ${sdkVersion || 'unknown'}

SDK CHANGELOG:
${changelog.substring(0, 20000)}

WHAT'S NEW:
${whatsNew.substring(0, 10000)}

${hasPreviewNotes ? `DRAFT PREVIEW NOTES (${previewNotes.version} — not yet public):
${previewNotes.content.substring(0, 15000)}` : ''}`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      return NextResponse.json({ error: `Claude API error: ${claudeRes.status} — ${err}` }, { status: claudeRes.status })
    }

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content?.[0]?.text || ''

    let analysis
    try {
      analysis = JSON.parse(extractJSON(rawText))
    } catch {
      return NextResponse.json({ error: 'Failed to parse analysis. Please try again.', debug: rawText.substring(0, 300) }, { status: 500 })
    }

    return NextResponse.json({
      analysis,
      codeLength: embedCode.length,
      usedPreviewNotes: hasPreviewNotes && analysis.usedPreviewNotes === true,
      previewVersion: hasPreviewNotes ? previewNotes.version : null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
