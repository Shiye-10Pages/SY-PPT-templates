import type { ReactNode } from 'react'
import type { SlideAST } from '../parser/types'
import { getIconSvg } from '../assets/icons'

const INLINE_ICON_RE = /:([a-z0-9-]+):/g

/**
 * Render a plain string into ReactNode where `:icon-name:` tokens become inline
 * SVG glyphs. Unknown names are kept verbatim. Used by text-heavy slide types
 * (cover subtitle, list items, section body, quote, etc).
 */
function renderInlineIcons(text: string): ReactNode {
  if (!text || !text.includes(':')) return text
  const parts: ReactNode[] = []
  let last = 0
  let key = 0
  for (const m of text.matchAll(INLINE_ICON_RE)) {
    const svg = getIconSvg(m[1])
    if (!svg) continue
    if (m.index! > last) parts.push(text.slice(last, m.index))
    parts.push(
      <span
        key={`ic-${key++}`}
        className="inline-flex items-center"
        style={{
          width: '1em',
          height: '1em',
          marginInline: '0.12em',
          color: 'var(--accent)',
          verticalAlign: '-0.15em',
        }}
        dangerouslySetInnerHTML={{
          __html: svg
            .replace('width="24"', 'width="100%"')
            .replace('height="24"', 'height="100%"'),
        }}
      />,
    )
    last = m.index! + m[0].length
  }
  if (last === 0) return text
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

type Props = {
  slide: SlideAST
  index: number
  total: number
}

export function Slide({ slide, index, total }: Props) {
  const isChapter = slide.type === 'chapter'

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        // chapter: accent color fills the full slide (true full-bleed, no letterbox bars).
        // All other types: theme gradient background.
        background: isChapter
          ? `color-mix(in srgb, var(--accent) 88%, var(--fg))`
          : 'linear-gradient(135deg, var(--bg-grad-from) 0%, var(--bg-grad-to) 100%)',
        color: isChapter ? 'var(--bg)' : 'var(--fg)',
        padding: 'var(--slide-padding)',
      }}
    >
      {/* Glow accent — skipped for chapter (it has a solid accent bg) */}
      {!isChapter && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 80% 20%, var(--accent-glow-1) 0%, transparent 60%), radial-gradient(50% 40% at 10% 90%, var(--accent-glow-2) 0%, transparent 55%)',
          }}
        />
      )}

      <div className="relative z-10 flex h-full w-full max-w-[1200px] flex-col" data-slide-anim>
        <SlideBody slide={slide} />
      </div>

      {/* Footer index */}
      <div
        className="absolute bottom-6 right-8 z-10 text-xs tracking-widest uppercase tabular-nums"
        style={{ color: isChapter ? 'color-mix(in srgb, var(--bg) 55%, transparent)' : 'var(--fg-muted)' }}
      >
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </div>
  )
}

