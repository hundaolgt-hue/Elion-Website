/**
 * The Elyon logo exactly as supplied on the brand board, extracted with transparency:
 * the star-drone mark, the ELYON wordmark with its three-bar E and AERIAL SERVICES beneath.
 * `dark` variants carry white lettering for navy backgrounds; `light` variants keep the navy lettering.
 */
export function Logo({ variant = 'lockup', onNavy = true, height = 28, className = '', alt = 'Elyon Aerial Services' }: { variant?: 'lockup' | 'wordmark' | 'mark'; onNavy?: boolean; height?: number; className?: string; alt?: string }) {
  const src = variant === 'mark' ? '/brand/mark.png' : `/brand/${variant}-${onNavy ? 'dark' : 'light'}.png`
  const ratio = variant === 'mark' ? 580 / 456 : variant === 'wordmark' ? 900 / 224 : 900 / 684
  return <img src={src} alt={alt} height={height} width={Math.round(height * ratio)} className={className} style={{ height, width: 'auto', display: 'block' }} decoding="async" />
}
