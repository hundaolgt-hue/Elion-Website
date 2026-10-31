import { useEffect, useRef, useState } from 'react'
import { ICONS, type IconName } from './registry'

interface Props { name: IconName | string; size?: number; className?: string; draw?: boolean; title?: string; style?: React.CSSProperties }

/** Line icon that draws itself when it enters the viewport and then idles */
export function Icon({ name, size = 24, className = '', draw = true, title, style }: Props) {
  const ref = useRef<SVGSVGElement>(null)
  const [drawn, setDrawn] = useState(!draw)
  useEffect(() => {
    if (!draw || !ref.current) return
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { setDrawn(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [draw])
  const body = ICONS[name as IconName]
  return (
    <svg ref={ref} className={`icon ${drawn ? 'draw' : ''} ${className}`} width={size} height={size} viewBox="0 0 24 24" role={title ? 'img' : 'presentation'} aria-hidden={title ? undefined : true} style={{ ...style, opacity: drawn ? 1 : 0 }}>
      {title && <title>{title}</title>}
      {body}
    </svg>
  )
}
