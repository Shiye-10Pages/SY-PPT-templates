import { useEffect, useRef } from 'react'
import type { SlideAST } from '../parser/types'
import type { SlideAspect } from '../themes'
import { Slide } from './Slide'

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
