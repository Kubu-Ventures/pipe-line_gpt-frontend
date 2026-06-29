'use client'

import { Link } from '@/lib/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const DARK   = '#232e3e'
const BLUE   = '#006eb5'
const YELLOW = '#ffeb00'

export function NextStep({ href, label, description }: {
  href: string
  label: string
  description: string
}) {
  const t = useTranslations('nextStep')

  return (
    <div style={{ background: '#edeff0', borderTop: `4px solid ${YELLOW}` }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '20px 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: BLUE, marginBottom: 4 }}>
            {t('label')}
          </p>
          <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: DARK }}>{label}</p>
          <p style={{ fontFamily: F, fontSize: 13, color: '#55606e', marginTop: 3 }}>{description}</p>
        </div>
        <Link href={href} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 22px',
          border: `2px solid ${DARK}`,
          background: DARK, color: '#fff',
          textDecoration: 'none',
          fontFamily: F, fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>
          {label} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}
