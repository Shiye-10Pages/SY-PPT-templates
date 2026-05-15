import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from './components/Editor'
import { DeckPreview } from './components/DeckPreview'
import { ExportBar } from './components/ExportBar'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { AspectSwitcher } from './components/AspectSwitcher'
import { parseAspectHint, parseMarkdown } from './parser/parseMarkdown'
import { DEFAULT_THEME_ID, getTheme, type SlideAspect } from './themes'
import { EXAMPLES, getExample } from './examples'

const ALL_EXAMPLE_BODIES = new Set(Object.values(EXAMPLES))

export default function App() {
  const [theme, setTheme] = useState(DEFAULT_THEME_ID)
  const [md, setMd] = useState(() => getExample(DEFAULT_THEME_ID))
  const [aspectOverride, setAspectOverride] = useState<SlideAspect | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const [pendingExample, setPendingExample] = useState<{ themeId: string; example: string } | null>(null)
  const deckRef = useRef<HTMLDivElement>(null)

  const themeMeta = getTheme(theme)
  const themeDefaultAspect: SlideAspect = themeMeta?.defaultAspect ?? '16:9'
  const frontmatterAspect = useMemo(() => parseAspectHint(md), [md])
  // Priority: explicit UI override > markdown `@ratio` frontmatter > theme default.
  const aspect: SlideAspect = aspectOverride ?? frontmatterAspect ?? themeDefaultAspect

  const slides = useMemo(() => parseMarkdown(md), [md])
  const title = useMemo(() => {
    const firstH1 = md.match(/^#\s+(.+)$/m)
    return firstH1?.[1].trim() || 'shi-ye-deck'
  }, [md])

  const handleThemeChange = useCallback(
    (id: string) => {
      setTheme(id)
      // Switching themes resets the manual aspect override so the new theme's
      // default takes effect; the user can re-override after if they want.
      setAspectOverride(null)
      const example = EXAMPLES[id]
      if (!example) return
      // If the user has edited away from any known example, ask before replacing.
      if (ALL_EXAMPLE_BODIES.has(md)) {
        setMd(example)
      } else {
        setPendingExample({ themeId: id, example })
      }
    },
    [md],
  )

  // Auto-dismiss pending example toast after 8 seconds.
  useEffect(() => {
    if (!pendingExample) return
    const t = setTimeout(() => setPendingExample(null), 8000)
    return () => clearTimeout(t)
  }, [pendingExample])

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold tracking-tight">十页 Deck</span>
          <span className="text-xs text-neutral-500">Markdown → 长页 + 卡片</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher value={theme} onChange={handleThemeChange} disabled={exportBusy} />
          <AspectSwitcher
            value={aspect}
            themeDefault={themeDefaultAspect}
            onChange={setAspectOverride}
            disabled={exportBusy}
          />
          <div className="h-5 w-px bg-white/10" />
          <ExportBar deckRef={deckRef} title={title} aspect={aspect} onBusyChange={setExportBusy} />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[420px_1fr]">
        <div className="min-h-0 border-r border-white/10">
          <Editor value={md} onChange={setMd} disabled={exportBusy} />
        </div>
        <div className="relative min-h-0">
          {slides.length > 0 ? (
            <DeckPreview slides={slides} theme={theme} aspect={aspect} deckRef={deckRef} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500">
              左侧粘贴 Markdown 即可预览
            </div>
          )}
          {pendingExample && (
            <div
              role="status"
              className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-neutral-900/95 px-4 py-2 text-xs text-neutral-200 shadow-lg backdrop-blur"
            >
              <span>应用该主题的示例内容？</span>
              <button
                type="button"
                onClick={() => {
                  setMd(pendingExample.example)
                  setPendingExample(null)
                }}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-black hover:bg-neutral-200"
              >
                应用
              </button>
              <button
                type="button"
                onClick={() => setPendingExample(null)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-neutral-300 hover:border-white/60"
              >
                保留当前
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
