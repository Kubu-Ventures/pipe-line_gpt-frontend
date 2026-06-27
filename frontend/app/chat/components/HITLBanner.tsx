import { ClipboardCheck, Clock } from 'lucide-react'

export function HITLBanner() {
  return (
    <div
      style={{
        background: '#FEF3C7',
        borderTop: '1px solid #FDE68A',
        borderBottom: '1px solid #FDE68A',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <ClipboardCheck size={16} color="#92400E" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.875rem', color: '#92400E', fontWeight: 600 }}>
          Under Engineer Review —{' '}
        </span>
        <span style={{ fontSize: '0.875rem', color: '#B45309' }}>
          This response involves a pipeline action recommendation and is under review by a qualified engineer.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <Clock size={13} color="#92400E" />
        <span style={{ fontSize: '0.8125rem', color: '#92400E', fontWeight: 500 }}>Est. 15 min</span>
      </div>
    </div>
  )
}
