import { useEffect, useState } from 'react'
import { exportHtml } from '../export/exportHtml'
import { exportCardsAsZip } from '../export/exportCards'
import type { SlideAspect } from '../themes'

type Props = {
  deckRef: React.RefObject<HTMLDivElement | null>
  title?: string
  aspect?: SlideAspect
  onBusyChange?: (busy: boolean) => void
}

const RESERVED_WIN = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[\x00-\x1f\x7f\\/:*?"<>|\s]/g

function safeFilename(s: string | undefined, fallback = 'deck'): string {
  if (!s) return fallback
  const replaced = s.replace(UNSAFE_CHARS, '-')
  const collapsed = replaced.replace(/-+/g, '-')
  const stripped = collapsed.replace(/^[.\-_]+|[.\-_]+$/g, '').slice(0, 60)
  if (!stripped || RESERVED_WIN.test(stripped)) return fallback
  return stripped
}

// `aspect` is read off the deck root at export time; the prop is here so the bar
// can show an aspect-aware label like "导出 16 张卡片 (1080×1350)".
export function ExportBar({ deckRef, title, aspect, onBusyChange }: Props) {
  const baseName = safeFilename(title)
  const [busy, setBusy] = useState<null | 'html' | 'zip'>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onBusyChange?.(busy !== null)
  }, [busy, onBusyChange])

  async function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleHtml() {
    const root = deckRef.current
    if (!root) return
    setBusy('html')
    setError(null)
    try {
      const html = exportHtml(root, { title })
      await downloadBlob(new Blob([html], { type: 'text/html' }), `${baseName}.html`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  async function handleZip() {
    const root = deckRef.current
    if (!root) return
    setBusy('zip')
    setError(null)
    try {
      const blob = await exportCardsAsZip(root)
      await downloadBlob(blob, `${baseName}-cards.zip`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleHtml}
        disabled={busy !== null}
        className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-neutral-200 transition hover:border-white/60 disabled:opacity-50"
      >
        {busy === 'html' ? '导出中…' : '下载 HTML'}
      </button>
      <button
        type="button"
        onClick={handleZip}
        disabled={busy !== null}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {busy === 'zip' ? '生成卡片…' : `导出卡片${aspect ? ` (${aspect})` : ''}`}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
