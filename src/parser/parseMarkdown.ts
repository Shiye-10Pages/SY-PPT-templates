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
