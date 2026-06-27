import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// UNDP Design System tokens (css-custom-properties.md)
// Font:     ProximaNova → Inter (loaded substitute)
// Primary:  #006eb5   Secondary blue: #1f5a95   Dark bg: #232e3e
// Yellow:   #ffeb00   Azure: #60d4f2
// Body:     1.25rem / 138% lh   Heading: 110% lh   Display: 100% lh
// Heading weight default: 600   Bold: 700   Display bold: 800
// Header height: 75px   Border: 2px
// ─────────────────────────────────────────────────────────────────────────────

const F     = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE  = '#006eb5'   // --undpds-color-brand
const DARK  = '#232e3e'   // --undpds-color-ebony-clay
const NAVY  = '#1f5a95'   // --undpds-color-blue-700
const AZURE = '#60d4f2'   // --undpds-color-azure
const YELLOW = '#ffeb00'  // --undpds-color-accent
const GRAY_300 = '#edeff0'
const GRAY_500 = '#a9b1b7'
const TEXT  = '#232e3e'

const NAV_H  = 75  // --undpds-header-height-medium
const FEAT_H = 260 // feature strip

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
    <div style={{
      fontFamily: F, background: '#fff',
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
    }}>

      {/* ── NAV (UNDP: white, 75px, brand blue wordmark) ──────────────────── */}
      <header style={{
        height: NAV_H, flexShrink: 0,
        background: '#fff',
        borderBottom: `1px solid ${GRAY_300}`,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 80px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" fill={BLUE} />
            <path d="M7 7h9c3.04 0 5.5 2.46 5.5 5.5S19.04 18 16 18H7V7Z" fill="#fff" />
            <path d="M16 18l7 7h-6l-4-7h3Z" fill="#fff" fillOpacity="0.55" />
          </svg>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 18, color: DARK, letterSpacing: '-0.02em' }}>
            PipelineGPT
          </span>
        </div>

        <Link href="/login" style={{
          fontFamily: F, fontSize: '1rem', fontWeight: 400,
          color: DARK, textDecoration: 'none', letterSpacing: '0.01em',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          Sign in <span style={{ color: BLUE }}>→</span>
        </Link>
      </header>

      {/* ── HERO (UNDP: full-bleed photo, DARK overlay, yellow accent, display type) ── */}
      <section style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        minHeight: 420,
      }}>
        {/* Pipeline photo — confirmed: aerial mountain pipeline landscape */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1559510981-10719ce4266a?q=80&w=1920&auto=format&fit=crop"
          alt=""
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 50%',
          }}
          loading="eager"
        />

        {/* UNDP-style dark overlay — ebony clay tint */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top,
            rgba(35,46,62,0.90) 0%,
            rgba(35,46,62,0.62) 50%,
            rgba(35,46,62,0.20) 100%)`,
        }} />

        {/* Hero content — UNDP keeps it bottom-left, generous padding */}
        <div style={{
          position: 'relative', zIndex: 10,
          padding: '0 80px 56px',
          maxWidth: 1000,
        }}>
          {/* UNDP signature: yellow accent bar above headline */}
          <div style={{ width: 56, height: 4, background: YELLOW, marginBottom: 28 }} />

          {/* Category label — UNDP: small, uppercase, spaced */}
          <p style={{
            fontFamily: F, fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase' as const,
            color: AZURE, marginBottom: 20,
          }}>
            Pipeline Integrity Intelligence · PHMSA Data · Cited Answers
          </p>

          {/* Display headline — UNDP display-large = 3.5rem, bold weight 700 */}
          <h1 style={{
            fontFamily: F, fontWeight: 700,
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            lineHeight: '100%',
            letterSpacing: '-0.025em',
            color: '#fff',
            marginBottom: 20,
            maxWidth: 720,
          }}>
            Query your pipeline data<br />in plain English.
          </h1>

          {/* Body — UNDP body-default = 1.25rem / 138% */}
          <p style={{
            fontFamily: F, fontSize: '1.125rem', fontWeight: 400,
            lineHeight: '138%', color: 'rgba(255,255,255,0.68)',
            marginBottom: 40, maxWidth: 540,
          }}>
            PipelineGPT turns your ILI reports, SCADA exports, and PHMSA incident records
            into an instantly queryable knowledge base — with citations and human oversight built in.
          </p>

          {/* CTAs — UNDP: outlined (light) primary + plain text secondary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' as const }}>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '2px solid #fff', color: '#fff',
              padding: '12px 28px',
              fontFamily: F, fontSize: '0.875rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              textDecoration: 'none',
            }}>
              Try the demo
            </Link>

            <Link href="/login" style={{
              fontFamily: F, fontSize: '0.875rem', fontWeight: 400,
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

      {/* ── FEATURES (UNDP: white strip, 3-col, icon + bold title + body) ── */}
      <section style={{
        height: FEAT_H, flexShrink: 0,
        background: '#fff',
        borderTop: `4px solid ${YELLOW}`,   // UNDP yellow top-rule on feature sections
        display: 'flex', alignItems: 'stretch',
        padding: '0 80px',
      }}>
        {FEATURES.map((f, i) => (
          <div key={f.title} style={{
            flex: 1,
            padding: '28px 32px',
            borderRight: i < FEATURES.length - 1 ? `1px solid ${GRAY_300}` : 'none',
            display: 'flex', flexDirection: 'column' as const, gap: 12,
          }}>
            {/* Icon */}
            <div>{f.icon}</div>

            {/* Feature title — UNDP heading-small = 1.5rem, weight 600 */}
            <p style={{
              fontFamily: F, fontSize: '1rem', fontWeight: 700,
              color: TEXT, lineHeight: '110%', letterSpacing: '-0.01em',
            }}>
              {f.title}
            </p>

            {/* Body — UNDP body-small = 1rem, 138% */}
            <p style={{
              fontFamily: F, fontSize: '0.875rem', fontWeight: 400,
              color: '#55606e', lineHeight: '138%',
              margin: 0,
            }}>
              {f.body}
            </p>
          </div>
        ))}
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{
        flexShrink: 0, background: DARK,
        padding: '14px 80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap' as const, gap: 8,
      }}>
        <p style={{ fontFamily: F, fontSize: '0.75rem', color: GRAY_500, letterSpacing: '0.02em' }}>
          © 2026 PipelineGPT · ASME Foundation Hermann Rosen Award for Pipeline Innovation
        </p>
        <p style={{ fontFamily: F, fontSize: '0.75rem', color: GRAY_500 }}>
          All AI outputs require human review before operational action.
        </p>
      </footer>
    </div>
  )
}
