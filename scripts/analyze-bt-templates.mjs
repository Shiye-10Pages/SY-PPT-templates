/**
 * Analyze all 34 zarazhangrui/beautiful-html-templates templates.
 * Extracts an 8-dimension "Aesthetic DNA" record for each one.
 *
 * Input:  /tmp/beautiful-html-templates/
 * Output: scripts/bt-dna-database.json
 *
 * Run: node scripts/analyze-bt-templates.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const BT_ROOT = '/tmp/beautiful-html-templates'
const OUT_FILE = path.join(repoRoot, 'scripts/bt-dna-database.json')

// ─── Helpers ────────────────────────────────────────────────────────────────

function readHtml(slug) {
  const p = path.join(BT_ROOT, 'templates', slug, 'template.html')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''
}

/** Extract Google Fonts family names from @import URLs or <link> tags. */
function extractFonts(html) {
  const families = []
  // Match both CSS @import url() and HTML <link href=""> patterns
  const patterns = [
    /@import url\([^)]+googleapis\.com[^)]+\)/g,
    /href=["'][^"']*fonts\.googleapis\.com[^"']+["']/g,
    /href=["'][^"']*fonts\.gstatic\.com[^"']+["']/g,
  ]
  const allMatches = []
  for (const re of patterns) {
    const m = html.match(re) || []
    allMatches.push(...m)
  }
  for (const url of allMatches) {
    // Extract ALL family= params (Google Fonts v2 uses multiple family= per URL)
    const familyRe = /family=([^&"'\s)>]+)/g
    let m
    while ((m = familyRe.exec(url)) !== null) {
      const parts = m[1].split(/[|]/)
      for (const p of parts) {
        const name = decodeURIComponent(p.split(':')[0].replace(/\+/g, ' ')).trim()
        if (name && name.length > 1 && !families.includes(name)) families.push(name)
      }
    }
  }
  return families
}

/** Extract CSS color-like custom properties from any selector. */
function extractColorVars(html) {
  const vars = {}
  const re = /--([a-z][a-z0-9-]*)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g
  let m
  while ((m = re.exec(html)) !== null) {
    const [, name, value] = m
    if (!vars[name]) vars[name] = value.trim()
  }
  return vars
}

/** Resolve the most likely bg/fg/accent from variable map or fallback patterns. */
function resolvePalette(vars, html, scheme) {
  const get = (...keys) => {
    for (const k of keys) if (vars[k]) return vars[k]
    return null
  }

  // Try common variable naming conventions across BT templates
  const bg = get('c-bg', 'bg', 'color-bg', 'page-bg', 'surface')
    || (scheme === 'dark' ? '#1a1a1a' : '#f5f5f0')
  const fg = get('c-fg', 'fg', 'color-fg', 'text', 'ink')
    || (scheme === 'dark' ? '#fafafa' : '#111111')
  const accent1 = get(
    // Generic patterns
    'c-accent', 'accent', 'color-accent', 'primary', 'highlight',
    // Color names (BT uses semantic names)
    'red', 'blue', 'yellow', 'green', 'orange', 'coral', 'sun', 'neon', 'pink',
    'cobalt', 'rust', 'emerald', 'teal', 'gold', 'amber', 'lime', 'violet', 'purple',
    'indigo', 'cyan', 'magenta', 'hot', 'electric', 'fire',
    // BT-specific patterns
    'c-red', 'c-blue', 'c-yellow', 'c-orange', 'c-green', 'c-pink', 'c-ink',
    'c-cobalt', 'c-rust', 'c-gold', 'c-sun', 'c-coral', 'c-sage',
    'color-primary', 'color-cta', 'text-accent',
    // Functional names sometimes used as accents
    'link', 'active', 'emphasis', 'brand',
  )
  const accent2 = get(
    'c-accent-2', 'accent-2', 'secondary', 'warm', 'orange2', 'alt',
    'c-yellow', 'c-orange', 'c-gold', 'c-warm', 'c-amber', 'c-lime',
    'color-secondary', 'highlight-2',
  )

  // Detect full-bleed slide: look for a single-color whole-slide background
  const fullBleedMatch = html.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,8}|var\(--[a-z-]+\))[^;]*;\s*\/\*[^*]*full|slide.*background:\s*(#[0-9a-fA-F]{3,8})/)
  const hasFullBleed = !!fullBleedMatch || /\.s-chapter|\.slide-color|\.dark-bg/.test(html)

  return { bg, fg, accent_1: accent1, accent_2: accent2, full_bleed_exists: hasFullBleed }
}

/** Typography DNA */
function extractTypography(html, fonts) {
  const maxWeight = Math.max(
    ...(html.match(/font-weight\s*:\s*(\d{3,4})/g) || [])
      .map(m => parseInt(m.match(/\d+/)[0], 10))
      .filter(n => n >= 400),
    400
  )
  const hasSerif = fonts.some(f =>
    /serif|playfair|cormorant|source han serif|georgia|iowan|instrument serif|bodoni|barlow/i.test(f)
  )
  const hasSans = fonts.some(f =>
    /grotesk|grotesque|sans|inter|jost|archivo|dm sans|space|bricolage|barlow/i.test(f)
  )
  const hasMono = fonts.some(f => /mono|jetbrains|ibm plex|courier/i.test(f))
  const hasItalicBody = /font-style\s*:\s*italic/.test(html) && hasSerif

  // Classify collision
  const collision = hasSerif && hasSans ? 'serif-sans' : hasSerif ? 'serif-only' : 'sans-only'

  const usesVw = /\d+vw/.test(html)
  const usesCqi = /\d+cqi/.test(html)

  // Find display font (used for h1/display)
  const displayFont = fonts[0] || 'system-ui'
  const bodyFont = fonts.length > 1 ? fonts[1] : fonts[0] || 'system-ui'

  return {
    display_family: displayFont,
    body_family: bodyFont,
    all_families: fonts,
    collision,
    has_serif: hasSerif,
    has_sans: hasSans,
    has_mono: hasMono,
    has_italic_body: hasItalicBody,
    max_weight: maxWeight,
    uses_vw_scale: usesVw,
    uses_cqi_scale: usesCqi,
  }
}

/** Decorative vocabulary */
function extractDecorative(html) {
  const hasOffsetShadow = /box-shadow\s*:\s*\d+px\s+\d+px\s+0/.test(html)
  const hasBlurShadow = /box-shadow\s*:\s*\d+px\s+\d+px\s+\d+px/.test(html)
  const hasGrain = /feTurbulence|mix-blend-mode\s*:\s*multiply|fractalNoise/.test(html)
  const hasFloating = /position\s*:\s*absolute[^;]*transform\s*:\s*rotate/.test(html)
  const hasSvgOrnaments = /<svg[^>]*viewBox[^>]*>(?!.*<\/style>)/.test(html)
  const hasMixBlend = /mix-blend-mode/.test(html)
  const hasClipPath = /clip-path/.test(html)

  // border-radius level
  const radii = (html.match(/border-radius\s*:\s*([\d.]+)(px|rem|%|em)/g) || [])
    .map(r => parseFloat(r.match(/[\d.]+/)[0]))
    .filter(n => !isNaN(n))
  const maxRadius = radii.length ? Math.max(...radii) : 0
  const borderRadiusLevel = maxRadius === 0 ? 'none'
    : maxRadius < 8 ? 'small'
    : maxRadius < 24 ? 'medium'
    : maxRadius < 9999 ? 'large'
    : 'pill'

  // Signature CSS classes (custom, non-generic ones)
  const genericClasses = new Set(['slide', 'active', 'section', 'header', 'footer', 'body',
    'title', 'text', 'content', 'inner', 'wrapper', 'container', 'nav', 'main', 'item',
    'card', 'label', 'meta', 'tag', 'col', 'row', 'grid', 'flex', 'left', 'right', 'top',
    'center', 'btn', 'link', 'hidden', 'show', 'open', 'close', 'current', 'prev', 'next'])
  const classMatches = html.match(/\.(s-[a-z-]+|[a-z]+-[a-z]+-[a-z]+)/g) || []
  const sigClasses = [...new Set(classMatches.map(c => c.slice(1)))]
    .filter(c => c.length > 4 && !genericClasses.has(c.split('-')[0]))
    .slice(0, 12)

  return {
    has_offset_shadow: hasOffsetShadow,
    has_blur_shadow: hasBlurShadow,
    has_grain: hasGrain,
    has_floating_elements: hasFloating,
    has_svg_ornaments: hasSvgOrnaments,
    has_mix_blend: hasMixBlend,
    has_clip_path: hasClipPath,
    border_radius_level: borderRadiusLevel,
    max_border_radius_px: maxRadius,
    signature_classes: sigClasses,
  }
}

/** Animation DNA */
function extractAnimation(html) {
  const hasKeyframes = /@keyframes/.test(html)
  const hasEntryAnim = /data-anim|\.slide-visible|kFadeUp|kReveal|\.entering/.test(html)
  // Continuous = animations that loop or run without a trigger
  const hasContinuous = /animation.*infinite|animation.*\d+s(?!\s+forwards)/.test(html)
  const hasHover = /:hover\s*\{[^}]*transform|:hover\s*\{[^}]*color/.test(html)
  const hasStagger = /animation-delay\s*:\s*calc|data-delay/.test(html)

  return {
    has_entry_anim: hasEntryAnim || hasKeyframes,
    has_continuous: hasContinuous,
    has_hover: hasHover,
    has_stagger: hasStagger,
  }
}

/** Layout signals */
function extractLayout(html, density) {
  const hasGrid = /display\s*:\s*grid/.test(html)
  const hasFlex = /display\s*:\s*flex/.test(html)
  const hasAbsoluteDecorative = (html.match(/position\s*:\s*absolute/g) || []).length > 8

  // Dominant alignment
  const centerCount = (html.match(/text-align\s*:\s*center/g) || []).length
  const leftCount = (html.match(/text-align\s*:\s*left/g) || []).length
  const alignment = centerCount > leftCount * 1.5 ? 'center'
    : leftCount > centerCount ? 'left'
    : 'mixed'

  return {
    uses_grid: hasGrid,
    uses_flex: hasFlex,
    has_decorative_absolute: hasAbsoluteDecorative,
    density: density || 'medium',
    alignment,
  }
}

// Manual accent patches for templates with non-standard variable names
const ACCENT_PATCHES = {
  '8-bit-orbit':       { accent_1: '#FE2C55', accent_2: '#25F4EE' }, // neon red + cyan
  'cobalt-grid':       { accent_1: '#1F2BE0', accent_2: null },       // cobalt blue
  'emerald-editorial': { accent_1: '#1B6B3A', accent_2: '#B8985A' }, // emerald + gold
  'long-table':        { accent_1: '#C44B2A', accent_2: null },       // rust-red
  'pin-and-paper':     { accent_1: '#3D4B8A', accent_2: '#E8C84A' }, // indigo + brass
  'retro-windows':     { accent_1: '#000080', accent_2: '#C0C0C0' }, // Win95 navy + silver
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const indexRaw = fs.readFileSync(path.join(BT_ROOT, 'index.json'), 'utf8')
  const { templates } = JSON.parse(indexRaw)
  console.log(`Found ${templates.length} templates in index.json`)

  const database = []

  for (const tpl of templates) {
    const { slug, name, tagline, mood, tone, formality, density, scheme,
      best_for, avoid_for, slide_count } = tpl

    const html = readHtml(slug)
    if (!html) {
      console.warn(`⚠  No template.html for ${slug}`)
      continue
    }

    const fonts = extractFonts(html)
    const colorVars = extractColorVars(html)
    const palette = resolvePalette(colorVars, html, scheme)
    if (ACCENT_PATCHES[slug]) Object.assign(palette, ACCENT_PATCHES[slug])
    const typography = extractTypography(html, fonts)
    const decorative = extractDecorative(html)
    const animation = extractAnimation(html)
    const layout = extractLayout(html, density)

    // Rough "closest SY theme" heuristic from mood overlap
    let closestSy = 'keynote-dark'
    if (mood.includes('warm') || mood.includes('friendly')) closestSy = 'editorial-warm'
    else if (mood.includes('institutional') || mood.includes('trustworthy')) closestSy = 'soe-blue'
    else if (mood.includes('playful')) closestSy = 'xhs-pastel'
    else if (mood.includes('scholarly') || mood.includes('literary')) closestSy = 'swiss-paper'
    else if (mood.includes('editorial')) closestSy = 'meeting-minutes'

    // Signature visual elements (human-readable, derived from decorative)
    const signatureElements = []
    if (decorative.has_offset_shadow) signatureElements.push('offset-box-shadow (brutalist)')
    if (decorative.has_grain) signatureElements.push('grain-texture-overlay')
    if (decorative.has_floating_elements) signatureElements.push('floating-rotated-elements')
    if (decorative.has_svg_ornaments) signatureElements.push('custom-svg-ornaments')
    if (decorative.has_clip_path) signatureElements.push('clip-path-shapes')
    if (decorative.has_mix_blend) signatureElements.push('mix-blend-mode')
    if (typography.collision === 'serif-sans') signatureElements.push('serif-sans-collision')
    if (typography.has_italic_body) signatureElements.push('italic-serif-body')
    if (typography.max_weight >= 900) signatureElements.push('ultra-heavy-display (900w)')
    if (typography.uses_vw_scale) signatureElements.push('vw-based-type-scale')
    if (palette.full_bleed_exists) signatureElements.push('full-bleed-color-slide')
    if (decorative.border_radius_level === 'pill') signatureElements.push('pill-shaped-elements')
    if (decorative.border_radius_level === 'large') signatureElements.push('large-rounded-cards')
    if (animation.has_continuous) signatureElements.push('continuous-css-animation')
    if (decorative.signature_classes.some(c => c.includes('orbit'))) signatureElements.push('orbit-diagram')
    if (decorative.signature_classes.some(c => c.includes('deco') || c.includes('pill'))) signatureElements.push('decorative-pills')

    const record = {
      slug,
      name,
      tagline,
      scheme: scheme || 'light',
      palette,
      typography,
      decorative,
      animation,
      layout,
      mood: mood || [],
      tone: tone || [],
      formality: formality || 'medium',
      density: density || 'medium',
      slide_count: slide_count || 10,
      best_for: best_for || '',
      avoid_for: avoid_for || '',
      signature_elements: signatureElements,
      closest_sy_theme: closestSy,
    }

    database.push(record)
    console.log(`✓ ${slug.padEnd(22)} | ${signatureElements.slice(0, 3).join(', ')}`)
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(database, null, 2) + '\n')
  console.log(`\n✅ Written ${database.length} records → ${path.relative(repoRoot, OUT_FILE)}`)

  // Quick validation
  const missingAccent = database.filter(d => !d.palette.accent_1)
  if (missingAccent.length) {
    console.warn(`⚠  ${missingAccent.length} templates have no accent_1: ${missingAccent.map(d => d.slug).join(', ')}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
