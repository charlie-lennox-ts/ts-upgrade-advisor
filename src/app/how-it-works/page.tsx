import Link from 'next/link'

export default function HowItWorks() {
  return (
    <div className="min-h-screen" style={{ background: '#08062B' }}>

      {/* Header */}
      <header style={{ background: '#0F2044', borderBottom: '1px solid rgba(4,209,255,0.1)' }} className="sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <svg width="22" height="23" viewBox="0 0 46 47" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M45.9298 0H0V8.50682H45.9298V0Z" fill="white"/>
              <path d="M45.9278 11.3438H28.4766V19.8506H45.9278V11.3438Z" fill="white"/>
              <path d="M11.1499 11.3438H0V19.8506H11.1499C15.3158 19.8506 18.7115 23.2463 18.7115 27.4122V45.9312H27.2183V27.4122C27.2183 18.5553 20.0068 11.3438 11.1499 11.3438Z" fill="white"/>
              <path d="M37.2118 32.207C33.2735 32.207 30.0703 35.4102 30.0703 39.3486C30.0703 43.2869 33.2735 46.4901 37.2118 46.4901C41.1502 46.4901 44.3534 43.2869 44.3534 39.3486C44.3534 35.4102 41.1502 32.207 37.2118 32.207Z" fill="white"/>
            </svg>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Space Grotesk' }}>ThoughtSpot</span>
                <span className="text-sm font-light" style={{ color: '#04D1FF' }}>Upgrade Advisor</span>
              </div>
              <p className="text-xs" style={{ color: '#7AA8C4', marginTop: '-1px' }}>Understand your upgrade</p>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ border: '1px solid rgba(4,209,255,0.2)', color: '#7AA8C4' }}>
            ← Back to analyser
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12 space-y-8">

        <div>
          <div className="ts-pill mb-4" style={{ display: 'inline-flex' }}>How it works</div>
          <h1 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            Built to be accurate, private, and honest
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#7AA8C4' }}>
            This tool helps ThoughtSpot Embedded customers understand the specific impact of a cluster upgrade on their embed implementation — before it happens.
          </p>
        </div>

        {/* How analysis works */}
        <div className="ts-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">How the analysis works</h2>
          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Your embed code is read',
                body: 'You paste your code, upload files, or provide a GitHub URL. The tool scans for ThoughtSpot SDK components, configuration properties, CSS variables, and Action IDs that you are actually using.'
              },
              {
                step: '2',
                title: 'Live ThoughtSpot docs are fetched',
                body: 'On every analysis run, the tool fetches the current SDK changelog and release notes directly from ThoughtSpot\'s public developer documentation at developers.thoughtspot.com. This means the analysis is always based on the latest published information — not cached or hardcoded knowledge.'
              },
              {
                step: '3',
                title: 'Claude analyses the overlap',
                body: 'Your code and the fetched documentation are sent to Anthropic\'s Claude API. Claude identifies which changes in the upgrade range affect the specific properties, components, and CSS variables in your code — and ignores everything else.'
              },
              {
                step: '4',
                title: 'You get a targeted report',
                body: 'The result is a prioritised list of issues specific to your implementation — breaking changes, deprecations, and CSS variable impacts — not a generic dump of every change in the release.'
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold"
                     style={{ background: 'rgba(4,209,255,0.15)', color: '#04D1FF', border: '1px solid rgba(4,209,255,0.25)' }}>
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#7AA8C4' }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data privacy */}
        <div className="ts-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Your data and privacy</h2>
          <div className="space-y-3">
            {[
              {
                title: 'Your embed code is never stored',
                body: 'Your code is sent directly to Anthropic\'s API for analysis and is not written to any database, log, or storage by this service. Once the API call completes, it is gone.'
              },
              {
                title: 'Your API key stays in your browser',
                body: 'Your Anthropic API key is stored only in your browser\'s localStorage. It is sent to Anthropic\'s API as part of the request — this service never logs, stores, or has access to your key on the server side.'
              },
              {
                title: 'Anthropic\'s API does not train on your data',
                body: 'For API usage (as opposed to Claude.ai), Anthropic does not use your inputs or outputs to train their models by default. Your embed code and analysis are covered by Anthropic\'s API data policy.'
              },
              {
                title: 'No tracking, no analytics',
                body: 'This tool does not use cookies, analytics scripts, or any third-party tracking. The only external services used are Anthropic\'s API (for analysis) and ThoughtSpot\'s public documentation (for release notes).'
              },
            ].map((item, i) => (
              <div key={i} className="rounded-lg p-4" style={{ background: 'rgba(4,209,255,0.04)', border: '1px solid rgba(4,209,255,0.1)' }}>
                <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#7AA8C4' }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="ts-card p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Sources used for analysis</h2>
          <p className="text-sm" style={{ color: '#7AA8C4' }}>
            The analysis is grounded in the following ThoughtSpot public documentation, fetched live on each run:
          </p>
          <div className="space-y-2">
            {[
              { label: 'Visual Embed SDK Changelog', url: 'https://developers.thoughtspot.com/docs/embed-sdk-changelog' },
              { label: 'ThoughtSpot What\'s New', url: 'https://developers.thoughtspot.com/docs/whats-new' },
              { label: 'ThoughtSpot Cloud Release Notes', url: 'https://docs.thoughtspot.com/cloud/26.8.0.cl/notes' },
            ].map((source, i) => (
              <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors group"
                 style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(4,209,255,0.08)' }}>
                <span className="text-sm" style={{ color: '#D0E8F5' }}>{source.label}</span>
                <span className="text-xs" style={{ color: '#04D1FF' }}>↗</span>
              </a>
            ))}
          </div>
          <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(255,192,82,0.08)', border: '1px solid rgba(255,192,82,0.15)' }}>
            <p className="text-xs" style={{ color: '#FFC052' }}>
              <strong>Important:</strong> SDK version recommendations are only surfaced when explicitly stated in ThoughtSpot\'s official documentation. This tool never generates SDK version guidance from its own assumptions.
            </p>
          </div>
        </div>

        {/* Limitations */}
        <div className="ts-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-white">Limitations to be aware of</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#7AA8C4' }}>
            This tool is a first pass, not a guarantee. It is designed to surface likely issues so your team knows what to investigate — it does not replace reading the official release notes or testing your embed after upgrade.
          </p>
          <ul className="space-y-2">
            {[
              'Analysis quality depends on the completeness of ThoughtSpot\'s published documentation',
              'Very minor version-specific deprecation details (e.g. exact patch version) may not always be precise',
              'The GitHub URL option only works with public repositories',
              'Always verify findings against official ThoughtSpot release notes before upgrading',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#7AA8C4' }}>
                <span style={{ color: '#3A5572', marginTop: 2 }}>·</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center pt-4">
          <Link href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #04D1FF, #714BFB)', boxShadow: '0 0 20px rgba(4,209,255,0.2)' }}>
            ← Back to analyser
          </Link>
        </div>

      </main>
    </div>
  )
}
