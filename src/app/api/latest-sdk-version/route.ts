import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://developers.thoughtspot.com/docs/embed-sdk-changelog', {
      next: { revalidate: 3600 }
    })
    const html = await res.text()

    // Match patterns like "Version 1.52.x" or "Version 1.52.0"
    const matches = html.match(/Version\s+(1\.\d+[\.x0-9]*)/gi)

    if (!matches || matches.length === 0) {
      return NextResponse.json({ latest: null })
    }

    // Extract just the version numbers and deduplicate
    const versions = Array.from(new Set(
      matches.map(m => m.replace(/Version\s+/i, '').trim().replace(/\.+$/, ''))
    ))

    // Sort by minor version number descending
    const sorted = versions.sort((a, b) => {
      return (parseInt(b.split('.')[1], 10) || 0) - (parseInt(a.split('.')[1], 10) || 0)
    })

    return NextResponse.json({ latest: sorted[0], all: sorted })
  } catch {
    return NextResponse.json({ latest: null })
  }
}
