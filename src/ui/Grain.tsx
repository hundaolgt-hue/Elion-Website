/** Film grain (3 %) and a Navy 900 vignette over footage and 3D alike, so both layers share one photographic finish */
export function Grain() {
  return (
    <div className="fixed inset-0 z-[4] pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(10,27,51,0.45) 100%)' }} />
      <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
        <filter id="elyon-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"><animate attributeName="seed" from="1" to="12" dur="0.6s" repeatCount="indefinite" /></feTurbulence><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#elyon-grain)" />
      </svg>
    </div>
  )
}
