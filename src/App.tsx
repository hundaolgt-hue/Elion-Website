import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { mountFilm } from '@/lib/film'
import { useFilm } from '@/lib/store'
import { Preloader } from '@/ui/Preloader'
import { Navbar } from '@/ui/Navbar'
import { ProgressRail } from '@/ui/ProgressRail'
import { Cursor } from '@/ui/Cursor'
import { Launch } from '@/ui/scenes/Launch'
import { Takeoff } from '@/ui/scenes/Takeoff'
import { Scan } from '@/ui/scenes/Scan'
import { Playground } from '@/ui/scenes/Playground'
import { Twin } from '@/ui/scenes/Twin'
import { Platform } from '@/ui/scenes/Platform'
import { Bim } from '@/ui/scenes/Bim'
import { Sync } from '@/ui/scenes/Sync'
import { CadastreUI } from '@/ui/scenes/CadastreUI'
import { Land } from '@/ui/scenes/Land'
import { Stack } from '@/ui/scenes/Stack'
import { Landing } from '@/ui/scenes/Landing'
import { About } from '@/ui/About'
import { FreeFlight, Favicon, Summary } from '@/ui/Delights'
import { FrameSequence } from '@/video/FrameSequence'
import { Grain } from '@/ui/Grain'
import { Reduced } from '@/ui/Reduced'
import { SceneLabels } from '@/ui/SceneLabels'
import { Story } from '@/ui/Story'

const Stage = lazy(() => import('@/three/Stage').then((m) => ({ default: m.Stage })))

export default function App() {
  const film = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [summary, setSummary] = useState(false)
  const reduced = useFilm((s) => s.reducedMotion)
  useEffect(() => {
    if (!film.current) return
    const un = mountFilm(film.current)
    return un
  }, [])
  const onDone = useCallback(() => setLoaded(true), [])
  return (
    <>
      <a className="skip-link" href="#about">Skip to about and contact</a>
      <a className="skip-link" href="#contact">Skip to contact</a>
      {!reduced && <Cursor />}
      <Favicon />
      <Suspense fallback={null}><Stage /></Suspense>
      <FrameSequence />
      {!reduced && <Grain />}
      <Preloader onDone={onDone} />
      <Navbar onSummary={() => setSummary(true)} />
      <Summary open={summary} onClose={() => setSummary(false)} />
      {!reduced && <ProgressRail />}
      {!reduced && <FreeFlight />}
      <main id="top">
        {/* The film: a 2,200 vh scroll container; everything the viewer sees is fixed and driven by its progress */}
        <div id="film" ref={film} className="relative" style={{ height: reduced ? '100vh' : '2200vh' }} role="region" aria-label="Elyon flight film">
          {reduced ? (
            <Reduced />
          ) : (
            <div className={loaded ? '' : 'invisible'}>
              <Launch loaded={loaded} /><Takeoff /><Scan /><Playground /><Twin /><Platform /><Bim /><Sync /><CadastreUI /><Land /><Stack /><Landing /><SceneLabels /><Story />
            </div>
          )}
        </div>
        <About />
      </main>
    </>
  )
}
