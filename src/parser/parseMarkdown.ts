import type { ContactChannel, SlideAST } from './types'
import type { SlideAspect } from '../themes/types'

const ASPECT_DIRECTIVE_RE = /^@ratio\s+(16:9|4:5|9:16|2\.35:1|3:4)\s*$/i

/** Read the optional `@ratio 9:16` frontmatter from the first non-empty line. */
export function parseAspectHint(md: string): SlideAspect | undefined {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  if (i >= lines.length) return undefined
  const m = lines[i].trim().match(ASPECT_DIRECTIVE_RE)
  return m ? (m[1] as SlideAspect) : undefined
}

/** Remove the `@ratio` frontmatter line so it never reaches slide chunking. */
function stripFrontmatter(md: string): string {
  const normalized = md.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  let i = 0
  while (i < lines.length && !lines[i].trim()) i++
  if (i < lines.length && ASPECT_DIRECTIVE_RE.test(lines[i].trim())) {
    return lines.slice(i + 1).join('\n')
  }
  return normalized
}

/**
 * Split markdown into per-slide chunks.
 * - Primary: `---` on its own line (with optional surrounding whitespace).
 * - Fallback: if no `---` present, split before each `## ` heading (keeping the heading).
 */
function splitChunks(md: string): string[] {
  const normalized = md.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const hrParts = normalized
    .split(/^[ \t]*---[ \t]*$/m)
    .map(s => s.trim())
    .filter(Boolean)

  if (hrParts.length > 1) return hrParts

  const lines = normalized.split('\n')
  const chunks: string[] = []
  let buf: string[] = []
  for (const line of lines) {
    if (/^##\s+/.test(line) && buf.length > 0) {
      chunks.push(buf.join('\n').trim())
      buf = []
    }
    buf.push(line)
  }
  if (buf.length > 0) chunks.push(buf.join('\n').trim())
  return chunks.filter(Boolean)
}

const IMAGE_LINE_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/

/**
 * Pull the first markdown-image line (`![alt](url)`) out of a chunk's lines.
 * Returns the extracted image (if any) plus the remaining lines (image line removed).
 */
function extractImage(lines: string[]): { image?: { src: string; alt?: string }; rest: string[] } {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(IMAGE_LINE_RE)
    if (m) {
      const alt = m[1].trim() || undefined
      const src = m[2].trim()
      const rest = [...lines.slice(0, i), ...lines.slice(i + 1)]
      return { image: { src, alt }, rest }
    }
  }
  return { rest: lines }
}

const BIG_NUMBER_RE = /^[$￥]?\s*[+-]?\d+(?:[.,]\d+)?\s*(?:[%×]|[xXKMBkmb])?\s*$/
const PRICE_RE = /^(?:[¥$￥]|RMB|￥)\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:\/\s*(.+))?$/i
const STRIKE_RE = /^~~\s*(?:原价\s*)?[¥$￥]?\s*([0-9]+(?:[.,][0-9]+)?)\s*~~$/
const CONTACT_PREFIX_RE = /^(📞|☎️|💬|📍|🌐|📧|✉️|☎)\s*(.*)$/u
const CONTACT_LABEL_RE = /^(电话|手机|微信|地址|网址|官网|邮箱|微博|抖音|公众号)\s*[:：]\s*(.+)$/

function parsePriceChunk(lines: string[]): SlideAST | null {
  // Find at least one price-shaped line.
  let title: string | undefined
  let price: string | undefined
  let unit: string | undefined
  let originalPrice: string | undefined
  let tagline: string | undefined

  for (const line of lines) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !title && !price) {
      title = h[1].trim()
      continue
    }
    const p = line.match(PRICE_RE)
    if (p && !price) {
      price = p[1]
      unit = p[2]?.trim()
      continue
    }
    const s = line.match(STRIKE_RE)
    if (s && !originalPrice) {
      originalPrice = s[1]
      continue
    }
    if (price && !tagline) {
      tagline = line.trim()
    }
  }

  if (!price) return null
  return { type: 'priceCard', title, price, originalPrice, unit, tagline }
}

