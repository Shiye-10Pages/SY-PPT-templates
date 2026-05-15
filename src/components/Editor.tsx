import { useCallback, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB — warn but don't block above this

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(r.error ?? new Error('FileReader failed'))
    r.onload = () => resolve(String(r.result ?? ''))
    r.readAsDataURL(file)
  })
}

function buildImageMarkdown(file: File, dataUrl: string): string {
  const altRaw = file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 40)
  const alt = altRaw.replace(/[[\]()]/g, '') || 'image'
  return `![${alt}](${dataUrl})`
}

export function Editor({ value, onChange, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = ref.current
      if (!ta) return
      const start = ta.selectionStart ?? value.length
      const end = ta.selectionEnd ?? value.length
      const before = value.slice(0, start)
      const after = value.slice(end)
      // Add a blank line padding so the image sits on its own paragraph.
      const needLead = before && !before.endsWith('\n') ? '\n\n' : before.endsWith('\n\n') ? '' : '\n'
      const needTrail = after.startsWith('\n') ? '' : '\n'
      const next = `${before}${needLead}${text}${needTrail}${after}`
      onChange(next)
      // Restore cursor after the inserted block on the next tick.
      const caret = before.length + needLead.length + text.length + needTrail.length
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(caret, caret)
      })
    },
    [onChange, value],
  )

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
      if (!arr.length) return
      for (const file of arr) {
        try {
          const dataUrl = await fileToDataUrl(file)
          if (file.size > MAX_BYTES) {
            console.warn(
              `[editor] inserted image ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)} MB — ` +
                `the exported HTML will be heavy.`,
            )
          }
          insertAtCursor(buildImageMarkdown(file, dataUrl))
        } catch (err) {
          console.error('[editor] failed to read image', file.name, err)
        }
      }
    },
    [insertAtCursor],
  )

  return (
    <div
      className={`relative h-full w-full ${dragOver ? 'ring-2 ring-inset ring-indigo-400/60' : ''}`}
      onDragEnter={e => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }
      }}
      onDragLeave={e => {
        // Only clear when leaving the wrapper itself, not its textarea child.
        if (e.target === e.currentTarget) setDragOver(false)
      }}
      onDrop={e => {
        if (!e.dataTransfer.files.length) return
        e.preventDefault()
        setDragOver(false)
        if (disabled) return
        void handleFiles(e.dataTransfer.files)
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        readOnly={disabled}
        spellCheck={false}
        onPaste={e => {
          const items = e.clipboardData?.items
          if (!items) return
          const imgs: File[] = []
          for (const item of Array.from(items)) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
              const f = item.getAsFile()
              if (f) imgs.push(f)
            }
          }
          if (imgs.length) {
            e.preventDefault()
            void handleFiles(imgs)
          }
        }}
        className="h-full w-full resize-none bg-neutral-950 p-6 font-mono text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-600 read-only:opacity-60"
        placeholder={`# 标题独占封面\n\n副标题或简介，第二行可写。\n\n---\n\n## 区块标题\n# 大段巨字内容\n\n---\n\n> 90%\n用户在第一屏就理解了产品\n\n---\n\n## 三个要点\n- 要点一\n- 要点二\n- 要点三\n\n(粘贴或拖拽图片到此处可直接插入 data URI)\n`}
      />
      {dragOver && (
        <div className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300/70 bg-indigo-500/10 text-sm text-indigo-100">
          松开以插入图片（自动转 data URI）
        </div>
      )}
    </div>
  )
}
