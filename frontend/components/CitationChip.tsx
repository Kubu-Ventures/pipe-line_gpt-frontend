'use client'

import type { AnchorHTMLAttributes } from 'react'
import type { Components, ExtraProps } from 'react-markdown'
import type { Citation } from '@/lib/api'
import { CITE_HREF_PREFIX, shortDocName } from '@/lib/utils'

/**
 * ReactMarkdown `components` that render citation links from `linkCitations`
 * as numbered chips. Clicking a chip calls `onOpen` with its citation.
 */
export function citationComponents(citations: Citation[], onOpen?: (c: Citation) => void): Components {
  const byId = new Map(citations.map(c => [c.source_id, c]))

  function Link({ node, href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps) {
    void node // react-markdown's syntax-tree node; not a DOM attribute
    const citation = href?.startsWith(CITE_HREF_PREFIX) ? byId.get(href.slice(CITE_HREF_PREFIX.length)) : undefined
    if (!citation) {
      return <a href={href} {...rest}>{children}</a>
    }
    return (
      <button
        type="button"
        onClick={() => onOpen?.(citation)}
        title={`${citation.source_id} · ${shortDocName(citation.filename)}`}
        aria-label={`Open source ${citation.source_id}`}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 18, height: 18, padding: '0 5px', margin: '0 1px 0 3px',
          fontSize: '0.6875rem', fontWeight: 600, lineHeight: 1, verticalAlign: 'text-top',
          color: '#006eb5', background: '#dff0ff',
          border: '1px solid rgba(0,93,170,0.15)', borderRadius: 3,
          cursor: onOpen ? 'pointer' : 'default',
        }}
      >
        {children}
      </button>
    )
  }

  return { a: Link }
}
