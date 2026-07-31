import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TS Upgrade Advisor — ThoughtSpot Embedded Impact Analyzer',
  description: 'Detect breaking changes, deprecated SDK properties, and CSS impacts before you upgrade your ThoughtSpot cluster.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
