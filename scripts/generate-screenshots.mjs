/**
 * Generate per-template README preview screenshots.
 *
 * For each featured template:
 *   1. Read its theme.css + example.md.
 *   2. Parse the example markdown into slides (JS port of src/parser/parseMarkdown.ts).
 *   3. Pick 3 representative slides.
 *   4. Render each as a standalone HTML page using the same render harness
 *      documented in AGENTS.md (no React, no Tailwind, no build step).
 *   5. Open in headless Chromium at the template's native aspect ratio
 *      and save a PNG to screenshots/<id>-{1,2,3}.png.
 *
 * Run with:  pnpm screenshots
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const FEATURED = [
  { id: 'govt-red',         pick: [0, 2, 5] },
  { id: 'restaurant-promo', pick: [0, 1, 4] },
  { id: 'xhs-pastel',       pick: [0, 2, 3] },
  { id: 'book-quote',       pick: [0, 1, 2] },
  { id: 'solo-founder',     pick: [0, 2, 3] },
  { id: 'keynote-dark',     pick: [0, 2, 3] },
]

const ASPECT_DIM = {
  '16:9':   { width: 1600, height: 900 },
  '4:5':    { width: 1080, height: 1350 },
  '9:16':   { width: 1080, height: 1920 },
  '2.35:1': { width: 1880, height: 800 },
  '3:4':    { width: 1080, height: 1440 },
}

// ---------- parser port ----------

const BIG_NUMBER_RE = /^[$￥]?\s*[+-]?\d+(?:[.,]\d+)?\s*(?:[%×]|[xXKMBkmb])?\s*$/
const PRICE_RE = /^(?:[¥$￥]|RMB|￥)\s*([0-9]+(?:[.,][0-9]+)?)\s*(?:\/\s*(.+))?$/i
const STRIKE_RE = /^~~\s*(?:原价\s*)?[¥$￥]?\s*([0-9]+(?:[.,][0-9]+)?)\s*~~$/
const CONTACT_PREFIX_RE = /^(📞|☎️|💬|📍|🌐|📧|✉️|☎)\s*(.*)$/u
const CONTACT_LABEL_RE = /^(电话|手机|微信|地址|网址|官网|邮箱|微博|抖音|公众号)\s*[:：]\s*(.+)$/

function splitChunks(md) {
  const normalized = md.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const hr = normalized.split(/^[ \t]*---[ \t]*$/m).map(s => s.trim()).filter(Boolean)
  if (hr.length > 1) return hr
  const lines = normalized.split('\n')
  const chunks = []
  let buf = []
  for (const line of lines) {
    if (/^##\s+/.test(line) && buf.length > 0) {
      chunks.push(buf.join('\n').trim()); buf = []
    }
    buf.push(line)
  }
  if (buf.length > 0) chunks.push(buf.join('\n').trim())
  return chunks.filter(Boolean)
}

function parsePriceChunk(lines) {
  let title, price, unit, originalPrice, tagline
  for (const line of lines) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && !title && !price) { title = h[1].trim(); continue }
    const p = line.match(PRICE_RE)
    if (p && !price) { price = p[1]; unit = p[2]?.trim(); continue }
    const s = line.match(STRIKE_RE)
    if (s && !originalPrice) { originalPrice = s[1]; continue }
    if (price && !tagline) tagline = line.trim()
  }
  if (!price) return null
  return { type: 'priceCard', title, price, originalPrice, unit, tagline }
}

function parseContactChunk(lines) {
  const channels = []
  let heading
  for (const line of lines) {
    if (!line.trim()) continue
    const h = line.match(/^##\s+(.+)$/)
    if (h && channels.length === 0) { heading = h[1].trim(); continue }
    const emo = line.match(CONTACT_PREFIX_RE)
    if (emo) {
      const symbol = emo[1]
      const kind =
        symbol === '📞' || symbol === '☎️' || symbol === '☎' ? 'phone'
        : symbol === '💬' ? 'wechat'
        : symbol === '📍' ? 'address'
        : symbol === '🌐' ? 'website'
        : symbol === '📧' || symbol === '✉️' ? 'email'
        : 'other'
      channels.push({ kind, value: emo[2].trim() })
      continue
    }
    const lab = line.match(CONTACT_LABEL_RE)
    if (lab) {
      const k = lab[1]
      const kind =
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

function parseQrChunk(lines) {
  const body = lines.slice(1).filter(l => l.trim())
  const caption = body[0] ?? '扫码联系我们'
  const label = body[1]
  let src
  for (const l of body) {
    const m = l.match(/^!\[[^\]]*\]\(([^)]+)\)$/)
    if (m) { src = m[1]; break }
  }
  return { type: 'qrCode', caption, label, src }
}

function parsePosterChunk(lines) {
  const body = lines.slice(1)
  let eyebrow, title = '', subtitle, cta, countdown
  for (const line of body) {
    if (!line.trim()) continue
    const big = line.match(/^#\s+(.+)$/)
    if (big && !title) { title = big[1].trim(); continue }
    const ctaMatch = line.match(/^\[(.+)\]$/)
    if (ctaMatch && !cta) { cta = ctaMatch[1].trim(); continue }
    if (!title && !eyebrow) { eyebrow = line.trim(); continue }
    if (title && !subtitle) { subtitle = line.trim(); continue }
    if (title && subtitle && !countdown) countdown = line.trim()
  }
  if (eyebrow && /^(今晚|明天|后天|周|月|\d)/.test(eyebrow)) { countdown = eyebrow; eyebrow = undefined }
  return { type: 'posterHero', eyebrow, title, subtitle, cta, countdown }
}

function parseChunk(chunk, index) {
  const lines = chunk.split('\n').map(l => l.trimEnd())
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  if (!lines.length) return { type: 'section', heading: '', body: '' }

  if (lines[0].trim().toLowerCase() === '@poster') return parsePosterChunk(lines)
  if (lines[0].trim().toLowerCase() === '@qr') return parseQrChunk(lines)

  const h1 = lines[0].match(/^#\s+(.+)$/)
  if (index === 0 && h1) {
    const title = h1[1].trim()
    const rest = lines.slice(1).filter(l => l.trim()).join(' ').trim()
    return { type: 'cover', title, subtitle: rest || undefined }
  }

  if (lines.length === 1 && h1) return { type: 'bigText', text: h1[1].trim() }
  if (lines.length === 2) {
    const eyebrow = lines[0].match(/^##\s+(.+)$/)
    const big = lines[1].match(/^#\s+(.+)$/)
    if (eyebrow && big) return { type: 'bigText', text: big[1].trim(), eyebrow: eyebrow[1].trim() }
  }

  if (lines.some(l => PRICE_RE.test(l.trim()))) {
    const r = parsePriceChunk(lines); if (r) return r
  }

  const contactCount = lines.filter(l => CONTACT_PREFIX_RE.test(l) || CONTACT_LABEL_RE.test(l)).length
  if (contactCount >= 1 && contactCount >= lines.filter(l => l.trim() && !/^##\s+/.test(l)).length) {
    const r = parseContactChunk(lines); if (r) return r
  }

  const hasListItem = lines.some(l => /^[-*+]\s+/.test(l) || /^\d+\.\s+/.test(l))
  const quoteLines = []
  const capLines = []
  for (const line of lines) {
    if (!line.trim()) continue
    if (line.startsWith('>')) quoteLines.push(line.replace(/^>\s?/, '').trim())
    else if (/^#{1,6}\s/.test(line)) capLines.push(line.replace(/^#{1,6}\s+/, '').trim())
    else capLines.push(line.trim())
  }
  if (quoteLines.length > 0 && !hasListItem) {
    const text = quoteLines.filter(Boolean).join(' ')
    const caption = capLines.filter(Boolean).join(' ') || undefined
    if (BIG_NUMBER_RE.test(text)) return { type: 'bigNumber', value: text, caption }
    return { type: 'quote', text, cite: caption }
  }

  const items = []
  let heading
  let listMode = false
  for (const line of lines) {
    const hMatch = line.match(/^##\s+(.+)$/)
    if (hMatch && !listMode && heading === undefined) { heading = hMatch[1].trim(); continue }
    if (line.startsWith('>') && !listMode && heading === undefined) { heading = line.replace(/^>\s?/, '').trim(); continue }
    const im = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/)
    if (im) { items.push(im[1].trim()); listMode = true; continue }
    if (listMode && line.trim() && !im) { items.length = 0; break }
  }
  if (items.length > 0) return { type: 'list', heading, items }

  const hm = lines[0].match(/^#{1,6}\s+(.+)$/)
  const sectionHeading = hm ? hm[1].trim() : ''
  const bodyLines = hm ? lines.slice(1) : lines
  return { type: 'section', heading: sectionHeading, body: bodyLines.join('\n').trim() }
}

function parseMarkdown(md) { return splitChunks(md).map(parseChunk) }

// ---------- render harness (mirrors AGENTS.md) ----------

const HARNESS_CSS = `
  *,*::before,*::after { box-sizing: border-box; }
  html,body { margin:0; padding:0; height:100%; }
  body { font-family: var(--body-font, "PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif); background: var(--bg, #0a0a0a); color: var(--fg,#fafafa); -webkit-font-smoothing: antialiased; }
  section[data-slide] { height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; background: linear-gradient(135deg, var(--bg-grad-from) 0%, var(--bg-grad-to) 100%); color: var(--fg); padding: var(--slide-padding, 8vw); }
  .slide-inner { container-type: inline-size; position: relative; display: flex; flex-direction: column; max-width: 1200px; width: 100%; height: 100%; margin: 0 auto; }
  section[data-slide]::before { content:""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(60% 50% at 80% 20%, var(--accent-glow-1) 0%, transparent 60%), radial-gradient(50% 40% at 10% 90%, var(--accent-glow-2) 0%, transparent 55%); }
  .slide-body { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; }
  .slide-footer { position: absolute; bottom: 1.5rem; right: 2rem; z-index: 1; font-size: 0.75rem; letter-spacing: 0.25em; text-transform: uppercase; font-variant-numeric: tabular-nums; color: var(--fg-muted); }
  .display { font-family: var(--display-font); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); }
  .eyebrow { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.3em; color: var(--fg-muted); }

  .s-cover { justify-content: center; }
  .s-cover .eyebrow { margin-bottom: 1.5rem; }
  .s-cover h1 { font-size: clamp(48px, 13cqi, 140px); line-height: 0.95; margin: 0; }
  .s-cover p { margin-top: 2rem; max-width: 820px; font-size: clamp(18px, 2.5cqi, 28px); color: var(--fg-muted); line-height: 1.5; }

  .s-bigText { justify-content: center; }
  .s-bigText .eyebrow { margin-bottom: 2rem; }
  .s-bigText h2 { font-size: clamp(40px, 11cqi, 120px); line-height: 1.05; margin: 0; }

  .s-bigNumber { justify-content: center; align-items: center; text-align: center; }
  .s-bigNumber .num { font-family: var(--display-font); font-weight: 900; letter-spacing: -0.06em; color: var(--accent); font-size: clamp(120px, 35cqi, 360px); line-height: 1; font-variant-numeric: tabular-nums; }
  .s-bigNumber .cap { margin-top: 3rem; max-width: 820px; font-size: clamp(18px, 3cqi, 32px); color: var(--fg-muted); line-height: 1.4; }

  .s-quote { justify-content: center; }
  .s-quote .mark { font-size: clamp(80px, 17.5cqi, 180px); color: var(--accent); font-family: var(--display-font); font-weight: 700; line-height: 1; margin-bottom: 2rem; }
  .s-quote blockquote { margin: 0; font-family: var(--display-font); font-size: clamp(28px, 6.5cqi, 64px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
  .s-quote .cite { margin-top: 2.5rem; font-size: 0.875rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--fg-muted); }

  .s-list { justify-content: center; }
  .s-list h3 { font-family: var(--display-font); font-size: clamp(36px, 7cqi, 72px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 1.1; margin: 0 0 3rem; }
  .s-list ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 24px; }
  .s-list li { display: flex; align-items: baseline; gap: 1.5rem; font-size: clamp(20px, 3cqi, 36px); line-height: 1.4; }
  .s-list li .ord { color: var(--accent); font-weight: 700; font-size: 0.75em; font-family: var(--display-font); flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .s-list.dense h3 { font-size: clamp(28px,5cqi,52px); margin-bottom: 2.25rem; }
  .s-list.dense ul { gap: 14px; }
  .s-list.dense li { font-size: clamp(16px,2.5cqi,28px); }
  .s-list.very-dense ul { gap: 10px; }
  .s-list.very-dense li { font-size: clamp(14px,2cqi,22px); }

  .s-section { justify-content: center; }
  .s-section h3 { font-family: var(--display-font); font-size: clamp(32px,6.5cqi,64px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 1.1; margin: 0 0 2rem; }
  .s-section .body { font-size: clamp(18px,2.5cqi,28px); color: var(--fg-muted); line-height: 1.55; white-space: pre-wrap; }

  .s-priceCard { justify-content: center; align-items: center; text-align: center; }
  .s-priceCard .pc-title { font-family: var(--display-font); font-size: clamp(28px,5cqi,56px); font-weight: var(--display-weight,800); margin-bottom: 1.5rem; max-width: 820px; }
  .s-priceCard .pc-row { display: flex; align-items: baseline; gap: 0.75rem; font-variant-numeric: tabular-nums; }
  .s-priceCard .pc-currency { color: var(--accent); font-family: var(--display-font); font-size: clamp(40px,7cqi,72px); font-weight: 700; line-height: 1; }
  .s-priceCard .pc-price { color: var(--accent); font-family: var(--display-font); font-size: clamp(120px,26cqi,280px); font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
  .s-priceCard .pc-unit { color: var(--fg-muted); font-size: clamp(24px,3cqi,36px); font-weight: 500; line-height: 1; }
  .s-priceCard .pc-orig { margin-top: 1.5rem; text-decoration: line-through; color: var(--fg-muted); font-size: clamp(20px,3cqi,32px); font-variant-numeric: tabular-nums; }
  .s-priceCard .pc-tag { margin-top: 2.5rem; display: inline-block; padding: 0.5rem 1.5rem; border-radius: 999px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); font-size: clamp(16px,2.5cqi,24px); font-weight: 600; }

  .s-contact { justify-content: center; }
  .s-contact h3 { font-family: var(--display-font); font-size: clamp(32px,6cqi,64px); font-weight: var(--display-weight,800); margin: 0 0 3rem; }
  .s-contact ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1.5rem; }
  .s-contact li { display: flex; align-items: center; gap: 1.25rem; font-size: clamp(20px,3cqi,36px); font-variant-numeric: tabular-nums; }
  .s-contact .icon { width: 2.4em; text-align: center; font-size: 1em; flex-shrink: 0; }
  .s-contact .label { color: var(--fg-muted); font-size: 0.65em; width: 3em; font-weight: 500; }
  .s-contact .value { font-weight: 600; }

  .s-qrCode { justify-content: center; align-items: center; text-align: center; }
  .s-qrCode .qr-label { font-size: 0.875rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--fg-muted); margin-bottom: 2rem; }
  .s-qrCode .qr-box { width: min(50vh,50vw); height: min(50vh,50vw); background: color-mix(in srgb, var(--fg) 8%, transparent); border: 2px dashed color-mix(in srgb, var(--fg) 30%, transparent); border-radius: 24px; display: flex; align-items: center; justify-content: center; }
  .s-qrCode .qr-box .placeholder { color: var(--fg-muted); font-size: clamp(14px,2cqi,20px); display:flex; flex-direction:column; gap:0.75rem; align-items:center; }
  .s-qrCode .qr-box .placeholder .grid { font-size: 4em; line-height: 1; }
  .s-qrCode .qr-caption { margin-top: 3rem; max-width: 820px; font-family: var(--display-font); font-size: clamp(24px,4cqi,44px); font-weight: var(--display-weight,800); line-height: 1.25; }

  .s-posterHero { justify-content: center; align-items: flex-start; text-align: left; }
  .s-posterHero .countdown { display: inline-block; padding: 0.375rem 1.25rem; border-radius: 999px; background: var(--accent); color: var(--bg); font-size: clamp(14px,2cqi,22px); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 1.5rem; }
  .s-posterHero .eyebrow { margin-bottom: 1rem; }
  .s-posterHero h2 { font-family: var(--display-font); font-size: clamp(56px,16cqi,180px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 0.95; margin: 0; }
  .s-posterHero .subtitle { margin-top: 1.5rem; max-width: 820px; color: var(--fg-muted); font-size: clamp(20px,3cqi,36px); line-height: 1.35; }
  .s-posterHero .cta { display: inline-block; margin-top: 2.5rem; padding: 0.75rem 2rem; border-radius: 999px; background: var(--accent); color: var(--bg); font-size: clamp(18px,2.5cqi,28px); font-weight: 700; }
`

function esc(s) {
  if (s == null) return ''
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]))
}

function iconFor(kind) {
  return kind === 'phone' ? '📞'
    : kind === 'wechat' ? '💬'
    : kind === 'address' ? '📍'
    : kind === 'website' ? '🌐'
    : kind === 'email' ? '📧'
    : '•'
}
function labelFor(kind) {
  return kind === 'phone' ? '电话'
    : kind === 'wechat' ? '微信'
    : kind === 'address' ? '地址'
    : kind === 'website' ? '网址'
    : kind === 'email' ? '邮箱'
    : ''
}

function renderSlideBody(slide) {
  switch (slide.type) {
    case 'cover':
      return `<div class="slide-body s-cover">
        <div class="eyebrow">Cover</div>
        <h1 class="display">${esc(slide.title)}</h1>
        ${slide.subtitle ? `<p>${esc(slide.subtitle)}</p>` : ''}
      </div>`
    case 'bigText':
      return `<div class="slide-body s-bigText">
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ''}
        <h2 class="display">${esc(slide.text)}</h2>
      </div>`
    case 'bigNumber':
      return `<div class="slide-body s-bigNumber">
        <div class="num">${esc(slide.value)}</div>
        ${slide.caption ? `<div class="cap">${esc(slide.caption)}</div>` : ''}
      </div>`
    case 'quote':
      return `<div class="slide-body s-quote">
        <div class="mark">&ldquo;</div>
        <blockquote class="display">${esc(slide.text)}</blockquote>
        ${slide.cite ? `<div class="cite">— ${esc(slide.cite)}</div>` : ''}
      </div>`
    case 'list': {
      const c = slide.items.length
      const cls = c > 9 ? 's-list very-dense' : c > 6 ? 's-list dense' : 's-list'
      return `<div class="slide-body ${cls}">
        ${slide.heading ? `<h3>${esc(slide.heading)}</h3>` : ''}
        <ul>${slide.items.map((it, i) => `<li><span class="ord">${String(i+1).padStart(2,'0')}</span><span>${esc(it)}</span></li>`).join('')}</ul>
      </div>`
    }
    case 'section':
      return `<div class="slide-body s-section">
        ${slide.heading ? `<h3>${esc(slide.heading)}</h3>` : ''}
        <div class="body">${esc(slide.body)}</div>
      </div>`
    case 'priceCard':
      return `<div class="slide-body s-priceCard">
        ${slide.title ? `<div class="pc-title">${esc(slide.title)}</div>` : ''}
        <div class="pc-row">
          <span class="pc-currency">¥</span>
          <span class="pc-price">${esc(slide.price)}</span>
          ${slide.unit ? `<span class="pc-unit">/ ${esc(slide.unit)}</span>` : ''}
        </div>
        ${slide.originalPrice ? `<div class="pc-orig">原价 ¥${esc(slide.originalPrice)}</div>` : ''}
        ${slide.tagline ? `<div class="pc-tag">${esc(slide.tagline)}</div>` : ''}
      </div>`
    case 'contact':
      return `<div class="slide-body s-contact">
        ${slide.heading ? `<h3>${esc(slide.heading)}</h3>` : ''}
        <ul>${slide.channels.map(c => `<li>
          <span class="icon">${iconFor(c.kind)}</span>
          <span class="label">${esc(c.label || labelFor(c.kind))}</span>
          <span class="value">${esc(c.value)}</span>
        </li>`).join('')}</ul>
      </div>`
    case 'qrCode':
      return `<div class="slide-body s-qrCode">
        ${slide.label ? `<div class="qr-label">${esc(slide.label)}</div>` : ''}
        <div class="qr-box">
          ${slide.src ? `<img src="${esc(slide.src)}" alt="${esc(slide.caption)}">` : `<div class="placeholder"><div class="grid">⊞</div><div>放置二维码</div></div>`}
        </div>
        <div class="qr-caption">${esc(slide.caption)}</div>
      </div>`
    case 'posterHero':
      return `<div class="slide-body s-posterHero">
        ${slide.countdown ? `<div class="countdown">${esc(slide.countdown)}</div>` : ''}
        ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ''}
        <h2>${esc(slide.title)}</h2>
        ${slide.subtitle ? `<div class="subtitle">${esc(slide.subtitle)}</div>` : ''}
        ${slide.cta ? `<div class="cta">${esc(slide.cta)}</div>` : ''}
      </div>`
    default:
      return `<div class="slide-body s-section"><h3>${esc(slide.heading || '')}</h3></div>`
  }
}

/** Load FX layer CSS from disk so theme cursor-glow / bignum-pop show up in screenshots. */
const FX_CSS = fs.readFileSync(path.join(repoRoot, 'src/styles/fx.css'), 'utf8')

