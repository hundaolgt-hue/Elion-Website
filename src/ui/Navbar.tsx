import { useEffect, useState } from 'react'
import { Wordmark } from '@/brand/Mark'
import { Icon } from '@/icons/Icon'
import { flyTo } from '@/lib/film'
import { useFilm } from '@/lib/store'
import { enableSound, disableSound } from '@/lib/audio'

const LINKS: [string, string][] = [['Services', 'scan'], ['Platform', 'twin'], ['Industries', 'land'], ['About', 'about']]

export function Navbar({ onSummary }: { onSummary: () => void }) {
  const soundOn = useFilm((s) => s.soundOn)
  const [light, setLight] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => useFilm.subscribe((s) => setLight(s.pageProgress > 0.855)), [])
  const go = (id: string) => {
    setOpen(false)
    if (id === 'about' || id === 'contact') document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    else flyTo(id)
  }
  const toggleSound = () => { if (soundOn) { disableSound(); useFilm.getState().set({ soundOn: false }) } else { enableSound(); useFilm.getState().set({ soundOn: true }) } }
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-700 ${light ? 'text-navy-900' : 'text-white'}`}>
      <div className="glass mx-auto flex items-center justify-between px-5 md:px-8 h-[72px]" style={{ background: light ? 'color-mix(in srgb, #ffffff 70%, transparent)' : undefined }}>
        <a href="#top" onClick={(e) => { e.preventDefault(); flyTo('launch') }} aria-label="Elyon Aerial Services, back to launch" className="flex items-center gap-3">
          <Wordmark height={28} onNavy={!light} />
        </a>
        <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
          {LINKS.map(([l, id]) => (
            <button key={l} type="button" onClick={() => go(id)} className="text-[13px] font-medium tracking-[0.04em] opacity-85 hover:opacity-100 hover:text-sky transition-colors">{l}</button>
          ))}
          <button type="button" onClick={() => go('contact')} className="text-[13px] font-medium tracking-[0.04em] opacity-85 hover:opacity-100 hover:text-sky transition-colors">Contact</button>
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          <button type="button" onClick={onSummary} className="hidden md:inline text-[12px] label hover:text-ice transition-colors" style={{ letterSpacing: '0.12em' }}>Skip to summary</button>
          <button type="button" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? 'Mute sound' : 'Enable sound'} className="w-10 h-10 rounded-full border border-sky/50 flex items-center justify-center hover:bg-elyon/40 transition-colors">
            <Icon name={soundOn ? 'sound' : 'soundOff'} size={18} draw={false} />
          </button>
          <button type="button" className={`pill magnet hidden sm:inline-flex ${light ? 'light' : ''}`} onClick={() => go('contact')}>Request a demo</button>
          <button type="button" className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="block w-5 h-px bg-current" /><span className="block w-5 h-px bg-current" />
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden glass px-6 py-6 flex flex-col gap-4 text-white">
          {[...LINKS, ['Contact', 'contact'] as [string, string]].map(([l, id]) => (
            <button key={l} type="button" onClick={() => go(id)} className="text-left text-lg font-medium py-2 min-h-[44px]">{l}</button>
          ))}
          <button type="button" onClick={() => { setOpen(false); onSummary() }} className="label text-left py-2 min-h-[44px]">Skip to summary</button>
        </div>
      )}
    </header>
  )
}