function parseContactChunk(lines: string[]): SlideAST | null {
  const channels: ContactChannel[] = []
  let heading: string | undefined

  for (const line of lines) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && channels.length === 0) {
      heading = h[1].trim()
      continue
    }
    const emo = line.match(CONTACT_PREFIX_RE)
    if (emo) {
      const symbol = emo[1]
      const value = emo[2].trim()
      const kind: ContactChannel['kind'] =
        symbol === '📞' || symbol === '☎️' || symbol === '☎' ? 'phone'
        : symbol === '💬' ? 'wechat'
        : symbol === '📍' ? 'address'
        : symbol === '🌐' ? 'website'
        : symbol === '📧' || symbol === '✉️' ? 'email'
        : 'other'
      channels.push({ kind, value })
      continue
    }
    const lab = line.match(CONTACT_LABEL_RE)
    if (lab) {
      const k = lab[1]
      const kind: ContactChannel['kind'] =
        k === '电话' || k === '手机' ? 'phone'
        : k === '微信' ? 'wechat'
        : k === '地址' ? 'address'
        : k === '网址' || k === '官网' ? 'website'
        : k === '邮箱' ? 'email'
        : 'other'
      channels.push({ kind, value: lab[2].trim(), label: k })
      continue
    }
    return null
  }

  if (channels.length === 0) return null
  return { type: 'contact', heading, channels }
}

function parseQrChunk(lines: string[]): SlideAST {
  // Strip the leading `@qr` directive.
  const body = lines.slice(1).filter(l => l.trim())
  // First line = caption (call-to-action). Second line (if present) = label (store name).
  const caption = body[0] ?? '扫码联系我们'
  const label = body[1]
  // Optional Markdown image: ![alt](url)
  let src: string | undefined
  for (const l of body) {
    const m = l.match(/^!\[[^\]]*\]\(([^)]+)\)$/)
    if (m) {
      src = m[1]
      break
    }
  }
  return { type: 'qrCode', caption, label, src }
}

function parsePosterChunk(lines: string[]): SlideAST {
  // Lines after the `@poster` directive. Strip any `![](...)` image and remember it.
  const { image, rest: body } = extractImage(lines.slice(1))
  let eyebrow: string | undefined
  let title = ''
  let subtitle: string | undefined
  let cta: string | undefined
  let countdown: string | undefined

  for (const line of body) {
    if (!line.trim()) continue
    const big = line.match(/^#\s+(.+)$/)
    if (big && !title) {
      title = big[1].trim()
      continue
    }
    const ctaMatch = line.match(/^\[(.+)\]$/)
    if (ctaMatch && !cta) {
      cta = ctaMatch[1].trim()
      continue
    }
    if (!title && !eyebrow) {
      // Pre-title line is the eyebrow / countdown.
      eyebrow = line.trim()
      continue
    }
    if (title && !subtitle) {
      subtitle = line.trim()
      continue
    }
    if (title && subtitle && !countdown) {
      countdown = line.trim()
    }
  }

  if (eyebrow && /^(今晚|明天|后天|周|月|\d)/.test(eyebrow)) {
    countdown = eyebrow
    eyebrow = undefined
  }

  return { type: 'posterHero', eyebrow, title, subtitle, cta, countdown, image: image?.src }
}

/** `@icons` directive: a row of icon-label pairs. Body lines look like `- :icon-name: label text`. */
function parseIconsChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  const items: { icon: string; label: string }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && items.length === 0) {
      heading = h[1].trim()
      continue
    }
    // accept `- :icon: label` or `:icon: label`
    const item = line
      .replace(/^[-*+]\s+/, '')
      .trim()
      .match(/^:([a-z0-9-]+):\s*(.*)$/i)
    if (item) {
      items.push({ icon: item[1].toLowerCase(), label: item[2].trim() })
    }
  }
  return { type: 'iconRow', heading, items }
}

/** `@image <url>` directive: a single-image slide with optional caption line below. */
function parseImageChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let src: string | undefined
  let alt: string | undefined
  let caption: string | undefined
  for (const line of body) {
    if (!line.trim()) continue
    const md = line.trim().match(IMAGE_LINE_RE)
    if (md && !src) {
      src = md[2].trim()
      alt = md[1].trim() || undefined
      continue
    }
    if (!src && /^https?:\/\//.test(line.trim())) {
      src = line.trim()
      continue
    }
    if (!src && line.trim().startsWith('data:')) {
      src = line.trim()
      continue
    }
    if (src && !caption) {
      caption = line.trim()
    }
  }
  return { type: 'image', src: src ?? '', alt, caption }
}

