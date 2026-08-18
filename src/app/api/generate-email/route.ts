import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { analysis, fromVersion, toVersion, sdkVersion, apiKey } = await req.json()

    if (!apiKey) return NextResponse.json({ error: 'API key required' }, { status: 400 })

    const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
    const issuesList = analysis.issues
      .sort((a: any, b: any) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
      .map((i: any, idx: number) => `${idx + 1}. [${i.severity.toUpperCase()}] ${i.title}${i.fix ? `\n   Action required: ${i.fix}` : ''}`)
      .join('\n')

    const prompt = `You are writing an internal email from a developer to their own engineering team.

The team's ThoughtSpot cluster is being upgraded from ${fromVersion} to ${toVersion}.
Their current SDK version is ${sdkVersion || 'unknown'}.

Here is the impact analysis run against their embed code:

SUMMARY:
${analysis.summary}

ISSUES FOUND:
${issuesList || 'No issues found.'}

${analysis.opportunities?.length > 0 ? `NEW FEATURES AVAILABLE:\n${analysis.opportunities.map((o: any) => `- ${o.title}: ${o.detail}`).join('\n')}` : ''}

Write a professional but friendly email from the developer to their own team.

Rules:
- Write from the perspective of someone on the team sending to their colleagues — use "our ThoughtSpot cluster", "our embed", "we need to", "I wanted to flag"
- Open with "Hi team," 
- Briefly explain that OUR cluster is being upgraded from ${fromVersion} to ${toVersion}
- List the specific issues numbered with clear actions the team needs to take
- Mention any new features worth considering (if any)
- Close with "Regards," on its own line — no name, no company, no title
- Be direct and practical
- Do NOT mention AI, Claude, ThoughtSpot Solutions Engineers, or automated analysis
- Use British English spelling

Return a JSON object with exactly this structure (no markdown, no preamble):
{"subject": "email subject line", "body": "full email body text"}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Claude API error: ${res.status} — ${err}` }, { status: res.status })
    }

    const data = await res.json()
    const raw = data.content?.[0]?.text || ''
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const email = JSON.parse(cleaned)

    return NextResponse.json({ email })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
