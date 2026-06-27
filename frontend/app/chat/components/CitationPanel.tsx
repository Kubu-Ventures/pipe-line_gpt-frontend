import { X, FileText, MapPin, Calendar } from 'lucide-react'
import type { Citation } from '@/lib/api'

interface CitationPanelProps {
  citation: Citation | null
  onClose: () => void
}

export function CitationPanel({ citation, onClose }: CitationPanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '72px',
        right: 0,
        bottom: 0,
        width: '400px',
        background: '#FFFFFF',
        borderLeft: '1px solid #E4E8EF',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        transform: citation ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E4E8EF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8F9FB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="#005DAA" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A1A2A' }}>Source Reference</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#8896A8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A2A')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}
        >
          <X size={18} />
        </button>
      </div>

      {citation && (
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Source ID chip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#E8F0F9',
              color: '#005DAA',
              fontSize: '0.75rem',
              fontWeight: 600,
              fontFamily: 'monospace',
              padding: '4px 10px',
              borderRadius: '3px',
              border: '1px solid rgba(0,93,170,0.2)',
              marginBottom: '16px',
            }}
          >
            {citation.source_id}
          </div>

          {/* Filename */}
          <h3
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#1A1A2A',
              marginBottom: '12px',
              lineHeight: 1.4,
            }}
          >
            {citation.filename}
          </h3>

          {/* Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {citation.date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#8896A8' }}>
                <Calendar size={13} />
                {citation.date}
              </div>
            )}
            {citation.segment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#8896A8' }}>
                <MapPin size={13} />
                Segment: {citation.segment}
              </div>
            )}
            {citation.section_label && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#8896A8' }}>
                <FileText size={13} />
                {citation.section_label}
                {citation.page_ref ? ` · p.${citation.page_ref}` : ''}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E4E8EF', marginBottom: '16px' }} />

          {/* Chunk text */}
          <div>
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#8896A8',
                marginBottom: '8px',
              }}
            >
              Relevant Passage
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: '#4A5568',
                lineHeight: 1.7,
                background: '#F8F9FB',
                border: '1px solid #E4E8EF',
                borderRadius: '6px',
                padding: '14px',
                borderLeft: '3px solid #005DAA',
              }}
            >
              {citation.text}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
