import { useEffect, useRef } from 'react'
import type { SlideAST } from '../parser/types'
import type { SlideAspect } from '../themes'
import { Slide } from './Slide'

/** FX flag names that map a CSS variable (`--fx-foo`) to a data attribute (`data-fx-foo`).
 * The CSS selectors in fx.css key off the data attributes; themes opt in via the CSS vars.
 * This bridge lets a theme declare its FX once, without touching component code. */
const FX_FLAGS = [
  'mouse-glow',
  'hover-lift',
  'bg-breathe',
  'accent-rule',
  'bignum-pop',
  'progress',
] as const

type Props = {
  slides: SlideAST[]
  theme: string
  aspect?: SlideAspect
  deckRef?: React.RefObject<HTMLDivElement | null>
}

const ASPECT_RATIO: Record<SlideAspect, number> = {
  '16:9': 16 / 9,
  '4:5': 4 / 5,
  '9:16': 9 / 16,
  '2.35:1': 2.35,
  '3:4': 3 / 4,
}

export function DeckPreview({ slides, theme, aspect = '16:9', deckRef }: Props) {
  const localRef = useRef<HTMLDivElement>(null)
  const ref = deckRef ?? localRef

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('slide-visible')
          }
        }
      },
      { threshold: 0.25, root },
    )
    const items = root.querySelectorAll<HTMLElement>('[data-slide-anim]')
    items.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [slides.length, ref])

  /* Promote each theme's `--fx-foo: 1` CSS var to a matching `data-fx-foo` attribute
   * on the deck root, so the selectors in fx.css can light up. Runs once per theme. */
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const cs = getComputedStyle(root)
    for (const name of FX_FLAGS) {
      const on = cs.getPropertyValue(`--fx-${name}`).trim() === '1'
      if (on) root.setAttribute(`data-fx-${name}`, '1')
      else root.removeAttribute(`data-fx-${name}`)
    }
  }, [theme, ref])

  /* Mouse glow: write normalised cursor position to `--mx`/`--my` on the deck root.
   * The corresponding fx.css rule reads those vars to position a radial-gradient
   * halo. Throttled via rAF. Cleaned up on unmount / theme change. */
  useEffect(() => {
    const root = ref.current
    if (!root) return
    let rafId = 0
    let pendingX = 0
    let pendingY = 0
    const onMove = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect()
      pendingX = (e.clientX - rect.left) / rect.width
      pendingY = (e.clientY - rect.top) / rect.height
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          root.style.setProperty('--mx', String(Math.max(0, Math.min(1, pendingX))))
          root.style.setProperty('--my', String(Math.max(0, Math.min(1, pendingY))))
          rafId = 0
        })
      }
    }
    root.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      root.removeEventListener('mousemove', onMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [ref, theme])

  const ratio = ASPECT_RATIO[aspect]
  const isVertical = ratio < 1
  const isPanorama = ratio > 2

  // For vertical / panorama aspects, slide width is constrained and centered inside the deck viewport.
  // For 16:9 or other near-square, slide fills viewport (existing behaviour).
  const slideShellClass = isVertical
    ? 'mx-auto flex h-full w-full snap-start items-center justify-center'
    : isPanorama
    ? 'mx-auto flex h-full w-full snap-start items-center justify-center'
    : 'h-full w-full snap-start'

  const slideInnerStyle: React.CSSProperties = isVertical
    ? { aspectRatio: String(ratio), height: '90%', maxHeight: '90%' }
    : isPanorama
    ? { aspectRatio: String(ratio), width: '92%', maxWidth: '92%' }
    : { width: '100%', height: '100%' }

  return (
    <div
      ref={ref}
      data-theme={theme}
      data-aspect={aspect}
      data-deck-root
      className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
      style={{ background: 'var(--bg)' }}
    >
      {slides.map((slide, i) => (
        <section
          key={i}
          data-slide
          className={slideShellClass}
          style={{ minHeight: '100%', height: '100%' }}
        >
          <div data-slide-inner style={slideInnerStyle}>
            <Slide slide={slide} index={i} total={slides.length} />
          </div>
        </section>
      ))}
    </div>
  )
}