/** `@chapter` directive: dark-invert section divider with optional sub-text. */
function parseChapterChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading = ''
  let sub: string | undefined
  let number: string | undefined
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading) { heading = h[1].trim(); continue }
    const n = line.match(/^#\s+(.+)$/)
    if (n && !heading) { heading = n[1].trim(); continue }
    if (!heading) { heading = line.trim(); continue }
    if (!sub) sub = line.trim()
  }
  // If heading looks like a number prefix (e.g. "01 章节名"), split it.
  const numMatch = heading.match(/^(\d{1,2})\s+(.+)$/)
  if (numMatch) { number = numMatch[1]; heading = numMatch[2] }
  return { type: 'chapter', heading, sub, number }
}

/** `@split` directive: two equal columns separated by `|||` on its own line. */
function parseSplitChunk(lines: string[]): SlideAST {
  const reversed = lines[1]?.trim().toLowerCase() === 'reversed'
  const body = reversed ? lines.slice(2) : lines.slice(1)
  const dividerIdx = body.findIndex(l => l.trim() === '|||')
  const leftLines = dividerIdx >= 0 ? body.slice(0, dividerIdx) : body
  const rightLines = dividerIdx >= 0 ? body.slice(dividerIdx + 1) : []

  function parseSide(sideLines: string[]) {
    let heading: string | undefined
    const { image, rest } = extractImage(sideLines)
    for (const l of rest) {
      const h = l.match(/^##\s+(.+)$/)
      if (h && !heading) { heading = h[1].trim() }
    }
    const bodyLines = rest.filter(l => l.trim() && !/^##\s+/.test(l))
    return { heading, body: bodyLines.join('\n').trim(), image: image?.src }
  }

  return { type: 'split', left: parseSide(leftLines), right: parseSide(rightLines), reversed }
}

/** `@stats` directive: KPI grid with `- value / label / note` rows. */
function parseStatsChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  const items: { value: string; label: string; note?: string }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && items.length === 0) { heading = h[1].trim(); continue }
    const raw = line.replace(/^[-*+]\s+/, '').trim()
    const parts = raw.split('/').map(p => p.trim())
    if (parts.length >= 2) {
      items.push({ value: parts[0], label: parts[1], note: parts[2] || undefined })
    }
  }
  return { type: 'stats', heading, items }
}

/** `@compare` directive: two columns separated by `||| Label` markers. */
function parseCompareChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  let aLabel = 'A'
  let bLabel = 'B'
  const aItems: string[] = []
  const bItems: string[] = []
  let current: 'a' | 'b' | null = null

  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && current === null) { heading = h[1].trim(); continue }
    const colMatch = line.match(/^\|\|\|\s*(.*)$/)
    if (colMatch) {
      if (current === null) { current = 'a'; aLabel = colMatch[1].trim() || 'A' }
      else if (current === 'a') { current = 'b'; bLabel = colMatch[1].trim() || 'B' }
      continue
    }
    const item = line.match(/^[-*+]\s+(.+)$/)
    if (item) {
      if (current === 'a') aItems.push(item[1].trim())
      else if (current === 'b') bItems.push(item[1].trim())
    }
  }
  return { type: 'compare', heading, a: { label: aLabel, items: aItems }, b: { label: bLabel, items: bItems } }
}

/** `@chart` directive: horizontal bar chart with `- label / value` rows. */
function parseChartChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  const raw: { label: string; displayValue: string; numericValue: number }[] = []

  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && raw.length === 0) { heading = h[1].trim(); continue }
    const rowRaw = line.replace(/^[-*+]\s+/, '').trim()
    const parts = rowRaw.split('/').map(p => p.trim())
    if (parts.length >= 2) {
      const label = parts[0]
      const valStr = parts[1]
      const numericValue = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0
      raw.push({ label, displayValue: valStr, numericValue })
    }
  }

  // Normalise: if all values look like percentages (≤ 100), use them as-is.
  // Otherwise normalise to the max value = 100%.
  const allPercent = raw.every(r => r.numericValue <= 100)
  const maxVal = Math.max(...raw.map(r => r.numericValue), 1)
  const items = raw.map(r => ({
    label: r.label,
    displayValue: r.displayValue,
    value: allPercent ? r.numericValue : (r.numericValue / maxVal) * 100,
  }))

  return { type: 'chart', heading, items }
}

/** `@toc` — table of contents grid. Items: `- Title / Sub-text` */
function parseTocChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  const items: { title: string; sub?: string; num?: string }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && items.length === 0) { heading = h[1].trim(); continue }
    const raw = line.replace(/^[-*+]\s+/, '').trim()
    const parts = raw.split('/').map(p => p.trim())
    if (parts.length >= 1 && parts[0]) {
      items.push({ title: parts[0], sub: parts[1], num: String(items.length + 1).padStart(2, '0') })
    }
  }
  return { type: 'toc', heading, items }
}

