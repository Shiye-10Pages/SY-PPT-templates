import type { SlideAST } from '../parser/types'

type Props = {
  slide: SlideAST
  index: number
  total: number
}

export function Slide({ slide, index, total }: Props) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, var(--bg-grad-from) 0%, var(--bg-grad-to) 100%)',
        color: 'var(--fg)',
        padding: 'var(--slide-padding)',
      }}
    >
      {/* Glow accent (suppressed per-theme via transparent rgba) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 80% 20%, var(--accent-glow-1) 0%, transparent 60%), radial-gradient(50% 40% at 10% 90%, var(--accent-glow-2) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex h-full w-full max-w-[1200px] flex-col" data-slide-anim>
        <SlideBody slide={slide} />
      </div>

      {/* Footer index */}
      <div
        className="absolute bottom-6 right-8 z-10 text-xs tracking-widest uppercase tabular-nums"
        style={{ color: 'var(--fg-muted)' }}
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
        <div className="flex h-full flex-col justify-center">
          <div
            className="mb-6 text-sm uppercase tracking-[0.3em]"
            style={{ color: 'var(--fg-muted)' }}
          >
            Cover
          </div>
          <h1
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
              className="mt-8 max-w-[820px] text-balance"
              style={{
                fontSize: 'clamp(18px, 2.5cqi, 28px)',
                color: 'var(--fg-muted)',
                lineHeight: 1.5,
              }}
            >
              {slide.subtitle}
            </p>
          )}
        </div>
      )

    case 'bigText':
      return (
        <div className="flex h-full flex-col justify-center">
          {slide.eyebrow && (
            <div
              className="mb-8 text-sm uppercase tracking-[0.3em]"
              style={{ color: 'var(--fg-muted)' }}
            >
              {slide.eyebrow}
            </div>
          )}
          <h2
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
            className="mb-8 leading-none"
            style={{
              fontSize: 'clamp(80px, 17.5cqi, 180px)',
              color: 'var(--accent)',
              fontFamily: 'var(--display-font)',
              fontWeight: 700,
            }}
          >
            “
          </div>
          <blockquote
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
                <span className="text-balance">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    case 'section':
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
        <div className="flex h-full flex-col justify-center">
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
      )
  }
}
