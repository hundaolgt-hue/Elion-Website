import { forwardRef } from 'react'

/**
 * The Elyon star-drone mark: four wings (Elyon Blue to Sky) radiating from a navy building
 * silhouette with a dotted LiDAR spray beneath. Paths are grouped so the preloader can stroke
 * them in sequence. Rebuilt as vector from the brand board; replace with the paths from
 * Elyon_Brand_Scheme_Vector_v4 when the package is added to /public/brand.
 */
export const Mark = forwardRef<SVGSVGElement, { size?: number; className?: string; stroke?: boolean; onNavy?: boolean }>(function Mark({ size = 64, className = '', stroke = false, onNavy = true }, ref) {
  const build = onNavy ? '#FFFFFF' : '#0A1B33'
  return (
    <svg ref={ref} className={className} width={size} height={size * 1.3} viewBox="0 0 100 130" aria-label="Elyon Aerial Services mark" role="img">
      <defs>
        <linearGradient id="elyon-wing" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#1E63D6" /><stop offset="1" stopColor="#4FA5FF" />
        </linearGradient>
      </defs>
      <g className="wings" fill={stroke ? 'none' : 'url(#elyon-wing)'} stroke={stroke ? '#4FA5FF' : 'none'} strokeWidth="1.5" strokeLinejoin="round">
        <path className="wing" d="M50 62 L6 36 L10 32 L50 50 Z" />
        <path className="wing" d="M50 62 L94 36 L90 32 L50 50 Z" />
        <path className="wing" d="M50 66 L8 74 L12 78 L50 70 Z" />
        <path className="wing" d="M50 66 L92 74 L88 78 L50 70 Z" />
      </g>
      <g className="building" fill={stroke ? 'none' : build} stroke={stroke ? build : 'none'} strokeWidth="1.5">
        <path d="M40 58 V24 H45 V58 Z" />
        <path d="M46 58 V8 H54 V58 Z" />
        <path d="M55 58 V30 H60 V58 Z" />
        <path d="M34 58 V36 H39 V58 Z" />
        <path d="M61 58 V40 H66 V58 Z" />
      </g>
      <g className="spray" fill="#4FA5FF">
        {Array.from({ length: 6 }, (_, r) => Array.from({ length: r * 2 + 1 }, (_, i) => (
          <circle key={`${r}-${i}`} className="dot" cx={50 + (i - r) * 4.2} cy={82 + r * 7} r={2 - r * 0.22} />
        )))}
      </g>
    </svg>
  )
})

/** Wordmark: ELYON in geometric caps with the three-bar E, AERIAL SERVICES tracked beneath */
export function Wordmark({ height = 28, onNavy = true, className = '' }: { height?: number; onNavy?: boolean; className?: string }) {
  const c = onNavy ? '#FFFFFF' : '#0A1B33'
  const w = height * 6.4
  return (
    <svg className={className} width={w} height={height} viewBox="0 0 320 50" role="img" aria-label="Elyon Aerial Services">
      <g fill={c}>
        {/* E as three bars */}
        <rect x="0" y="2" width="30" height="7" /><rect x="0" y="19" width="26" height="7" /><rect x="0" y="36" width="30" height="7" />
        {/* L */}
        <rect x="46" y="2" width="8" height="41" /><rect x="46" y="36" width="30" height="7" />
        {/* Y */}
        <path d="M90 2h9l9 16 9-16h9l-14 23v18h-8V25z" />
        {/* O */}
        <path d="M156 2h26a6 6 0 0 1 6 6v29a6 6 0 0 1-6 6h-26a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6zm2 8v25h22V10z" />
        {/* N */}
        <path d="M204 43V2h8l20 27V2h8v41h-8l-20-27v27z" />
      </g>
      <text x="0" y="49.5" fontFamily="Inter, system-ui, sans-serif" fontWeight="500" fontSize="7.6" letterSpacing="4.1" fill={onNavy ? '#4FA5FF' : '#1E63D6'}>AERIAL SERVICES</text>
    </svg>
  )
}
