import Link from 'next/link'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const NAVY   = '#1f5a95'
const AZURE  = '#60d4f2'
const YELLOW = '#ffeb00'
const GRAY_300 = '#edeff0'
const GRAY_500 = '#a9b1b7'
const TEXT   = '#232e3e'

const FEATURES = [
  {
    color: BLUE,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <circle cx="14" cy="14" r="13" stroke={BLUE} strokeWidth="2"/>
        <path d="M9 10h10M9 14h7M9 18h5" stroke={BLUE} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Natural Language Queries',
    body:  'Ask any question about your pipeline data in plain English — no SQL, no special syntax. The system retrieves answers directly from your uploaded ILI reports, SCADA exports, and PHMSA records.',
  },
  {
    color: AZURE,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect x="5" y="4" width="18" height="20" rx="2" stroke={AZURE} strokeWidth="2"/>
        <path d="M9 10h10M9 14h10M9 18h6" stroke={AZURE} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="21" cy="21" r="5" fill="#fff" stroke={AZURE} strokeWidth="2"/>
        <path d="M19 21l1.5 1.5L23 19" stroke={AZURE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Cited, Traceable Answers',
    body:  'Every AI response cites its exact source document and page. No hallucinated references. Full, immutable audit trail exportable for PHMSA compliance reporting.',
  },
  {
    color: YELLOW,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <circle cx="14" cy="9" r="4" stroke={DARK} strokeWidth="2"/>
        <path d="M7 23c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke={DARK} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="22" cy="16" r="4" fill={YELLOW} stroke={DARK} strokeWidth="1.5"/>
        <path d="M20.5 16l1 1 2-2" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Engineer Review, Always',
    body:  'High-risk AI recommendations are automatically routed to a qualified engineer for review and sign-off. No unreviewed output ever influences an operational decision.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: F, background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        /* ── Responsive layout ── */
        .lp-nav {
          padding: 0 80px;
        }
        .lp-hero-content {
          padding: 0 80px 56px;
          max-width: 1000px;
        }
        .lp-features {
          display: flex;
          align-items: stretch;
          padding: 0 80px;
          height: 260px;
          flex-shrink: 0;
        }
        .lp-feature-cell {
          flex: 1;
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-footer {
          padding: 14px 80px;
        }

        @media (max-width: 1024px) {
          .lp-nav         { padding: 0 40px; }
          .lp-hero-content { padding: 0 40px 48px; }
          .lp-features    { padding: 0 40px; height: auto; }
          .lp-footer      { padding: 14px 40px; }
        }

        @media (max-width: 640px) {
          .lp-nav         { padding: 0 20px; height: 60px !important; }
          .lp-hero-content { padding: 0 20px 36px; }
          .lp-features {
            flex-direction: column;
            height: auto;
            padding: 0;
            border-top: 4px solid ${YELLOW};
          }
          .lp-feature-cell {
            padding: 24px 20px;
            border-right: none !important;
            border-bottom: 1px solid ${GRAY_300};
          }
          .lp-feature-cell:last-child { border-bottom: none; }
          .lp-footer {
            padding: 16px 20px;
            flex-direction: column;
            gap: 4px;
          }
          .lp-footer p { text-align: center; }
          .lp-cta-group { flex-direction: column; gap: 16px !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <header
        className="lp-nav"
        style={{
          height: 75, flexShrink: 0,
          background: '#fff',
          borderBottom: `1px solid ${GRAY_300}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" fill={BLUE} />
            <path d="M7 7h9c3.04 0 5.5 2.46 5.5 5.5S19.04 18 16 18H7V7Z" fill="#fff" />
            <path d="M16 18l7 7h-6l-4-7h3Z" fill="#fff" fillOpacity="0.55" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 18, color: DARK, letterSpacing: '-0.02em' }}>
            PipelineGPT
          </span>
        </div>

        <Link href="/login" style={{
          fontSize: '1rem', fontWeight: 400,
          color: DARK, textDecoration: 'none', letterSpacing: '0.01em',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          Sign in <span style={{ color: BLUE }}>→</span>
        </Link>
      </header>

      {/* ── HERO ── */}
      <section style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end',
        minHeight: 400,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1559510981-10719ce4266a?q=80&w=1920&auto=format&fit=crop"
          alt="" aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%' }}
          loading="eager"
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, rgba(35,46,62,0.90) 0%, rgba(35,46,62,0.62) 50%, rgba(35,46,62,0.20) 100%)`,
        }} />

        <div className="lp-hero-content" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ width: 56, height: 4, background: YELLOW, marginBottom: 28 }} />

          <p style={{
            fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: AZURE, marginBottom: 20,
          }}>
            Pipeline Integrity Intelligence · PHMSA Data · Cited Answers
          </p>

          <h1 style={{
            fontWeight: 700,
            fontSize: 'clamp(1.75rem, 5vw, 3.5rem)',
            lineHeight: '110%',
            letterSpacing: '-0.025em',
            color: '#fff',
            marginBottom: 20,
            maxWidth: 720,
          }}>
            Query your pipeline data<br />in plain English.
          </h1>

          <p style={{
            fontSize: 'clamp(0.9375rem, 2vw, 1.125rem)', fontWeight: 400,
            lineHeight: '138%', color: 'rgba(255,255,255,0.68)',
            marginBottom: 40, maxWidth: 540,
          }}>
            PipelineGPT turns your ILI reports, SCADA exports, and PHMSA incident records
            into an instantly queryable knowledge base — with citations and human oversight built in.
          </p>

          <div className="lp-cta-group" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '2px solid #fff', color: '#fff',
              padding: '12px 28px',
              fontSize: '0.875rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Try the demo
            </Link>

            <Link href="/login" style={{
              fontSize: '0.875rem', fontWeight: 400,
              color: 'rgba(255,255,255,0.62)',
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              letterSpacing: '0.02em',
            }}>
              Sign in with credentials <span style={{ color: AZURE }}>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        className="lp-features"
        style={{ background: '#fff', borderTop: `4px solid ${YELLOW}` }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="lp-feature-cell"
            style={{ borderRight: i < FEATURES.length - 1 ? `1px solid ${GRAY_300}` : 'none' }}
          >
            <div>{f.icon}</div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: TEXT, lineHeight: '110%', letterSpacing: '-0.01em' }}>
              {f.title}
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 400, color: '#55606e', lineHeight: '138%', margin: 0 }}>
              {f.body}
            </p>
          </div>
        ))}
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="lp-footer"
        style={{
          flexShrink: 0, background: DARK,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}
      >
        <p style={{ fontSize: '0.75rem', color: GRAY_500, letterSpacing: '0.02em' }}>
          © 2026 PipelineGPT · ASME Foundation Hermann Rosen Award for Pipeline Innovation
        </p>
        <p style={{ fontSize: '0.75rem', color: GRAY_500 }}>
          All AI outputs require human review before operational action.
        </p>
      </footer>
    </div>
  )
}
