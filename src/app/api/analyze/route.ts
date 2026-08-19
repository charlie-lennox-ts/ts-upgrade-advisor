import { NextRequest, NextResponse } from 'next/server'

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

function extractJSON(text: string): string {
  // Strategy 1: strip markdown fences and try parsing directly
  const stripped = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
  try { JSON.parse(stripped); return stripped } catch {}

  // Strategy 2: find the first { and last } and extract everything between
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = text.substring(firstBrace, lastBrace + 1)
    try { JSON.parse(extracted); return extracted } catch {}
  }

  // Strategy 3: try the stripped version of the extracted block
  if (firstBrace !== -1 && lastBrace !== -1) {
    const extracted = text.substring(firstBrace, lastBrace + 1)
      .replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
    try { JSON.parse(extracted); return extracted } catch {}
  }

  throw new Error('Could not extract valid JSON from response')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, fromVersion, toVersion, sdkVersion, apiKey, githubUrl } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    let embedCode = code || ''

    if (githubUrl) {
      try {
        embedCode = await fetchGitHubRaw(githubUrl)
      } catch (e) {
        return NextResponse.json({ error: `Could not fetch GitHub file: ${(e as Error).message}` }, { status: 400 })
      }
    }

    if (!embedCode.trim()) {
      return NextResponse.json({ error: 'No embed code provided' }, { status: 400 })
    }

    const [changelog, whatsNew] = await Promise.all([
      fetchDoc(SDK_CHANGELOG_URL),
      fetchDoc(WHATS_NEW_URL),
    ])

    const systemPrompt = `You are an expert ThoughtSpot Embedded (TSE) upgrade advisor. 
Your job is to analyze a customer's embed code and identify exactly what will be impacted 
when they upgrade their ThoughtSpot cluster.

You have deep knowledge of:
- The Visual Embed SDK changelog (all versions 1.1 through 1.49+)
- ThoughtSpot CSS variables (--ts-var-*) and how they change between versions
- Deprecated and removed parameters, components, and action IDs
- Breaking changes in SDK versions
- The recommended SDK version for each cluster version

IMPORTANT: Be specific and actionable. Only flag things that are ACTUALLY in the customer's code.
Do not list every possible change — only what affects THIS specific implementation.
Do not flag placeholder values like empty arrays [], template comments, or example values as issues.
Only flag Action enum values that are genuinely invalid — if an array contains browser API objects instead of Action.* values, flag it. If it contains valid Action.* enum values, do not flag it.

Return your analysis as a JSON object with this exact structure:
{
  "summary": "2-3 sentence plain English summary of the overall impact",
  "sdkVersionWarning": null,
  "issues": [
    {
      "id": "unique-id",
      "severity": "critical|warning|info",
      "category": "breaking-change|deprecation|css-variable|new-feature|sdk-version",
      "title": "Short title",
      "detail": "Detailed explanation of what this means for their specific code",
      "affectedCode": "The exact property/function/variable in their code that is affected",
      "fix": "Exact code change or action required",
      "docsLink": ""
    }
  ],
  "opportunities": [
    {
      "title": "New feature they could benefit from",
      "detail": "Why it's relevant to their implementation",
      "docsLink": ""
    }
  ]
}

Severity guide:
- critical: Will break their embed (removed API, breaking change, incompatible parameter)
- warning: Deprecated but still works for now, should fix before next upgrade
- info: Behavioral change they should be aware of, or CSS change that may affect white-label styling

CRITICAL: Return ONLY the raw JSON object. No markdown fences, no backticks, no preamble, no explanation. Start your response with { and end with }.`

    const userPrompt = `Analyze this ThoughtSpot embed code for upgrade impact.

CUSTOMER'S EMBED CODE:
\`\`\`
${embedCode.substring(0, 15000)}
\`\`\`

UPGRADE DETAILS:
- Upgrading FROM cluster version: ${fromVersion}
- Upgrading TO cluster version: ${toVersion}  
- Current SDK version in use: ${sdkVersion || 'unknown — check package.json'}
- Recommended SDK for target cluster: Check the What's New notes below

LIVE SDK CHANGELOG (from ThoughtSpot docs):
${changelog.substring(0, 20000)}

WHAT'S NEW (recent cluster releases):
${whatsNew.substring(0, 10000)}

Based on the code above, identify:
1. Any deprecated or removed SDK parameters/properties they are using
2. Any CSS variables (--ts-var-*) that have changed
3. Any Action IDs, EmbedEvents, or HostEvents they use that have changed
4. Whether their SDK version is appropriate for the target cluster
5. Any new features introduced in the upgrade range that are relevant to their embed type

Be precise — only flag what is actually in their code. If the upgrade is low risk, say so clearly in the summary and keep the issues list short.`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
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
      const jsonString = extractJSON(rawText)
      analysis = JSON.parse(jsonString)
    } catch {
      return NextResponse.json({ 
        error: 'Failed to parse analysis response. Please try again.',
        debug: rawText.substring(0, 300)
      }, { status: 500 })
    }

    return NextResponse.json({ analysis, codeLength: embedCode.length })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
