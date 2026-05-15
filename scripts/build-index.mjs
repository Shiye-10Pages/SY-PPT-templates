/**
 * Regenerate index.json from two sources:
 *  1. src/themes/<id>/theme.css — palette (parsed via regex)
 *  2. src/themes/<id>/meta.ts  — id, name, tier, locale, defaultAspect, description
 *  3. index.json itself — preserves descriptive fields (scenarios, best_for, audiences, etc.)
 *     that are hand-authored and not derivable from CSS/TS files.
 *
 * Usage: pnpm build-index
 *
 * This is an additive merge:
 *  - If a template exists in meta.ts but NOT in index.json → adds it with minimal metadata.
 *  - If a template exists in index.json but NOT in meta.ts → WARNS and keeps it unchanged.
 *  - All hand-authored fields in index.json are preserved.
 *  - palette, typography, slide_types are always regenerated from CSS.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const themesDir = path.join(repoRoot, 'src/themes')
const indexPath = path.join(repoRoot, 'index.json')

const ALL_SLIDE_TYPES = [
  'cover','bigText','bigNumber','list','quote','section',
  'priceCard','contact','qrCode','posterHero','image','iconRow',
  'chapter','split','stats','compare','chart',
]

function extractCssVars(css) {
  return Object.fromEntries([...css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
}

function parseMeta(ts, id) {
  const str = (key) => {
    const m = ts.match(new RegExp(`${key}:\\s*'([^']+)'`)) || ts.match(new RegExp(`${key}:\\s*"([^"]+)"`))
    return m ? m[1] : undefined
  }
  return {
    id: str('id') ?? id,
    name: str('name') ?? id,
    tier: str('tier') ?? 'C',
    locale: str('locale') ?? 'global',
    defaultAspect: str('defaultAspect') ?? '16:9',
    description: str('description') ?? '',
  }
}

function buildPalette(vars) {
  return {
    bg: vars['bg'] ?? '',
    bg_alt: vars['bg-grad-to'] ?? vars['bg'] ?? '',
    fg: vars['fg'] ?? '',
    fg_muted: vars['fg-muted'] ?? '',
    accent: vars['accent'] ?? '',
    accent_2: vars['accent-2'] ?? vars['accent'] ?? '',
  }
}

function buildTypography(css, vars) {
  const isSerif = /Songti|STSong|Iowan|Source Han Serif/i.test(css)
  const dfMatch = css.match(/--display-font:\s*"([^"]+)"/)
  const bfMatch = css.match(/--body-font:\s*"([^"]+)"/)
  return {
    display: isSerif ? 'Songti SC / STSong (Serif)' : (dfMatch?.[1] ?? 'Inter'),
    body: bfMatch?.[1] ?? dfMatch?.[1] ?? 'Inter',
    display_weight: parseInt(vars['display-weight'] ?? '800'),
    tracking: vars['display-tracking'] ?? '-0.02em',
  }
}

async function main() {
  // Load existing index.json
  const existing = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
  const existingById = new Map(existing.templates.map(t => [t.id, t]))

  // Scan all theme directories
  const themeIds = fs.readdirSync(themesDir).filter(d => {
    const cssPath = path.join(themesDir, d, 'theme.css')
    const metaPath = path.join(themesDir, d, 'meta.ts')
    return fs.existsSync(cssPath) && fs.existsSync(metaPath)
  })

  const updated = []
  for (const tid of themeIds) {
    const css = fs.readFileSync(path.join(themesDir, tid, 'theme.css'), 'utf8')
    const ts  = fs.readFileSync(path.join(themesDir, tid, 'meta.ts'), 'utf8')
    const vars = extractCssVars(css)
    const meta = parseMeta(ts, tid)

    const existing = existingById.get(tid) ?? {}

    // Merge: auto-derived fields always win; hand-authored fields preserved if present
    const entry = {
      // Hand-authored descriptive fields (preserve from existing, provide defaults for new)
      ...existing,
      // Auto-derived (always regenerated)
      id: meta.id,
      palette: buildPalette(vars),
      typography: buildTypography(css, vars),
      slide_types: ALL_SLIDE_TYPES,
      // Auto-derived defaults for new templates (won't overwrite existing hand-authored values)
      name_zh: existing.name_zh ?? meta.name,
      name_en: existing.name_en ?? meta.id,
      tier: existing.tier ?? meta.tier,
      default_ratio: existing.default_ratio ?? meta.defaultAspect,
      theme_path: `src/themes/${tid}/theme.css`,
      meta_path: `src/themes/${tid}/meta.ts`,
      example_path: `src/examples/${tid}.md`,
    }

    updated.push(entry)
    existingById.delete(tid)
  }

  // Warn about templates in index.json not found in src/themes/
  for (const [orphanId] of existingById) {
    console.warn(`⚠️  Template "${orphanId}" exists in index.json but has no matching src/themes/ directory.`)
    updated.push(existingById.get(orphanId))
  }

  // Sort by tier, then id
  updated.sort((a, b) => {
    const tierOrder = (a.tier ?? 'C').localeCompare(b.tier ?? 'C')
    return tierOrder !== 0 ? tierOrder : a.id.localeCompare(b.id)
  })

  const output = {
    ...existing,
    version: existing.version ?? '1.2.0',
    dsl_version: '1.1',
    templates: updated,
  }

  fs.writeFileSync(indexPath, JSON.stringify(output, null, 2) + '\n', 'utf8')
  console.log(`✓ index.json updated — ${updated.length} templates, version ${output.version}`)
}

main().catch(err => { console.error(err); process.exit(1) })
