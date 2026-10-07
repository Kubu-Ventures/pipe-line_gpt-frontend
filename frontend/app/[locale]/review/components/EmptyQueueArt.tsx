/** Line drawing of an inspected pipeline run with a sign-off check: shown when nothing is waiting. */
export function EmptyQueueArt({ width = 240 }: { width?: number }) {
  return (
    <svg width={width} viewBox="0 0 240 120" fill="none" aria-hidden>
      {/* Ground line and pipe supports */}
      <path d="M8 96h224" stroke="#D5DBE3" strokeWidth="1.5" strokeLinecap="round" />
      {[44, 120, 196].map(x => (
        <path key={x} d={`M${x} 74v22M${x - 8} 96h16`} stroke="#B9C3CF" strokeWidth="1.5" strokeLinecap="round" />
      ))}
      {/* Pipe run with girth welds */}
      <rect x="12" y="52" width="216" height="22" rx="11" fill="#EEF5FB" stroke="#7FA9CE" strokeWidth="1.5" />
      {[70, 100, 140, 170].map(x => (
        <path key={x} d={`M${x} 52v22`} stroke="#9DBBD8" strokeWidth="1.2" />
      ))}
      {/* Flow arrow */}
      <path d="M28 63h26m0 0-5-4m5 4-5 4" stroke="#7FA9CE" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Inspection marker over a weld */}
      <path d="M120 52V30" stroke="#006eb5" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="120" cy="22" r="14" fill="#fff" stroke="#006eb5" strokeWidth="1.5" />
      <path d="m113.5 22.5 4.5 4.5 8.5-9" stroke="#067647" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
