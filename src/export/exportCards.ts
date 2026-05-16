import { toBlob } from 'html-to-image'
import JSZip from 'jszip'
import { ASPECT_TO_CARD_SIZE, type SlideAspect } from '../themes/types'

/** Get the rendered background color of the deck root, with a hard fallback. */
function deckBackground(deckRoot: HTMLElement): string {
  const cs = getComputedStyle(deckRoot)
  const bg = cs.backgroundColor
  if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') return '#0a0a0a'
  return bg
}

function resolveCardSize(deckRoot: HTMLElement): { w: number; h: number } {
  const aspect = (deckRoot.getAttribute('data-aspect') as SlideAspect | null) ?? '4:5'
  return ASPECT_TO_CARD_SIZE[aspect] ?? ASPECT_TO_CARD_SIZE['4:5']
}

/**
 * Render each slide section in the deck root to a PNG sized per the deck's data-aspect attribute.
 * Strategy: clone the slide-inner (or fallback to slide) into an off-screen container, snapshot.
 */
export async function exportCardsAsZip(deckRoot: HTMLElement): Promise<Blob> {
  const sections = Array.from(deckRoot.querySelectorAll<HTMLElement>('[data-slide]'))
  if (!sections.length) throw new Error('No slides to export')

  const theme = deckRoot.getAttribute('data-theme') ?? 'keynote-dark'
  const bg = deckBackground(deckRoot)
  const { w: CARD_W, h: CARD_H } = resolveCardSize(deckRoot)
  const zip = new JSZip()

  const stage = document.createElement('div')
  stage.setAttribute('data-theme', theme)
  stage.className = 'exporting'
  stage.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: ${CARD_W}px;
    height: ${CARD_H}px;
    background: ${bg};
    pointer-events: none;
    z-index: -1;
  `
  document.body.appendChild(stage)

  if ('fonts' in document) {
    try {
      await document.fonts.ready
    } catch {
      // ignore
    }
  }

  try {
    for (let i = 0; i < sections.length; i++) {
      // Prefer the inner aspect-constrained box; fall back to the whole section.
      const source = sections[i].querySelector<HTMLElement>('[data-slide-inner]') ?? sections[i]
      const clone = source.cloneNode(true) as HTMLElement
      clone.style.width = `${CARD_W}px`
      clone.style.height = `${CARD_H}px`
      clone.style.minHeight = `${CARD_H}px`
      stage.replaceChildren(clone)

      // Freeze entry animations.
      clone.querySelectorAll<HTMLElement>('[data-slide-anim]').forEach(el => {
        el.style.opacity = '1'
        el.style.transform = 'none'
        el.style.transition = 'none'
      })
      // Also freeze element-level animations (data-anim + data-delay) added in P1-B.
      clone.querySelectorAll<HTMLElement>('[data-anim]').forEach(el => {
        el.style.opacity = '1'
        el.style.transform = 'none'
        el.style.transition = 'none'
        el.style.animationDelay = '0s'
      })
      // For complex layout types (matrix, flow) that use overflow:hidden + border-radius,
      // ensure the clone doesn't clip content outside the card boundary.
      clone.style.overflow = 'visible'

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      const blob = await toBlob(stage, {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: 2,
        backgroundColor: bg,
        skipFonts: true,
      })
      if (!blob) throw new Error(`Slide ${i + 1} render failed`)
      zip.file(`${String(i + 1).padStart(2, '0')}.png`, blob)
    }
  } finally {
    stage.remove()
  }

  return zip.generateAsync({ type: 'blob' })
}

export async function exportSingleCard(
  slideEl: HTMLElement,
  theme: string,
  bg: string = '#0a0a0a',
  aspect: SlideAspect = '4:5',
): Promise<Blob> {
  const { w: CARD_W, h: CARD_H } = ASPECT_TO_CARD_SIZE[aspect]
  const stage = document.createElement('div')
  stage.setAttribute('data-theme', theme)
  stage.className = 'exporting'
  stage.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: ${CARD_W}px;
    height: ${CARD_H}px;
    background: ${bg};
    z-index: -1;
  `
  const clone = slideEl.cloneNode(true) as HTMLElement
  clone.style.width = `${CARD_W}px`
  clone.style.height = `${CARD_H}px`
  stage.appendChild(clone)
  document.body.appendChild(stage)
  try {
    clone.querySelectorAll<HTMLElement>('[data-slide-anim]').forEach(el => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    const blob = await toBlob(stage, {
      width: CARD_W,
      height: CARD_H,
      pixelRatio: 2,
      backgroundColor: bg,
    })
    if (!blob) throw new Error('Render failed')
    return blob
  } finally {
    stage.remove()
  }
}
