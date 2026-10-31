/**
 * The Elyon logo as supplied on the brand board, cleaned with background removal and traced to
 * vector (SVG): the star-drone mark, the ELYON wordmark with its three-bar E and AERIAL SERVICES.
 * `dark` variants carry white lettering for navy backgrounds; `light` variants keep the navy lettering.
 */
const RATIO = { lockup: 1350 / 1026, wordmark: 1350 / 354, mark: 891 / 677 }
export function Logo({ variant = 'lockup', onNavy = true, height = 28, className = '', alt = 'Elyon Aerial Services' }: { variant?: 'lockup' | 'wordmark' | 'mark'; onNavy?: boolean; height?: number; className?: string; alt?: string }) {
  const src = variant === 'mark' ? '/brand/mark.svg' : `/brand/${variant}-${onNavy ? 'dark' : 'light'}.svg`
  return <img src={src} alt={alt} height={height} width={Math.round(height * RATIO[variant])} className={className} style={{ height, width: 'auto', display: 'block' }} decoding="async" />
}