/** `@flow` / `@process` — linear process diagram. Steps: `- Step Label / Optional description` */
function parseFlowChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  let direction: 'horizontal' | 'vertical' = 'horizontal'
  const steps: { label: string; desc?: string }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    if (line.trim().toLowerCase() === 'vertical') { direction = 'vertical'; continue }
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && steps.length === 0) { heading = h[1].trim(); continue }
    const raw = line.replace(/^[-*+]\s+/, '').trim()
    const parts = raw.split('/').map(p => p.trim())
    if (parts[0]) steps.push({ label: parts[0], desc: parts[1] })
  }
  return { type: 'flow', heading, steps, direction }
}

/** `@timeline` — events list. Items: `- 2024 / Event title / Optional desc` */
function parseTimelineChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  const events: { date: string; title: string; desc?: string }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && events.length === 0) { heading = h[1].trim(); continue }
    const raw = line.replace(/^[-*+]\s+/, '').trim()
    const parts = raw.split('/').map(p => p.trim())
    if (parts.length >= 2) events.push({ date: parts[0], title: parts[1], desc: parts[2] })
  }
  return { type: 'timeline', heading, events }
}

/**
 * `@matrix` — feature comparison matrix.
 * Line 1 after directive: `||| Col1 | Col2 | Col3` (column headers)
 * Body lines: `- Row Label | ✓ | ✗ | partial`
 */
function parseMatrixChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  let cols: string[] = []
  const rows: { label: string; values: string[] }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && cols.length === 0) { heading = h[1].trim(); continue }
    // Column header row starts with |||
    if (line.trim().startsWith('|||')) {
      const raw = line.replace(/^\|\|\|/, '').trim()
      cols = raw.split('|').map(c => c.trim()).filter(Boolean)
      continue
    }
    // Data row: `- Label | val | val | val`
    const rowRaw = line.replace(/^[-*+]\s+/, '').trim()
    if (!rowRaw.includes('|')) continue
    const parts = rowRaw.split('|').map(c => c.trim())
    if (parts[0]) {
      const label = parts[0]
      // Normalise values: ✓→yes, ✗/×→no, partial→partial, else keep string
      const values = parts.slice(1).map(v => {
        const t = v.trim()
        if (!t) return ''
        if (/^(✓|yes|是|○)$/i.test(t)) return 'yes'
        if (/^(✗|×|no|否|✕)$/i.test(t)) return 'no'
        if (/^(partial|部分|△|~)$/i.test(t)) return 'partial'
        return t
      })
      rows.push({ label, values })
    }
  }
  return { type: 'matrix', heading, cols, rows }
}

/**
 * `@features` — three-column feature cards.
 * Each bullet: `:icon: Title / Sub-title / Description text`
 */
function parseFeaturesChunk(lines: string[]): SlideAST {
  const body = lines.slice(1)
  let heading: string | undefined
  const items: { icon: string; title: string; sub?: string; desc?: string }[] = []
  for (const line of body) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !heading && items.length === 0) { heading = h[1].trim(); continue }
    const raw = line.replace(/^[-*+]\s+/, '').trim()
    // Format: `:icon: Title / Sub / Description`
    const iconMatch = raw.match(/^:([a-z0-9-]+):\s*(.+)$/i)
    if (iconMatch) {
      const icon = iconMatch[1].toLowerCase()
      const parts = iconMatch[2].split('/').map(p => p.trim())
      items.push({ icon, title: parts[0] ?? '', sub: parts[1], desc: parts[2] })
    } else {
      // No icon prefix — treat as plain title / sub / desc
      const parts = raw.split('/').map(p => p.trim())
      if (parts[0]) items.push({ icon: '', title: parts[0], sub: parts[1], desc: parts[2] })
    }
  }
  return { type: 'features', heading, items }
}