function SlideBody({ slide }: { slide: SlideAST }) {
  switch (slide.type) {
    case 'cover':
      return (
        <div className="relative flex h-full flex-col justify-center">
          {slide.image && (
            <>
              <img
                src={slide.image}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-50"
                style={{ filter: 'saturate(0.95)' }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--bg) 35%, transparent) 0%, color-mix(in srgb, var(--bg) 75%, transparent) 100%)',
                }}
              />
            </>
          )}
          <div className="relative z-10">
            <div
              data-anim="fade-in"
              data-delay="0"
              className="mb-6 text-sm uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-muted)' }}
            >
              Cover
            </div>
            <h1
              data-anim="fade-up"
              data-delay="1"
              className="leading-[0.95]"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(48px, 13cqi, 140px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
              }}
            >
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p
                data-anim="fade-up"
                data-delay="2"
                className="mt-8 max-w-[820px] text-balance"
                style={{
                  fontSize: 'clamp(18px, 2.5cqi, 28px)',
                  color: 'var(--fg-muted)',
                  lineHeight: 1.5,
                }}
              >
                {renderInlineIcons(slide.subtitle)}
              </p>
            )}
          </div>
        </div>
      )

    case 'bigText':
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.eyebrow && (
            <div
              data-anim="fade-in"
              data-delay="0"
              className="mb-8 text-sm uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-muted)' }}
            >
              {slide.eyebrow}
            </div>
          )}
          <h2
            data-anim="fade-up"
            data-delay={slide.eyebrow ? '1' : '0'}
            className="text-balance"
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(40px, 11cqi, 120px)',
              fontWeight: 'var(--display-weight)',
              letterSpacing: 'var(--display-tracking)',
              lineHeight: 1.05,
            }}
          >
            {slide.text}
          </h2>
        </div>
      )

    case 'bigNumber':
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div
            data-anim="fade-up"
            data-delay="0"
            className="leading-none tabular-nums"
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(120px, 35cqi, 360px)',
              fontWeight: 900,
              letterSpacing: '-0.06em',
              color: 'var(--accent)',
            }}
          >
            {slide.value}
          </div>
          {slide.caption && (
            <div
              data-anim="fade-up"
              data-delay="1"
              className="mt-12 max-w-[820px] text-balance"
              style={{
                fontSize: 'clamp(18px, 3cqi, 32px)',
                color: 'var(--fg-muted)',
                lineHeight: 1.4,
              }}
            >
              {slide.caption}
            </div>
          )}
        </div>
      )

    case 'quote':
      return (
        <div className="flex h-full flex-col justify-center">
          <div
            data-anim="fade-in"
            data-delay="0"
            className="mb-8 leading-none"
            style={{
              fontSize: 'clamp(80px, 17.5cqi, 180px)',
              color: 'var(--accent)',
              fontFamily: 'var(--display-font)',
              fontWeight: 700,
            }}
          >
            "
          </div>
          <blockquote
            data-anim="fade-up"
            data-delay="1"
            className="text-balance"
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(28px, 6.5cqi, 64px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {slide.text}
          </blockquote>
          {slide.cite && (
            <div
              data-anim="fade-in"
              data-delay="2"
              className="mt-10 text-sm uppercase tracking-[0.25em]"
              style={{ color: 'var(--fg-muted)' }}
            >
              — {slide.cite}
            </div>
          )}
        </div>
      )

    case 'list': {
      const count = slide.items.length
      // Auto-fit: scale down text + gap when list is dense.
      const tight = count > 6
      const veryTight = count > 9
      const itemFs = veryTight
        ? 'clamp(14px, 2cqi, 22px)'
        : tight
        ? 'clamp(16px, 2.5cqi, 28px)'
        : 'clamp(20px, 3cqi, 36px)'
      const gap = veryTight ? '10px' : tight ? '14px' : '24px'
      const headingMb = veryTight ? '24px' : tight ? '36px' : '48px'
      const justify = count > 7 ? 'flex-start' : 'center'
      const topPad = count > 7 ? '6vh' : '0'
      return (
        <div
          className="flex h-full flex-col"
          style={{ justifyContent: justify, paddingTop: topPad }}
        >
          {slide.heading && (
            <h3
              data-anim="fade-up"
              data-delay="0"
              className="text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: tight ? 'clamp(28px, 5cqi, 52px)' : 'clamp(36px, 7cqi, 72px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
                marginBottom: headingMb,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <ul className="flex flex-col" style={{ gap }}>
            {slide.items.map((item, i) => (
              <li
                key={i}
                data-anim="fade-up"
                data-delay={String(Math.min(i + (slide.heading ? 1 : 0), 6))}
                className="flex items-baseline gap-6"
                style={{
                  fontSize: itemFs,
                  lineHeight: 1.4,
                }}
              >
                <span
                  className="shrink-0 tabular-nums"
                  style={{
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '0.75em',
                    fontFamily: 'var(--display-font)',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-balance">{renderInlineIcons(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    case 'section':
      if (slide.image) {
        return (
          <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-10">
            <img
              src={slide.image}
              alt=""
              className="h-full max-h-[80%] w-full self-center rounded-2xl object-cover"
              style={{ boxShadow: '0 24px 64px -32px rgba(0,0,0,0.4)' }}
            />
            <div className="flex flex-col justify-center">
              {slide.heading && (
                <h3
                  className="mb-6 text-balance"
                  style={{
                    fontFamily: 'var(--display-font)',
                    fontSize: 'clamp(28px, 5cqi, 56px)',
                    fontWeight: 'var(--display-weight)',
                    letterSpacing: 'var(--display-tracking)',
                    lineHeight: 1.1,
                  }}
                >
                  {slide.heading}
                </h3>
              )}
              <div
                className="whitespace-pre-wrap text-balance"
                style={{
                  fontSize: 'clamp(16px, 2.2cqi, 24px)',
                  color: 'var(--fg-muted)',
                  lineHeight: 1.55,
                }}
              >
                {slide.body}
              </div>
            </div>
          </div>
        )
      }
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              className="mb-8 text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(32px, 6.5cqi, 64px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div
            className="whitespace-pre-wrap text-balance"
            style={{
              fontSize: 'clamp(18px, 2.5cqi, 28px)',
              color: 'var(--fg-muted)',
              lineHeight: 1.55,
            }}
          >
            {slide.body}
          </div>
        </div>
      )

    case 'iconRow': {
      const count = Math.max(slide.items.length, 1)
      const isWide = count >= 4
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              className="mb-12 text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(32px, 6cqi, 60px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <ul
            className="grid gap-8"
            style={{
              gridTemplateColumns: `repeat(${Math.min(count, isWide ? 4 : 3)}, minmax(0, 1fr))`,
            }}
          >
            {slide.items.map((item, i) => {
              const svg = getIconSvg(item.icon)
              return (
                <li key={i} className="flex flex-col items-center gap-4 text-center">
                  <span
                    className="flex items-center justify-center rounded-2xl"
                    style={{
                      width: 'clamp(64px, 10cqi, 120px)',
                      height: 'clamp(64px, 10cqi, 120px)',
                      background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {svg ? (
                      <span
                        className="block"
                        style={{ width: '55%', height: '55%' }}
                        dangerouslySetInnerHTML={{
                          __html: svg
                            .replace('width="24"', 'width="100%"')
                            .replace('height="24"', 'height="100%"'),
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5em' }}>•</span>
                    )}
                  </span>
                  <span
                    className="text-balance"
                    style={{
                      fontSize: 'clamp(14px, 2.2cqi, 24px)',
                      lineHeight: 1.4,
                      fontWeight: 600,
                    }}
                  >
                    {renderInlineIcons(item.label)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )
    }

    case 'image':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6">
          <img
            src={slide.src}
            alt={slide.alt ?? ''}
            className="max-h-[78%] max-w-full rounded-2xl object-contain"
            style={{ boxShadow: '0 24px 64px -32px rgba(0,0,0,0.45)' }}
          />
          {slide.caption && (
            <div
              className="max-w-[820px] text-balance text-center"
              style={{
                fontSize: 'clamp(14px, 2cqi, 22px)',
                color: 'var(--fg-muted)',
                letterSpacing: '0.05em',
              }}
            >
              {slide.caption}
            </div>
          )}
        </div>
      )

    case 'priceCard':
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          {slide.title && (
            <div
              className="mb-6 max-w-[820px] text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(28px, 5cqi, 56px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.title}
            </div>
          )}
          <div className="flex items-baseline gap-3 tabular-nums">
            <span
              className="leading-none"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(40px, 7cqi, 72px)',
                fontWeight: 700,
              }}
            >
              ¥
            </span>
            <span
              className="leading-none"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(120px, 26cqi, 280px)',
                fontWeight: 900,
                letterSpacing: '-0.04em',
              }}
            >
              {slide.price}
            </span>
            {slide.unit && (
              <span
                className="leading-none"
                style={{
                  color: 'var(--fg-muted)',
                  fontSize: 'clamp(24px, 3cqi, 36px)',
                  fontWeight: 500,
                }}
              >
                / {slide.unit}
              </span>
            )}
          </div>
          {slide.originalPrice && (
            <div
              className="mt-6 line-through tabular-nums"
              style={{
                color: 'var(--fg-muted)',
                fontSize: 'clamp(20px, 3cqi, 32px)',
                fontWeight: 500,
              }}
            >
              原价 ¥{slide.originalPrice}
            </div>
          )}
          {slide.tagline && (
            <div
              className="mt-10 inline-block rounded-full px-6 py-2"
              style={{
                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
                fontSize: 'clamp(16px, 2.5cqi, 24px)',
                fontWeight: 600,
              }}
            >
              {slide.tagline}
            </div>
          )}
        </div>
      )

    case 'contact': {
      const iconFor = (k: typeof slide.channels[number]['kind']) =>
        k === 'phone' ? '📞'
        : k === 'wechat' ? '💬'
        : k === 'address' ? '📍'
        : k === 'website' ? '🌐'
        : k === 'email' ? '📧'
        : '•'
      const labelFor = (k: typeof slide.channels[number]['kind']) =>
        k === 'phone' ? '电话'
        : k === 'wechat' ? '微信'
        : k === 'address' ? '地址'
        : k === 'website' ? '网址'
        : k === 'email' ? '邮箱'
        : ''
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              className="mb-12 text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(32px, 6cqi, 64px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <ul className="flex flex-col" style={{ gap: '24px' }}>
            {slide.channels.map((c, i) => (
              <li
                key={i}
                className="flex items-center gap-5"
                style={{ fontSize: 'clamp(20px, 3cqi, 36px)' }}
              >
                <span
                  aria-hidden
                  className="shrink-0 text-2xl"
                  style={{ width: '2.4em', textAlign: 'center', fontSize: '1em' }}
                >
                  {iconFor(c.kind)}
                </span>
                <span
                  style={{
                    color: 'var(--fg-muted)',
                    fontSize: '0.65em',
                    width: '3em',
                    fontWeight: 500,
                  }}
                >
                  {c.label ?? labelFor(c.kind)}
                </span>
                <span
                  className="tabular-nums"
                  style={{ fontWeight: 600 }}
                >
                  {c.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    case 'qrCode':
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          {slide.label && (
            <div
              className="mb-8 text-sm uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-muted)' }}
            >
              {slide.label}
            </div>
          )}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 'min(50vh, 50vw)',
              height: 'min(50vh, 50vw)',
              background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
              border: '2px dashed color-mix(in srgb, var(--fg) 30%, transparent)',
              borderRadius: '24px',
            }}
          >
            {slide.src ? (
              <img
                src={slide.src}
                alt={slide.caption}
                style={{ width: '90%', height: '90%', objectFit: 'contain', borderRadius: '12px' }}
              />
            ) : (
              <div
                className="flex flex-col items-center gap-3"
                style={{ color: 'var(--fg-muted)', fontSize: 'clamp(14px, 2cqi, 20px)' }}
              >
                <div style={{ fontSize: '4em', lineHeight: 1 }}>⊞</div>
                <div>放置二维码</div>
              </div>
            )}
          </div>
          <div
            className="mt-12 max-w-[820px] text-balance"
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(24px, 4cqi, 44px)',
              fontWeight: 'var(--display-weight)',
              letterSpacing: 'var(--display-tracking)',
              lineHeight: 1.25,
            }}
          >
            {slide.caption}
          </div>
        </div>
      )

    case 'posterHero':
      return (
        <div className="relative flex h-full flex-col justify-center">
          {slide.image && (
            <>
              <img
                src={slide.image}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
                style={{ filter: 'saturate(1.05)' }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  background:
                    'linear-gradient(180deg, color-mix(in srgb, var(--bg) 10%, transparent) 0%, color-mix(in srgb, var(--bg) 60%, transparent) 70%, color-mix(in srgb, var(--bg) 80%, transparent) 100%)',
                }}
              />
            </>
          )}
          <div className="relative z-10 flex flex-col">
          {slide.countdown && (
            <div
              className="mb-6 inline-block self-start rounded-full px-5 py-1.5"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontSize: 'clamp(14px, 2cqi, 22px)',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {slide.countdown}
            </div>
          )}
          {slide.eyebrow && (
            <div
              className="mb-4 text-sm uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-muted)' }}
            >
              {slide.eyebrow}
            </div>
          )}
          <h2
            className="text-balance"
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(56px, 16cqi, 180px)',
              fontWeight: 'var(--display-weight)',
              letterSpacing: 'var(--display-tracking)',
              lineHeight: 0.95,
            }}
          >
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p
              className="mt-6 max-w-[820px] text-balance"
              style={{
                color: 'var(--fg-muted)',
                fontSize: 'clamp(20px, 3cqi, 36px)',
                lineHeight: 1.35,
              }}
            >
              {slide.subtitle}
            </p>
          )}
          {slide.cta && (
            <div
              className="mt-10 inline-block self-start rounded-full px-8 py-3"
              style={{
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontSize: 'clamp(18px, 2.5cqi, 28px)',
                fontWeight: 700,
              }}
            >
              {slide.cta}
            </div>
          )}
          </div>
        </div>
      )

    case 'chapter':
      // Background + color are applied at the Slide wrapper level (true full-bleed).
      // SlideBody only provides the centered content.
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          {slide.number && (
            <div
              className="mb-6 text-sm uppercase tracking-[0.35em]"
              style={{ opacity: 0.65 }}
            >
              Chapter {slide.number}
            </div>
          )}
          <h2
            className="text-balance"
            style={{
              fontFamily: 'var(--display-font)',
              fontSize: 'clamp(40px, 10cqi, 110px)',
              fontWeight: 'var(--display-weight)',
              letterSpacing: 'var(--display-tracking)',
              lineHeight: 1.05,
            }}
          >
            {slide.heading}
          </h2>
          {slide.sub && (
            <p
              className="mt-8 max-w-[820px] text-balance"
              style={{ fontSize: 'clamp(16px, 2.2cqi, 26px)', opacity: 0.75, lineHeight: 1.45 }}
            >
              {slide.sub}
            </p>
          )}
        </div>
      )

    case 'split': {
      const renderSide = (side: typeof slide.left) => (
        <div className="flex flex-col justify-center gap-6">
          {side.image && (
            <img
              src={side.image}
              alt=""
              className="w-full rounded-2xl object-cover"
              style={{ maxHeight: '55%', boxShadow: '0 20px 50px -24px rgba(0,0,0,0.35)' }}
            />
          )}
          {side.heading && (
            <h3
              className="text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(26px, 5cqi, 52px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {renderInlineIcons(side.heading)}
            </h3>
          )}
          {side.body && (
            <div
              className="whitespace-pre-wrap text-balance"
              style={{
                fontSize: 'clamp(16px, 2cqi, 24px)',
                color: 'var(--fg-muted)',
                lineHeight: 1.55,
              }}
            >
              {renderInlineIcons(side.body)}
            </div>
          )}
        </div>
      )
      const [colA, colB] = slide.reversed ? [slide.right, slide.left] : [slide.left, slide.right]
      return (
        <div
          className="grid h-full w-full items-center gap-10"
          style={{ gridTemplateColumns: '1fr 1px 1fr', padding: 'var(--slide-padding, 8vw)' }}
        >
          {renderSide(colA)}
          <div style={{ background: 'color-mix(in srgb, var(--fg) 15%, transparent)', height: '60%', width: '1px' }} />
          {renderSide(colB)}
        </div>
      )
    }

    case 'stats': {
      const ACCENT_COLORS = [
        'var(--accent)',
        'var(--accent-2)',
        'color-mix(in srgb, var(--accent) 60%, var(--accent-2))',
        'color-mix(in srgb, var(--accent-2) 70%, var(--fg))',
      ]
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              className="mb-10 text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(28px, 5cqi, 54px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${Math.min(slide.items.length, 4)}, minmax(0, 1fr))` }}
          >
            {slide.items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-2xl p-6"
                style={{
                  background: 'color-mix(in srgb, var(--fg) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                }}
              >
                <div
                  className="leading-none tabular-nums"
                  style={{
                    fontFamily: 'var(--display-font)',
                    fontSize: 'clamp(32px, 6cqi, 64px)',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: ACCENT_COLORS[i % ACCENT_COLORS.length],
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(13px, 1.8cqi, 20px)',
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
                </div>
                {item.note && (
                  <div
                    style={{
                      fontSize: 'clamp(11px, 1.4cqi, 16px)',
                      color: 'var(--fg-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.note}
                  </div>
                )}
                <div
                  style={{
                    height: '3px',
                    borderRadius: '999px',
                    background: ACCENT_COLORS[i % ACCENT_COLORS.length],
                    marginTop: 'auto',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'compare': {
      // Column A = "them" (muted/neutral card), Column B = "us" (accent card).
      // Strong card-level background contrast so columns read differently even on dark themes.
      const renderColumn = (col: typeof slide.a, variant: 'muted' | 'accent') => {
        const isMuted = variant === 'muted'
        const cardBg = isMuted
          ? 'color-mix(in srgb, var(--fg) 6%, transparent)'
          : 'color-mix(in srgb, var(--accent) 14%, transparent)'
        const cardBorder = isMuted
          ? '1px solid color-mix(in srgb, var(--fg) 12%, transparent)'
          : '1px solid color-mix(in srgb, var(--accent) 35%, transparent)'
        const headerBg = isMuted ? 'transparent' : 'var(--accent)'
        const headerColor = isMuted ? 'var(--fg-muted)' : 'var(--bg)'
        const headerBorder = isMuted ? '1px solid color-mix(in srgb, var(--fg) 25%, transparent)' : 'none'
        const markerColor = isMuted ? 'var(--fg-muted)' : 'var(--accent)'
        const marker = isMuted ? '–' : '✓'

        return (
          <div
            className="flex flex-col gap-5 rounded-2xl p-7"
            style={{ background: cardBg, border: cardBorder }}
          >
            <div
              className="self-start rounded-full px-5 py-1.5 text-sm font-semibold uppercase tracking-wider"
              style={{
                background: headerBg,
                border: headerBorder,
                color: headerColor,
                fontSize: 'clamp(11px, 1.4cqi, 14px)',
                letterSpacing: '0.1em',
              }}
            >
              {col.label}
            </div>
            <ul className="flex flex-col gap-4">
              {col.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3"
                  style={{ fontSize: 'clamp(14px, 2cqi, 22px)', lineHeight: 1.4 }}
                >
                  <span
                    style={{
                      color: markerColor,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontSize: isMuted ? '1em' : '0.9em',
                      marginTop: '0.1em',
                    }}
                  >
                    {marker}
                  </span>
                  <span style={{ color: isMuted ? 'var(--fg-muted)' : 'var(--fg)' }}>
                    {renderInlineIcons(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      }
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              className="mb-8 text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(28px, 5cqi, 54px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {renderColumn(slide.a, 'muted')}
            {renderColumn(slide.b, 'accent')}
          </div>
        </div>
      )
    }

    case 'chart': {
      const MAX_BAR = 100
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              className="mb-10 text-balance"
              style={{
                fontFamily: 'var(--display-font)',
                fontSize: 'clamp(28px, 5cqi, 54px)',
                fontWeight: 'var(--display-weight)',
                letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div
            className="flex flex-col gap-6 rounded-2xl p-8"
            style={{
              background: 'color-mix(in srgb, var(--fg) 5%, transparent)',
              border: '1px solid color-mix(in srgb, var(--fg) 8%, transparent)',
            }}
          >
            {slide.items.map((item, i) => (
              <div key={i} className="flex items-center gap-6">
                <div
                  className="shrink-0 text-right tabular-nums"
                  style={{
                    width: 'clamp(110px, 20cqi, 240px)',
                    fontSize: 'clamp(13px, 1.8cqi, 20px)',
                    fontWeight: 600,
                    color: 'var(--fg-muted)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="relative flex-1 overflow-hidden rounded-full"
                  style={{
                    height: 'clamp(32px, 5cqi, 52px)',
                    background: 'color-mix(in srgb, var(--fg) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--fg) 14%, transparent)',
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, (item.value / MAX_BAR) * 100)}%`,
                      background: `color-mix(in srgb, var(--accent) ${Math.max(45, 90 - i * 12)}%, var(--accent-2, var(--fg-muted)))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '1rem',
                      transition: 'width 900ms cubic-bezier(0.2, 0.7, 0.1, 1)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(12px, 1.6cqi, 18px)',
                        fontWeight: 700,
                        color: 'var(--bg)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.displayValue}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'toc': {
      const cols = Math.min(slide.items.length, 3)
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              data-anim="fade-up" data-delay="0"
              className="mb-8 text-balance"
              style={{
                fontFamily: 'var(--display-font)', fontSize: 'clamp(28px,5cqi,52px)',
                fontWeight: 'var(--display-weight)', letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {slide.items.map((item, i) => (
              <div
                key={i}
                data-anim="fade-up"
                data-delay={String(Math.min(i + 1, 6))}
                className="flex flex-col gap-2 rounded-2xl p-5"
                style={{
                  background: 'color-mix(in srgb, var(--fg) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--fg) 10%, transparent)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--display-font)', fontWeight: 700,
                    fontSize: 'clamp(18px,3.5cqi,36px)', color: 'var(--accent)',
                    letterSpacing: '-0.03em', lineHeight: 1,
                  }}
                >
                  {item.num}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--display-font)', fontWeight: 'var(--display-weight)',
                    fontSize: 'clamp(16px,2.5cqi,26px)', lineHeight: 1.2,
                  }}
                >
                  {item.title}
                </span>
                {item.sub && (
                  <span style={{ fontSize: 'clamp(12px,1.6cqi,16px)', color: 'var(--fg-muted)', lineHeight: 1.4 }}>
                    {item.sub}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'flow': {
      const isV = slide.direction === 'vertical'
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              data-anim="fade-up" data-delay="0"
              className="mb-8 text-balance"
              style={{
                fontFamily: 'var(--display-font)', fontSize: 'clamp(28px,5cqi,52px)',
                fontWeight: 'var(--display-weight)', letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div
            className={isV ? 'flex flex-col gap-0' : 'flex items-start gap-0'}
            style={{ overflowX: isV ? 'visible' : 'auto' }}
          >
            {slide.steps.map((step, i) => (
              <div
                key={i}
                data-anim="fade-up"
                data-delay={String(Math.min(i + 1, 6))}
                className={isV ? 'flex items-start gap-4' : 'flex flex-col items-center'}
                style={{ flex: isV ? undefined : '1 1 0', minWidth: isV ? undefined : 'clamp(100px,15cqi,200px)' }}
              >
                {/* Node */}
                <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 'clamp(44px,6cqi,64px)', height: 'clamp(44px,6cqi,64px)',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      border: '3px solid color-mix(in srgb, var(--accent) 60%, var(--bg))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--display-font)', fontWeight: 800,
                      fontSize: 'clamp(14px,2cqi,22px)', color: 'var(--bg)',
                      boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  {/* Connector line — between nodes */}
                  {i < slide.steps.length - 1 && (
                    <div
                      aria-hidden
                      style={{
                        position: 'absolute',
                        ...(isV
                          ? { top: '100%', left: '50%', transform: 'translateX(-50%)', width: '3px', height: 'clamp(24px,4cqi,48px)' }
                          : { left: '100%', top: '50%', transform: 'translateY(-50%)', height: '3px', width: '100%' }),
                        background: 'linear-gradient(to right, var(--accent), color-mix(in srgb, var(--accent) 40%, transparent))',
                        borderRadius: '999px',
                      }}
                    />
                  )}
                </div>
                {/* Label + desc */}
                <div
                  className={isV ? 'pb-8' : 'mt-4 text-center px-2'}
                  style={{ flex: isV ? 1 : undefined }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--display-font)', fontWeight: 700,
                      fontSize: 'clamp(14px,2.2cqi,22px)', lineHeight: 1.25,
                    }}
                  >
                    {renderInlineIcons(step.label)}
                  </div>
                  {step.desc && (
                    <div style={{ fontSize: 'clamp(11px,1.5cqi,16px)', color: 'var(--fg-muted)', lineHeight: 1.4, marginTop: '0.35rem' }}>
                      {renderInlineIcons(step.desc)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'timeline': {
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              data-anim="fade-up" data-delay="0"
              className="mb-8 text-balance"
              style={{
                fontFamily: 'var(--display-font)', fontSize: 'clamp(28px,5cqi,52px)',
                fontWeight: 'var(--display-weight)', letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div className="flex flex-col gap-0">
            {slide.events.map((ev, i) => (
              <div
                key={i}
                data-anim="fade-up"
                data-delay={String(Math.min(i + 1, 6))}
                className="flex items-start gap-6"
                style={{ paddingBottom: i < slide.events.length - 1 ? 'clamp(20px,3.5cqi,40px)' : 0, position: 'relative' }}
              >
                {/* Left: date + vertical track */}
                <div className="flex flex-col items-center" style={{ flexShrink: 0, width: 'clamp(80px,14cqi,160px)' }}>
                  <div
                    style={{
                      fontFamily: 'var(--display-font)', fontWeight: 700,
                      fontSize: 'clamp(13px,2cqi,22px)', color: 'var(--accent)',
                      letterSpacing: '-0.02em', lineHeight: 1, textAlign: 'right', width: '100%',
                    }}
                  >
                    {ev.date}
                  </div>
                  {i < slide.events.length - 1 && (
                    <div
                      aria-hidden
                      style={{
                        width: '3px', flex: 1, marginTop: '8px',
                        background: 'linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 20%, transparent))',
                        borderRadius: '999px', minHeight: 'clamp(20px,3cqi,40px)',
                      }}
                    />
                  )}
                </div>
                {/* Dot */}
                <div
                  style={{
                    width: 'clamp(12px,2cqi,18px)', height: 'clamp(12px,2cqi,18px)',
                    borderRadius: '50%', background: 'var(--accent)', flexShrink: 0,
                    marginTop: '3px',
                    boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent)',
                  }}
                />
                {/* Right: title + desc */}
                <div className="flex flex-col gap-1" style={{ paddingBottom: 'inherit' }}>
                  <div
                    style={{
                      fontFamily: 'var(--display-font)', fontWeight: 700,
                      fontSize: 'clamp(16px,2.5cqi,28px)', lineHeight: 1.2,
                    }}
                  >
                    {renderInlineIcons(ev.title)}
                  </div>
                  {ev.desc && (
                    <div style={{ fontSize: 'clamp(12px,1.6cqi,18px)', color: 'var(--fg-muted)', lineHeight: 1.45 }}>
                      {renderInlineIcons(ev.desc)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'matrix': {
      const colCount = slide.cols.length
      const VALUE_STYLES: Record<string, { icon: string; color: string }> = {
        yes:     { icon: '✓', color: 'var(--accent)' },
        no:      { icon: '✗', color: 'var(--fg-muted)' },
        partial: { icon: '◐', color: 'var(--accent-2, var(--fg-muted))' },
      }
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.heading && (
            <h3
              data-anim="fade-up" data-delay="0"
              className="mb-6 text-balance"
              style={{
                fontFamily: 'var(--display-font)', fontSize: 'clamp(26px,4.5cqi,50px)',
                fontWeight: 'var(--display-weight)', letterSpacing: 'var(--display-tracking)',
                lineHeight: 1.1,
              }}
            >
              {slide.heading}
            </h3>
          )}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid color-mix(in srgb, var(--fg) 12%, transparent)' }}
          >
            {/* Header row */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `1fr ${Array(colCount).fill('minmax(0,1fr)').join(' ')}`,
                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                borderBottom: '2px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              }}
            >
              <div style={{ padding: 'clamp(10px,1.5cqi,16px) clamp(12px,2cqi,20px)' }} />
              {slide.cols.map((col, ci) => (
                <div
                  key={ci}
                  style={{
                    padding: 'clamp(10px,1.5cqi,16px) clamp(8px,1.2cqi,14px)',
                    fontFamily: 'var(--display-font)', fontWeight: 700,
                    fontSize: 'clamp(12px,1.8cqi,18px)', textAlign: 'center',
                    color: 'var(--accent)', letterSpacing: '-0.01em',
                  }}
                >
                  {col}
                </div>
              ))}
            </div>
            {/* Data rows */}
            {slide.rows.map((row, ri) => (
              <div
                key={ri}
                data-anim="fade-up"
                data-delay={String(Math.min(ri + 1, 6))}
                className="grid"
                style={{
                  gridTemplateColumns: `1fr ${Array(colCount).fill('minmax(0,1fr)').join(' ')}`,
                  background: ri % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--fg) 3%, transparent)',
                  borderBottom: ri < slide.rows.length - 1 ? '1px solid color-mix(in srgb, var(--fg) 8%, transparent)' : 'none',
                }}
              >
                <div
                  style={{
                    padding: 'clamp(10px,1.5cqi,16px) clamp(12px,2cqi,20px)',
                    fontWeight: 600, fontSize: 'clamp(12px,1.8cqi,18px)', lineHeight: 1.3,
                  }}
                >
                  {renderInlineIcons(row.label)}
                </div>
                {row.values.map((val, vi) => {
                  const style = VALUE_STYLES[val]
                  return (
                    <div
                      key={vi}
                      style={{
                        padding: 'clamp(10px,1.5cqi,16px) clamp(8px,1.2cqi,14px)',
                        textAlign: 'center', fontSize: 'clamp(14px,2cqi,22px)',
                        fontWeight: 700,
                        color: style ? style.color : 'var(--fg)',
                      }}
                    >
                      {style ? style.icon : val}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
}
