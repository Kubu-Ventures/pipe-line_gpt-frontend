import { Linkedin, Youtube, Facebook } from 'lucide-react'

export function Footer() {
  return (
    <footer style={{ background: '#001B3A', color: '#8896A8' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 40px 0' }}>
        <div className="footer-grid">
          {/* Col 1 */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 400, color: '#FFF' }}>Pipeline</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7FB4E0' }}>GPT</span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '20px' }}>
              AI-powered natural language interface for pipeline integrity data. Built in the spirit of ROSEN Group's data-enabled future.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[Linkedin, Youtube, Facebook].map((Icon, i) => (
                <a key={i} href="#" style={{ color: '#8896A8', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#FFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFF', marginBottom: '16px' }}>
              Quick Links
            </h4>
            {['Chat Interface', 'Review Queue', 'Analytics Dashboard', 'Data Ingestion', 'Audit Log'].map(link => (
              <a key={link} href="#" style={{ display: 'block', fontSize: '0.875rem', color: '#8896A8', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}>
                {link}
              </a>
            ))}
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFF', marginBottom: '16px' }}>
              Data Sources
            </h4>
            {['PHMSA Incident Database', 'ILI Report Integration', 'SCADA Data Import', 'GIS Shapefiles', 'Custom Datasets'].map(link => (
              <a key={link} href="#" style={{ display: 'block', fontSize: '0.875rem', color: '#8896A8', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}>
                {link}
              </a>
            ))}
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFF', marginBottom: '16px' }}>
              About This Project
            </h4>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '16px' }}>
              Submitted for the 2026 Hermann Rosen Award for Pipeline Innovation, presented by the ASME Foundation and ROSEN Group.
            </p>
            <div style={{ fontSize: '0.8125rem', color: '#4A5568', lineHeight: 1.6 }}>
              <div>FastAPI · Next.js 14</div>
              <div>PostgreSQL + pgvector</div>
              <div>Anthropic Claude API</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem' }}>
            © 2026 PipelineGPT · A ROSEN Group Technology Initiative · 2026 Hermann Rosen Award Submission
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Terms of Use', 'Cookie Settings'].map(l => (
              <a key={l} href="#" style={{ fontSize: '0.8125rem', color: '#8896A8', textDecoration: 'none' }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