/** Tiny FX bootstrap: promote `--fx-foo: 1` vars to `data-fx-foo` attributes. */
const FX_BOOTSTRAP = `
(function(){
  var FX=['mouse-glow','hover-lift','bg-breathe','accent-rule','bignum-pop','progress'];
  var nodes=document.querySelectorAll('[data-slide], section[data-slide]');
  // The screenshot harness has only one section per page; promote vars on it directly.
  nodes.forEach(function(root){
    var cs=getComputedStyle(root);
    FX.forEach(function(n){ if((cs.getPropertyValue('--fx-'+n)||'').trim()==='1') root.setAttribute('data-fx-'+n,'1'); });
  });
  // Set a fixed mouse position so radial glow lands at the visible accent.
  document.documentElement.style.setProperty('--mx','0.7');
  document.documentElement.style.setProperty('--my','0.3');
})();
`

function renderSlideHtml(slide, themeId, themeCss, aspect, indexLabel) {
  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>${themeCss}</style>
<style>${HARNESS_CSS}</style>
<style>${FX_CSS}</style>
</head>
<body data-theme="${themeId}">
<section data-slide aspect="${aspect}" data-slide-anim class="slide-visible">
  <div class="slide-inner">
    ${renderSlideBody(slide)}
    <div class="slide-footer">${indexLabel}</div>
  </div>
</section>
<script>${FX_BOOTSTRAP}</script>
</body>
</html>`
}

// ---------- main ----------

async function main() {
  const indexJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'index.json'), 'utf8'))
  const byId = new Map(indexJson.templates.map(t => [t.id, t]))

  const browser = await chromium.launch()

  for (const { id, pick } of FEATURED) {
    const tpl = byId.get(id)
    if (!tpl) { console.warn(`skip ${id}: not in index.json`); continue }

    const themeCss = fs.readFileSync(path.join(repoRoot, tpl.theme_path), 'utf8')
    const mdRaw = fs.readFileSync(path.join(repoRoot, tpl.example_path), 'utf8')
    const slides = parseMarkdown(mdRaw)

    const ratio = tpl.default_ratio
    const dim = ASPECT_DIM[ratio]
    if (!dim) throw new Error(`no dim for ratio ${ratio}`)

    const context = await browser.newContext({ viewport: dim, deviceScaleFactor: 2 })
    const page = await context.newPage()

    for (let k = 0; k < pick.length; k++) {
      const idx = Math.min(pick[k], slides.length - 1)
      const slide = slides[idx]
      const label = `${String(idx + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`
      const html = renderSlideHtml(slide, id, themeCss, ratio, label)
      await page.setContent(html, { waitUntil: 'networkidle' })
      // small pause for web fonts
      await page.waitForTimeout(400)
      const outPath = path.join(repoRoot, 'screenshots', `${id}-${k+1}.png`)
      await page.screenshot({ path: outPath, fullPage: false })
      console.log(`✓ ${path.relative(repoRoot, outPath)}  [${slide.type}]`)
    }

    await context.close()
  }

  await browser.close()
}

main().catch(err => { console.error(err); process.exit(1) })