function parseChunk(chunk: string, index: number): SlideAST {
  const lines = chunk.split('\n').map(l => l.trimEnd())

  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()

  if (!lines.length) return { type: 'section', heading: '', body: '' }

  // ---- Explicit directives ----
  if (lines[0].trim().toLowerCase() === '@poster') {
    return parsePosterChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@qr') {
    return parseQrChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@image') {
    return parseImageChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@icons') {
    return parseIconsChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@chapter') {
    return parseChapterChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@split') {
    return parseSplitChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@stats') {
    return parseStatsChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@compare') {
    return parseCompareChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@chart') {
    return parseChartChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@toc') {
    return parseTocChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@flow' || lines[0].trim().toLowerCase() === '@process') {
    return parseFlowChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@timeline') {
    return parseTimelineChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@matrix') {
    return parseMatrixChunk(lines)
  }
  if (lines[0].trim().toLowerCase() === '@features') {
    return parseFeaturesChunk(lines)
  }

  // ---- Cover detection: first slide with H1 ----
  const h1Match = lines[0].match(/^#\s+(.+)$/)
  if (index === 0 && h1Match) {
    const title = h1Match[1].trim()
    const { image, rest: afterImg } = extractImage(lines.slice(1))
    const rest = afterImg.filter(l => l.trim()).join(' ').trim()
    return { type: 'cover', title, subtitle: rest || undefined, image: image?.src }
  }

  // ---- Big text: single `# Title` or `## eyebrow + # Big` ----
  if (lines.length === 1 && h1Match) {
    return { type: 'bigText', text: h1Match[1].trim() }
  }
  if (lines.length === 2) {
    const eyebrow = lines[0].match(/^##\s+(.+)$/)
    const big = lines[1].match(/^#\s+(.+)$/)
    if (eyebrow && big) {
      return { type: 'bigText', text: big[1].trim(), eyebrow: eyebrow[1].trim() }
    }
  }

  // ---- priceCard: contains price-shaped line (¥ NN or $ NN) ----
  if (lines.some(l => PRICE_RE.test(l.trim()))) {
    const result = parsePriceChunk(lines)
    if (result) return result
  }

  // ---- contact: lines lead with phone/wechat/address emoji or label ----
  const contactLineCount = lines.filter(
    l => CONTACT_PREFIX_RE.test(l) || CONTACT_LABEL_RE.test(l),
  ).length
  if (contactLineCount >= 1 && contactLineCount >= lines.filter(l => l.trim() && !/^##\s+/.test(l)).length) {
    const result = parseContactChunk(lines)
    if (result) return result
  }

  // ---- Blockquote-led: bigNumber / quote ----
  const hasListItem = lines.some(l => /^[-*+]\s+/.test(l) || /^\d+\.\s+/.test(l))
  const quoteLines: string[] = []
  const captionLines: string[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    if (line.startsWith('>')) {
      quoteLines.push(line.replace(/^>\s?/, '').trim())
    } else if (/^#{1,6}\s/.test(line)) {
      captionLines.push(line.replace(/^#{1,6}\s+/, '').trim())
    } else {
      captionLines.push(line.trim())
    }
  }
  if (quoteLines.length > 0 && !hasListItem) {
    const text = quoteLines.filter(Boolean).join(' ')
    const caption = captionLines.filter(Boolean).join(' ') || undefined
    if (BIG_NUMBER_RE.test(text)) {
      return { type: 'bigNumber', value: text, caption }
    }
    return { type: 'quote', text, cite: caption }
  }

  // ---- List detection ----
  const listItems: string[] = []
  let heading: string | undefined
  let listMode = false
  for (const line of lines) {
    const hMatch = line.match(/^##\s+(.+)$/)
    if (hMatch && !listMode && heading === undefined) {
      heading = hMatch[1].trim()
      continue
    }
    if (line.startsWith('>') && !listMode && heading === undefined) {
      heading = line.replace(/^>\s?/, '').trim()
      continue
    }
    const itemMatch = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/)
    if (itemMatch) {
      listItems.push(itemMatch[1].trim())
      listMode = true
      continue
    }
    if (listMode && line.trim() && !itemMatch) {
      listItems.length = 0
      break
    }
  }
  if (listItems.length > 0) {
    return { type: 'list', heading, items: listItems }
  }

  // ---- Fallback: section ----
  const headingMatch = lines[0].match(/^#{1,6}\s+(.+)$/)
  const sectionHeading = headingMatch ? headingMatch[1].trim() : ''
  const bodyLines = headingMatch ? lines.slice(1) : lines
  const { image, rest: textLines } = extractImage(bodyLines)
  const body = textLines.join('\n').trim()
  return { type: 'section', heading: sectionHeading, body, image: image?.src }
}

export function parseMarkdown(md: string): SlideAST[] {
  return splitChunks(stripFrontmatter(md)).map(parseChunk)
}
