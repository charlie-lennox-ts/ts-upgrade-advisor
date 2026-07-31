import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { analysis, fromVersion, toVersion, sdkVersion, apiKey } = await req.json()

    if (!apiKey) return NextResponse.json({ error: 'API key required' }, { status: 400 })

    const issuesList = analysis.issues
      .sort((a: any, b: any) => ({ critical: 0, warning: 1, info: 2 }[a.severity] - { critical: 0, warning: 1, info: 2 }[b.severity]))
      .map((i: any, idx: number) => `${idx + 1}. [${i.severity.toUpperCase()}] ${i.title}${i.fix ? `\n   Action required: ${i.fix}` : ''}`)
      .join('\n')

    const prompt = `You are writing an email on behalf of a ThoughtSpot Solutions Engineer to a customer's developer team.

The customer's ThoughtSpot cluster is being upgraded from ${fromVersion} to ${toVersion}.
Their current SDK version is ${sdkVersion || 'unknown'}.

Here is the impact analysis that was just run against their embed code:

SUMMARY:
${analysis.summary}

ISSUES FOUND:
${issuesList || 'No issues found.'}

${analysis.opportunities?.length > 0 ? `NEW FEATURES AVAILABLE:\n${analysis.opportunities.map((o: any) => `- ${o.title}: ${o.detail}`).join('\n')}` : ''}

Write a professional but friendly email from the ThoughtSpot Solutions Engineer to the customer's dev team.

The email should:
- Open with a brief heads up about the upcoming upgrade (mention the version numbers)
- List the specific issues they need to address before or after upgrade, numbered, with clear actions
- Mention any new features they could take advantage of (if any)
- Close with an offer to help and next steps
- Be direct and practical — developers don't want waffle
- NOT mention AI, Claude, or automated analysis — write as if the SE wrote it personally
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
