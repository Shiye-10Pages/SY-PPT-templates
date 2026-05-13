import { useEffect, useMemo, useRef, useState } from 'react'
import { THEMES, TIER_LABEL, type ThemeMeta, type ThemeTier } from '../themes'

type Props = {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function ThemeSwitcher({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = THEMES.find(t => t.id === value)

  const grouped = useMemo(() => {
    const map = new Map<ThemeTier, ThemeMeta[]>()
    for (const t of THEMES) {
      const arr = map.get(t.tier) ?? []
      arr.push(t)
      map.set(t.tier, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [])

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
        <span className="flex gap-0.5">
          {current?.swatch.map((c, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c, boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
            />
          ))}
        </span>
        <span>{current?.name ?? value}</span>
        <span className="text-neutral-500">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[60vh] w-[360px] overflow-y-auto rounded-2xl border border-white/15 bg-neutral-950 p-2 shadow-2xl backdrop-blur">
          {grouped.map(([tier, list]) => (
            <div key={tier} className="mb-1 last:mb-0">
              <div className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Tier {tier} · {TIER_LABEL[tier]}
              </div>
              {list.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onChange(t.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                    t.id === value ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex shrink-0 gap-0.5">
                    {t.swatch.map((c, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full"
                        style={{ background: c, boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium leading-tight">{t.name}</span>
                    <span className="truncate text-[11px] text-neutral-500">{t.scene} · {t.defaultAspect}</span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
