import { useEffect, useRef, useState } from 'react'
import type { SlideAspect } from '../themes'

type Props = {
  value: SlideAspect
  themeDefault: SlideAspect
  onChange: (v: SlideAspect) => void
  disabled?: boolean
}

type Option = {
  value: SlideAspect
  label: string
  px: string
  scene: string
}

const OPTIONS: Option[] = [
  { value: '16:9', label: '16:9', px: '1920×1080', scene: '横屏 / 投影 / Keynote' },
  { value: '4:5', label: '4:5', px: '1080×1350', scene: '朋友圈 / Instagram' },
  { value: '3:4', label: '3:4', px: '1080×1440', scene: '小红书' },
  { value: '9:16', label: '9:16', px: '1080×1920', scene: '抖音 / 视频号' },
  { value: '2.35:1', label: '2.35:1', px: '1880×800', scene: '公众号头图' },
]

function aspectGlyph(aspect: SlideAspect): { w: number; h: number } {
  switch (aspect) {
    case '16:9':   return { w: 18, h: 10 }
    case '4:5':    return { w: 12, h: 15 }
    case '3:4':    return { w: 12, h: 16 }
    case '9:16':   return { w: 9,  h: 16 }
    case '2.35:1': return { w: 20, h: 8 }
  }
}

function Glyph({ aspect }: { aspect: SlideAspect }) {
  const { w, h } = aspectGlyph(aspect)
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-sm border border-white/40 bg-white/10"
      style={{ width: w, height: h }}
    />
  )
}

export function AspectSwitcher({ value, themeDefault, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-200 hover:border-white/40 disabled:opacity-40"
      >
        <Glyph aspect={value} />
        <span className="tabular-nums">{value}</span>
        <span className="text-neutral-500">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-2xl border border-white/15 bg-neutral-950 p-2 shadow-2xl backdrop-blur">
          <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            导出比例
          </div>
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                opt.value === value
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="flex w-6 shrink-0 items-center justify-center">
                <Glyph aspect={opt.value} />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2 text-sm font-medium leading-tight">
                  <span className="tabular-nums">{opt.label}</span>
                  {opt.value === themeDefault && (
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] tracking-wider text-neutral-400">
                      主题默认
                    </span>
                  )}
                </span>
                <span className="truncate text-[11px] text-neutral-500">
                  {opt.px} · {opt.scene}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
