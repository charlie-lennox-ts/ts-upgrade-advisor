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
    if (!data.releaseNotes || data.releaseNotes.length < 500) {
      return { content: '', version: null, isDraft: false }
    }
    return {
      content: `${data.releaseNotes}\n${data.embeddedNotes || ''}`.substring(0, 30000),
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

    const hasPreviewNotes = previewNotes.content.length > 500

    const systemPrompt = `You are an expert ThoughtSpot Embedded (TSE) upgrade advisor with deep knowledge of every version of the Visual Embed SDK and ThoughtSpot Cloud releases.

Your job is to produce a THOROUGH and COMPLETE analysis of everything that may impact this customer's embed implementation when upgrading between the specified cluster versions.

ANALYSIS REQUIREMENTS — be exhaustive, not minimal:
- Scan every property, method, event, CSS variable, Action enum, HostEvent, EmbedEvent, and configuration option in the customer's code
- Flag ALL of the following that appear in their code:
  * Deprecated properties or methods (even if still functional — customers need to plan ahead)
  * Removed or breaking changes
  * Properties whose behaviour has changed between versions
  * CSS variables that have been renamed, removed, or whose scope has changed
  * Action enum values that have been removed or renamed
  * EmbedEvent or HostEvent values that have changed
  * SDK version gaps — if their SDK is behind the recommended version for the target cluster
  * Navigation patterns that have changed (e.g. path changes, Page enum additions)
  * Auth patterns that may be affected
- Also surface new features introduced in the version range that are DIRECTLY relevant to the embed components and patterns they are already using — these are opportunities, not issues
- Do NOT invent issues that aren't supported by the documentation
- Do NOT pad with generic advice unrelated to their specific code
- If the upgrade is genuinely low risk, say so — but still list every minor consideration

${hasPreviewNotes ? `
IMPORTANT — SOURCE HIERARCHY:
You have two sets of documentation:
1. PUBLIC DOCS (SDK Changelog + What's New) — these are the authoritative source of truth. Always prioritise these.
2. PREVIEW/DRAFT NOTES (${previewNotes.version}) — these are pre-release and may change before GA. Use them to surface upcoming changes the customer should be aware of, but if anything in the preview notes contradicts the public docs, the public docs take precedence.

For any issue that comes ONLY from the preview notes (not confirmed in public docs), set "fromPreviewNotes": true on that issue. This flags it as draft content subject to change.
` : ''}

Return ONLY a raw JSON object starting with { and ending with }:
{
  "summary": "2-3 sentence summary covering the overall risk level and most important findings",
  "sdkVersionWarning": "string if SDK is behind recommended, otherwise null",
  "usedPreviewNotes": false,
  "issues": [{
    "id": "unique-kebab-case-id",
    "severity": "critical|warning|info",
    "category": "breaking-change|deprecation|css-variable|new-feature|sdk-version",
    "title": "Short descriptive title",
    "detail": "Detailed explanation of what this means for their specific code and why it matters",
    "affectedCode": "The exact property, function, or variable from their code",
    "fix": "Specific action required — exact code change if possible",
    "docsLink": "",
    "fromPreviewNotes": false
  }],
  "opportunities": [{
    "title": "Feature title",
    "detail": "Why this is relevant to their specific implementation",
    "docsLink": "",
    "fromPreviewNotes": false
  }]
}`

    const userPrompt = `Analyse this ThoughtSpot embed implementation for upgrade impact. Be thorough — surface every relevant finding.

EMBED CODE:
\`\`\`
${embedCode.substring(0, 15000)}
\`\`\`

UPGRADE PATH: ${fromVersion} → ${toVersion}
CURRENT SDK VERSION: ${sdkVersion || 'unknown — check package.json'}

=== PRIMARY SOURCE: SDK CHANGELOG (authoritative) ===
${changelog.substring(0, 20000)}

=== PRIMARY SOURCE: WHAT'S NEW (authoritative) ===
${whatsNew.substring(0, 10000)}

${hasPreviewNotes ? `=== SUPPLEMENTARY SOURCE: DRAFT PREVIEW NOTES for ${previewNotes.version} (not yet public — use to supplement, public docs take priority if any conflict) ===
${previewNotes.content.substring(0, 15000)}` : ''}

Go through the embed code line by line and check every property, event, action, CSS variable, and pattern against all documentation sources. Surface everything relevant — breaking changes, deprecations, behavioural changes, CSS impacts, and new features the customer should know about.`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      }),
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

    // Check if any issues came from preview notes
    const anyPreviewUsed = analysis.issues?.some((i: any) => i.fromPreviewNotes) ||
                           analysis.opportunities?.some((o: any) => o.fromPreviewNotes)

    return NextResponse.json({
      analysis,
      codeLength: embedCode.length,
      usedPreviewNotes: hasPreviewNotes && (analysis.usedPreviewNotes === true || anyPreviewUsed),
      previewVersion: hasPreviewNotes ? previewNotes.version : null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
