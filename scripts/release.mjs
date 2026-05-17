/**
 * Canonical release script — runs all generation/validation steps
 * in the correct dependency order.
 *
 * Prevents ordering bugs like "blank-decks before build-index" that
 * caused wrong aspect ratios in past releases.
 *
 * Run: pnpm release
 * Flags:
 *   --skip-verify    skip pnpm verify (21 types screenshot test)
 *   --skip-e2e       skip pnpm e2e (agent mode full deck test)
 *   --skip-screenshots skip pnpm screenshots (README screenshots)
 */

import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot  = path.resolve(__dirname, '..')

const args = process.argv.slice(2)
const skipVerify = args.includes('--skip-verify')
const skipE2E    = args.includes('--skip-e2e')
const skipShots  = args.includes('--skip-screenshots')

let stepNum = 0

function run(label, cmd, opts = {}) {
  stepNum++
  const num = String(stepNum).padStart(2, '0')
  process.stdout.write(`\n[${num}] ${label}... `)
  const start = Date.now()
  try {
    execSync(cmd, { cwd: repoRoot, stdio: opts.quiet ? 'pipe' : 'inherit' })
    const ms = Date.now() - start
    process.stdout.write(`\r[${num}] ✓ ${label} (${ms}ms)\n`)
  } catch (e) {
    process.stdout.write(`\r[${num}] ✗ ${label} — FAILED\n`)
    if (opts.quiet && e.stdout) console.error(e.stdout.toString())
    if (opts.quiet && e.stderr) console.error(e.stderr.toString())
    process.exit(1)
  }
}

function skip(label) {
  stepNum++
  const num = String(stepNum).padStart(2, '0')
  console.log(`[${num}] ⏭  ${label} (skipped)`)
}

console.log('\n═══════════════════════════════════════════')
console.log('  SY-PPT-templates Release Pipeline')
console.log('═══════════════════════════════════════════\n')
console.log('Flags:', { skipVerify, skipE2E, skipShots })

// ── Phase 1: Data generation (order matters!) ─────────────────
// build-index must come before blank-decks (blank-decks reads index.json)
run('Build index.json (pnpm build-index)',   'pnpm build-index', { quiet: true })
run('Generate blank-deck.html files',        'pnpm blank-decks',  { quiet: true })

// ── Phase 2: Screenshots from real example.md content ────────
// Uses the renderer, not blank-deck placeholders
if (!skipShots) {
  run('Generate README screenshots (pnpm screenshots)', 'pnpm screenshots')
} else {
  skip('README screenshots')
}

// ── Phase 3: Build + lint ─────────────────────────────────────
run('TypeScript build (pnpm build)', 'pnpm build', { quiet: true })
run('ESLint (pnpm lint)',            'pnpm lint',  { quiet: true })

// ── Phase 4: Verification ─────────────────────────────────────
if (!skipVerify) {
  run('Verify all 22 types — agent mode (pnpm verify)', 'pnpm verify')
} else {
  skip('Type verification (pnpm verify)')
}

if (!skipE2E) {
  run('Agent E2E test — 22 slides (pnpm e2e)', 'pnpm e2e')
} else {
  skip('Agent E2E test (pnpm e2e)')
}

// ── Summary ──────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════')
console.log(`  ✅ Release pipeline completed (${stepNum} steps)`)
console.log('═══════════════════════════════════════════')
console.log('\nNext steps:')
console.log('  git add -A && git commit -m "chore: release vX.Y.Z"')
console.log('  git push origin main')
