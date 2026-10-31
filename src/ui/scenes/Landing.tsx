import { useEffect, useRef } from 'react'
import { useFilm } from '@/lib/store'
import { sting } from '@/lib/audio'

/** Scene 10: the dawn happens in WebGL (sky, terrain, facades); here: the tab title and the mark sting */
export function Landing() {
  const stung = useRef(false)
  useEffect(() => {
    const base = document.title
    return useFilm.subscribe((s) => {
      if (s.pageProgress >= 0.995) { if (document.title !== 'Landed.') document.title = 'Landed.' } else if (document.title !== base) document.title = base
      if (s.progress > 0.985 && !stung.current && s.soundOn) { stung.current = true; sting() }
      if (s.progress < 0.9) stung.current = false
    })
  }, [])
  return null
}
