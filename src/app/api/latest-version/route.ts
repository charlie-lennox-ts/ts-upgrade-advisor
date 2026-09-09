import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Fetch the ThoughtSpot release history page
    const res = await fetch('https://docs.thoughtspot.com/cloud/latest/release-history', {
      next: { revalidate: 3600 } // cache for 1 hour
    })
    const html = await res.text()

    // Extract all version numbers matching the XX.X.0.cl pattern
    const matches = html.match(/\b(2[0-9]\.\d+\.0\.cl|10\.\d+\.0\.cl)\b/g)

    if (!matches || matches.length === 0) {
      return NextResponse.json({ latest: null })
    }

    // Deduplicate and sort by version number descending
    const unique = [...new Set(matches)]
    const sorted = unique.sort((a, b) => {
      const [aMajor, aMinor] = a.replace('.cl', '').split('.').map(Number)
      const [bMajor, bMinor] = b.replace('.cl', '').split('.').map(Number)
      if (bMajor !== aMajor) return bMajor - aMajor
      return bMinor - aMinor
    })

    return NextResponse.json({ latest: sorted[0], all: sorted.slice(0, 5) })
  } catch {
    return NextResponse.json({ latest: null })
  }
}
