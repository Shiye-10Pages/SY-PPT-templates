/**
 * Verify all 21 DSL slide types render correctly in agent mode (static HTML).
 *
 * For each type:
 *  1. Build a minimal static HTML using the keynote-dark theme + AGENTS.md harness CSS
 *  2. Load in headless Chromium, screenshot 1920×1080
 *  3. Check screenshot file size > 40 KB (catches blank/white-screen renders)
 *  4. Report PASS / FAIL
 *
 * Run: pnpm verify
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot  = path.resolve(__dirname, '..')
const SHOTS_DIR = '/tmp/verify-shots'
fs.mkdirSync(SHOTS_DIR, { recursive: true })

// ── Shared assets ─────────────────────────────────────────────────────────
const themeCss = fs.readFileSync(path.join(repoRoot, 'src/themes/keynote-dark/theme.css'), 'utf8')
const fxCss    = fs.readFileSync(path.join(repoRoot, 'src/styles/fx.css'), 'utf8')

// Minimal AGENTS.md-compatible render harness (matches the harness in AGENTS.md)
const HARNESS_CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;background:var(--bg,#0a0a0a);color:var(--fg,#fafafa);
  font-family:var(--display-font,"Inter",system-ui,sans-serif);-webkit-font-smoothing:antialiased}
section[data-slide]{width:1920px;height:1080px;position:relative;overflow:hidden;
  display:flex;align-items:center;justify-content:center;padding:var(--slide-padding,8vw);
  background:radial-gradient(60% 50% at 80% 20%,var(--accent-glow-1,transparent) 0%,transparent 60%),
    radial-gradient(50% 40% at 10% 90%,var(--accent-glow-2,transparent) 0%,transparent 55%),
    linear-gradient(135deg,var(--bg-grad-from,var(--bg)) 0%,var(--bg-grad-to,var(--bg)) 100%)}
.slide-inner{container-type:inline-size;position:relative;z-index:1;display:flex;flex-direction:column;
  width:100%;height:100%;max-width:1200px;margin:0 auto}
.slide-body{position:relative;z-index:1;width:100%;height:100%;display:flex;flex-direction:column}
.display{font-family:var(--display-font);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-0.02em)}
.eyebrow{font-size:.875rem;text-transform:uppercase;letter-spacing:.3em;color:var(--fg-muted)}
.slide-footer{position:absolute;bottom:1.5rem;right:2rem;z-index:1;font-size:.7rem;
  letter-spacing:.25em;text-transform:uppercase;color:var(--fg-muted)}
/* All 21 slide type CSS classes */
.s-cover{justify-content:center}.s-cover .eyebrow{margin-bottom:1.5rem}
.s-cover h1{font-size:clamp(48px,13cqi,140px);line-height:.95;margin:0}
.s-cover p{margin-top:2rem;max-width:820px;font-size:clamp(18px,2.5cqi,28px);color:var(--fg-muted);line-height:1.5}
.s-bigText{justify-content:center}.s-bigText h2{font-size:clamp(40px,11cqi,120px);line-height:1.05;margin:0}
.s-bigNumber{justify-content:center;align-items:center;text-align:center}
.s-bigNumber .num{font-family:var(--display-font);font-weight:900;letter-spacing:-.06em;color:var(--accent);font-size:clamp(120px,35cqi,360px);line-height:1}
.s-bigNumber .cap{margin-top:3rem;max-width:820px;font-size:clamp(18px,3cqi,32px);color:var(--fg-muted);line-height:1.4}
.s-quote{justify-content:center}.s-quote .mark{font-size:clamp(80px,17.5cqi,180px);color:var(--accent);font-family:var(--display-font);font-weight:700;line-height:1;margin-bottom:2rem}
.s-quote blockquote{margin:0;font-family:var(--display-font);font-size:clamp(28px,6.5cqi,64px);font-weight:600;letter-spacing:-.02em;line-height:1.2}
.s-quote .cite{margin-top:2.5rem;font-size:.875rem;letter-spacing:.25em;text-transform:uppercase;color:var(--fg-muted)}
.s-list{justify-content:center}.s-list h3{font-family:var(--display-font);font-size:clamp(36px,7cqi,72px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 3rem}
.s-list ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:24px}
.s-list li{display:flex;align-items:baseline;gap:1.5rem;font-size:clamp(20px,3cqi,36px);line-height:1.4}
.s-list li .ord{color:var(--accent);font-weight:700;font-size:.75em;font-family:var(--display-font);flex-shrink:0}
.s-section{justify-content:center}.s-section h3{font-family:var(--display-font);font-size:clamp(32px,6.5cqi,64px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 2rem}
.s-section .body{font-size:clamp(18px,2.5cqi,28px);color:var(--fg-muted);line-height:1.55;white-space:pre-wrap}
.s-priceCard{justify-content:center;align-items:center;text-align:center}
.s-priceCard .pc-title{font-family:var(--display-font);font-size:clamp(28px,5cqi,56px);font-weight:var(--display-weight,800);margin-bottom:1.5rem;max-width:820px}
.s-priceCard .pc-row{display:flex;align-items:baseline;gap:.75rem;font-variant-numeric:tabular-nums}
.s-priceCard .pc-currency{color:var(--accent);font-family:var(--display-font);font-size:clamp(40px,7cqi,72px);font-weight:700;line-height:1}
.s-priceCard .pc-price{color:var(--accent);font-family:var(--display-font);font-size:clamp(120px,26cqi,280px);font-weight:900;letter-spacing:-.04em;line-height:1}
.s-priceCard .pc-unit{color:var(--fg-muted);font-size:clamp(24px,3cqi,36px);font-weight:500;line-height:1}
.s-priceCard .pc-orig{margin-top:1.5rem;text-decoration:line-through;color:var(--fg-muted);font-size:clamp(20px,3cqi,32px)}
.s-priceCard .pc-tag{margin-top:2.5rem;display:inline-block;padding:.5rem 1.5rem;border-radius:999px;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);font-size:clamp(16px,2.5cqi,24px);font-weight:600}
.s-contact{justify-content:center}.s-contact h3{font-family:var(--display-font);font-size:clamp(32px,6cqi,64px);font-weight:var(--display-weight,800);margin:0 0 3rem}
.s-contact ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:1.5rem}
.s-contact li{display:flex;align-items:center;gap:1.25rem;font-size:clamp(20px,3cqi,36px)}
.s-contact .icon{width:2.4em;text-align:center;font-size:1em;flex-shrink:0}
.s-contact .label{color:var(--fg-muted);font-size:.65em;width:3em;font-weight:500}
.s-contact .value{font-weight:600}
.s-qrCode{justify-content:center;align-items:center;text-align:center}
.s-qrCode .qr-box{width:min(50vh,50vw);height:min(50vh,50vw);background:color-mix(in srgb,var(--fg) 8%,transparent);border:2px dashed color-mix(in srgb,var(--fg) 30%,transparent);border-radius:24px;display:flex;align-items:center;justify-content:center}
.s-qrCode .qr-caption{margin-top:3rem;font-family:var(--display-font);font-size:clamp(24px,4cqi,44px);font-weight:var(--display-weight,800);line-height:1.25}
.s-posterHero{justify-content:center;align-items:flex-start;text-align:left}
.s-posterHero h2{font-family:var(--display-font);font-size:clamp(56px,16cqi,180px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:.95;margin:0}
.s-posterHero .subtitle{margin-top:1.5rem;max-width:820px;color:var(--fg-muted);font-size:clamp(20px,3cqi,36px);line-height:1.35}
.s-posterHero .cta{display:inline-block;margin-top:2.5rem;padding:.75rem 2rem;border-radius:999px;background:var(--accent);color:var(--bg);font-size:clamp(18px,2.5cqi,28px);font-weight:700}
.s-image{justify-content:center;align-items:center;gap:1.5rem}
.s-image img{max-height:78%;max-width:100%;border-radius:24px;object-fit:contain}
.s-iconRow{justify-content:center}.s-iconRow h3{font-family:var(--display-font);font-size:clamp(32px,6cqi,60px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 3rem}
.s-iconRow ul{list-style:none;padding:0;margin:0;display:grid;gap:2rem;grid-template-columns:repeat(var(--icon-cols,3),minmax(0,1fr))}
.s-iconRow li{display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center}
.s-iconRow .icon-tile{width:clamp(64px,10cqi,120px);height:clamp(64px,10cqi,120px);display:flex;align-items:center;justify-content:center;border-radius:1rem;background:color-mix(in srgb,var(--accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);color:var(--accent)}
.s-iconRow .icon-tile svg{width:55%;height:55%}.s-iconRow .label{font-size:clamp(14px,2.2cqi,24px);line-height:1.4;font-weight:600}
/* New types (chapter–matrix) */
.s-chapter{justify-content:center;align-items:center;text-align:center}
.s-chapter .eyebrow{font-size:.7rem;text-transform:uppercase;letter-spacing:.4em;opacity:.65;margin-bottom:2.5rem;color:var(--bg)}
.s-chapter h2{font-family:var(--display-font);font-size:clamp(40px,10cqi,110px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.02;margin:0;color:var(--bg)}
.s-chapter .sub{margin-top:2rem;font-style:italic;font-size:clamp(16px,2.2cqi,26px);opacity:.75;line-height:1.45;max-width:660px;color:var(--bg)}
.s-split{display:grid;grid-template-columns:1fr 1px 1fr;gap:2.5rem;align-items:center;height:100%}
.s-split .split-col{display:flex;flex-direction:column;justify-content:center;gap:1.5rem}
.s-split .split-col h3{font-family:var(--display-font);font-size:clamp(26px,5cqi,52px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0}
.s-split .split-col .body{font-size:clamp(16px,2cqi,24px);color:var(--fg-muted);line-height:1.55}
.s-split .split-divider{background:color-mix(in srgb,var(--fg) 15%,transparent);height:60%;align-self:center}
.s-stats{justify-content:center}.s-stats h3{font-family:var(--display-font);font-size:clamp(28px,5cqi,54px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 2.5rem}
.s-stats .stats-grid{display:grid;gap:1.5rem;grid-template-columns:repeat(var(--stat-cols,4),minmax(0,1fr))}
.s-stats .stat-card{display:flex;flex-direction:column;gap:.75rem;border-radius:1rem;padding:1.5rem;background:color-mix(in srgb,var(--fg) 5%,transparent);border:1.5px solid color-mix(in srgb,var(--fg) 10%,transparent)}
.s-stats .stat-value{font-family:var(--display-font);font-size:clamp(32px,6cqi,64px);font-weight:900;letter-spacing:-.04em;line-height:1}
.s-stats .stat-label{font-size:clamp(13px,1.8cqi,20px);font-weight:600;line-height:1.3}
.s-stats .stat-note{font-size:clamp(11px,1.4cqi,16px);color:var(--fg-muted);line-height:1.4;font-style:italic}
.s-stats .stat-bar{height:3px;border-radius:999px;margin-top:auto}
.s-compare{justify-content:center}.s-compare h3{font-family:var(--display-font);font-size:clamp(28px,5cqi,54px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 2rem}
.s-compare .cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
.s-compare .cmp-col{display:flex;flex-direction:column;gap:1rem;border-radius:1rem;padding:1.75rem}
.s-compare .cmp-col.muted{background:color-mix(in srgb,var(--fg) 6%,transparent);border:1.5px solid color-mix(in srgb,var(--fg) 12%,transparent)}
.s-compare .cmp-col.accent{background:color-mix(in srgb,var(--accent) 14%,transparent);border:1.5px solid color-mix(in srgb,var(--accent) 35%,transparent)}
.s-compare .cmp-header{display:inline-block;align-self:flex-start;border-radius:999px;padding:.3rem 1.1rem;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em}
.s-compare .cmp-header.muted{border:1.5px solid color-mix(in srgb,var(--fg) 22%,transparent);color:var(--fg-muted)}
.s-compare .cmp-header.accent{background:var(--accent);color:var(--bg)}
.s-compare .cmp-col ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.9rem}
.s-compare .cmp-col li{display:flex;align-items:flex-start;gap:.75rem;font-size:clamp(14px,2cqi,22px);line-height:1.4}
.s-compare .cmp-col li .marker{flex-shrink:0;font-weight:700;font-size:.9em;margin-top:.1em}
.s-chart{justify-content:center}.s-chart h3{font-family:var(--display-font);font-size:clamp(28px,5cqi,54px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 2rem}
.s-chart .chart-card{display:flex;flex-direction:column;gap:1.5rem;border-radius:1.5rem;padding:2rem;background:color-mix(in srgb,var(--fg) 5%,transparent);border:1.5px solid color-mix(in srgb,var(--fg) 9%,transparent)}
.s-chart .chart-row{display:flex;align-items:center;gap:1.5rem}
.s-chart .chart-label{flex-shrink:0;text-align:right;font-size:clamp(13px,1.8cqi,20px);font-weight:600;color:var(--fg-muted);font-style:italic;width:clamp(110px,20cqi,240px)}
.s-chart .chart-track{flex:1;height:clamp(32px,5cqi,52px);border-radius:999px;background:color-mix(in srgb,var(--fg) 8%,transparent);border:1.5px solid color-mix(in srgb,var(--fg) 12%,transparent);overflow:hidden}
.s-chart .chart-fill{height:100%;border-radius:999px;display:flex;align-items:center;justify-content:flex-end;padding-right:1rem}
.s-chart .chart-fill span{font-size:clamp(12px,1.6cqi,18px);font-weight:700;color:var(--bg);letter-spacing:-.01em}
.s-toc{justify-content:center}.s-toc h3{font-family:var(--display-font);font-size:clamp(28px,5cqi,52px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 2rem}
.s-toc .toc-grid{display:grid;gap:1rem;grid-template-columns:repeat(var(--toc-cols,3),minmax(0,1fr))}
.s-toc .toc-card{display:flex;flex-direction:column;gap:.5rem;border-radius:1.25rem;padding:1.25rem 1.5rem;background:color-mix(in srgb,var(--accent) 8%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent)}
.s-toc .toc-num{font-family:var(--display-font);font-weight:800;font-size:clamp(18px,3.5cqi,36px);color:var(--accent);letter-spacing:-.03em;line-height:1}
.s-toc .toc-title{font-family:var(--display-font);font-weight:var(--display-weight,800);font-size:clamp(15px,2.2cqi,24px);line-height:1.2}
.s-toc .toc-sub{font-size:clamp(11px,1.4cqi,15px);color:var(--fg-muted);line-height:1.4}
.s-flow{justify-content:center}.s-flow h3{font-family:var(--display-font);font-size:clamp(28px,5cqi,52px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 3rem}
.s-flow .flow-row{display:flex;align-items:flex-start;gap:0}
.s-flow .flow-col{flex:1;display:flex;flex-direction:column;align-items:center;position:relative}
.s-flow .flow-node{width:clamp(44px,6cqi,64px);height:clamp(44px,6cqi,64px);border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:var(--display-font);font-weight:800;font-size:clamp(14px,2cqi,22px);color:var(--bg);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent);position:relative;z-index:2}
.s-flow .flow-connector{position:absolute;right:-50%;top:50%;height:3px;width:100%;background:linear-gradient(90deg,var(--accent),color-mix(in srgb,var(--accent) 25%,transparent));border-radius:999px;z-index:1;transform:translateY(-50%)}
.s-flow .flow-text{margin-top:1rem;text-align:center;padding:0 .5rem}
.s-flow .flow-label{font-family:var(--display-font);font-weight:700;font-size:clamp(13px,1.8cqi,20px);line-height:1.25}
.s-flow .flow-desc{font-size:clamp(11px,1.3cqi,15px);color:var(--fg-muted);margin-top:.3rem;line-height:1.4}
.s-timeline{justify-content:center}.s-timeline h3{font-family:var(--display-font);font-size:clamp(28px,5cqi,52px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 2.5rem}
.s-timeline .tl-col{display:flex;flex-direction:column;gap:0}
.s-timeline .tl-event{display:flex;align-items:flex-start;gap:1.5rem}
.s-timeline .tl-date-col{flex-shrink:0;width:clamp(80px,12cqi,140px);text-align:right;display:flex;flex-direction:column;align-items:flex-end}
.s-timeline .tl-date{font-family:var(--display-font);font-weight:700;font-size:clamp(13px,1.8cqi,20px);color:var(--accent);letter-spacing:-.02em;line-height:1}
.s-timeline .tl-track{width:3px;flex:1;margin-top:6px;min-height:clamp(14px,2cqi,28px);background:linear-gradient(to bottom,var(--accent),color-mix(in srgb,var(--accent) 15%,transparent));border-radius:999px}
.s-timeline .tl-dot{width:clamp(12px,1.6cqi,18px);height:clamp(12px,1.6cqi,18px);border-radius:50%;background:var(--accent);flex-shrink:0;margin-top:3px;box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 18%,transparent)}
.s-timeline .tl-content{display:flex;flex-direction:column;gap:.25rem;padding-bottom:clamp(16px,2.5cqi,32px)}
.s-timeline .tl-title{font-family:var(--display-font);font-weight:700;font-size:clamp(16px,2.2cqi,26px);line-height:1.2}
.s-timeline .tl-desc{font-size:clamp(12px,1.5cqi,18px);color:var(--fg-muted);line-height:1.4}
.s-matrix{justify-content:center}.s-matrix h3{font-family:var(--display-font);font-size:clamp(26px,4.5cqi,50px);font-weight:var(--display-weight,800);letter-spacing:var(--display-tracking,-.02em);line-height:1.1;margin:0 0 1.5rem}
.s-matrix .mx-table{border-radius:1.25rem;overflow:hidden;border:1px solid color-mix(in srgb,var(--fg) 12%,transparent)}
.s-matrix .mx-header{display:grid;background:color-mix(in srgb,var(--accent) 10%,transparent);border-bottom:2px solid color-mix(in srgb,var(--accent) 25%,transparent)}
.s-matrix .mx-col-head{padding:clamp(10px,1.4cqi,16px);font-family:var(--display-font);font-weight:700;font-size:clamp(13px,1.7cqi,19px);text-align:center;color:var(--accent)}
.s-matrix .mx-row{display:grid}.s-matrix .mx-row.alt{background:color-mix(in srgb,var(--fg) 3%,transparent)}
.s-matrix .mx-row-label{padding:clamp(10px,1.4cqi,16px) clamp(12px,2cqi,20px);font-weight:600;font-size:clamp(13px,1.7cqi,19px);line-height:1.3}
.s-matrix .mx-cell{padding:clamp(10px,1.4cqi,16px);text-align:center;font-size:clamp(16px,2.2cqi,26px);font-weight:700}
.s-matrix .mx-cell.yes{color:var(--accent)}.s-matrix .mx-cell.no{color:var(--fg-muted)}.s-matrix .mx-cell.partial{color:var(--accent-2,var(--fg-muted))}
`

// ── Minimal HTML for each slide type ─────────────────────────────────────
const ACCENT_COLORS = ['var(--accent)', 'var(--accent-2,var(--fg-muted))',
  'color-mix(in srgb,var(--accent) 60%,var(--accent-2,var(--fg-muted)))']

const SLIDE_HTMLS = {
  cover: `<div class="slide-body s-cover">
    <div class="eyebrow">Cover</div>
    <h1 class="display">SY PPT 模板<br>更加实用的 AI PPT 模板</h1>
    <p>一份 Markdown，无限可能 · 无云端 · 无账号 · 无水印</p>
  </div>`,

  bigText: `<div class="slide-body s-bigText">
    <div class="eyebrow">这个时代的痛点</div>
    <h2 class="display">做一份能看的 PPT，太慢了</h2>
  </div>`,

  bigNumber: `<div class="slide-body s-bigNumber">
    <div class="num">4.7<span style="font-size:.45em;opacity:.7">h</span></div>
    <div class="cap">非设计师制作一份演示文稿的平均时长</div>
  </div>`,

  quote: `<div class="slide-body s-quote">
    <div class="mark">&ldquo;</div>
    <blockquote class="display">好的工具让思维流动<br>而不是被格式绊住脚步</blockquote>
    <div class="cite">— 十页 Deck 设计备忘录</div>
  </div>`,

  list: `<div class="slide-body s-list">
    <h3>设计三原则</h3>
    <ul>
      <li><span class="ord">01</span><span>内容优先 — Markdown 是输入，美是输出</span></li>
      <li><span class="ord">02</span><span>单文件交付 — 发给任何人，双击就能打开</span></li>
      <li><span class="ord">03</span><span>中国场景优先 — 14 个本土主题</span></li>
    </ul>
  </div>`,

  section: `<div class="slide-body s-section">
    <h3>给创作者的话</h3>
    <div class="body">你只需要有想法。\n我们不想让你花时间在颜色、字号、对齐上。\n这些事情，工具来做。</div>
  </div>`,

  priceCard: `<div class="slide-body s-priceCard">
    <div class="pc-title">招牌奶茶</div>
    <div class="pc-row">
      <span class="pc-currency">¥</span>
      <span class="pc-price">9.9</span>
      <span class="pc-unit">/ 杯</span>
    </div>
    <div class="pc-orig">原价 ¥19.8</div>
    <div class="pc-tag">全场买一送一 · 仅此 7 天</div>
  </div>`,

  contact: `<div class="slide-body s-contact">
    <h3>联系我们</h3>
    <ul>
      <li><span class="icon">📞</span><span class="label">电话</span><span class="value">138-0013-8000</span></li>
      <li><span class="icon">💬</span><span class="label">微信</span><span class="value">shiye-ppt</span></li>
      <li><span class="icon">📍</span><span class="label">地址</span><span class="value">北京市朝阳区 · 三里屯</span></li>
    </ul>
  </div>`,

  qrCode: `<div class="slide-body s-qrCode">
    <div class="qr-box" style="width:240px;height:240px"><div style="font-size:3em;line-height:1;color:var(--fg-muted)">⊞</div></div>
    <div class="qr-caption">扫码加微信领优惠券</div>
  </div>`,

  posterHero: `<div class="slide-body s-posterHero">
    <div class="countdown" style="display:inline-block;padding:.375rem 1.25rem;border-radius:999px;background:var(--accent);color:var(--bg);font-size:clamp(14px,2cqi,22px);font-weight:700;margin-bottom:1.5rem">今晚 8 点</div>
    <h2>周年庆<br>开幕</h2>
    <div class="subtitle">连续 3 天 / 错过等一年</div>
    <div class="cta">预订包间</div>
  </div>`,

  image: `<div class="slide-body s-image">
    <div style="width:60%;height:60%;background:color-mix(in srgb,var(--accent) 15%,transparent);border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:2em;color:var(--fg-muted)">🖼</div>
    <div style="font-size:clamp(14px,2cqi,22px);color:var(--fg-muted);letter-spacing:.05em">图片标题</div>
  </div>`,

  iconRow: `<div class="slide-body s-iconRow" style="--icon-cols:4">
    <h3>一个工具，四种超能力</h3>
    <ul>
      ${['⚡','🛡','📈','🎯'].map((e,i)=>`<li>
        <span class="icon-tile"><span style="font-size:2em">${e}</span></span>
        <span class="label">功能 ${i+1}</span>
      </li>`).join('')}
    </ul>
  </div>`,

  chapter: `
    <!-- Full-bleed accent: absolute overlay covers the slide -->
    <div style="position:absolute;inset:0;background:color-mix(in srgb,var(--accent) 88%,var(--fg));z-index:0"></div>
    <div class="slide-body s-chapter" style="position:relative;z-index:1">
      <div class="eyebrow">Chapter 01</div>
      <h2>这一年</h2>
      <p class="sub">我们做了什么，学到了什么</p>
    </div>`,

  split: `<div class="slide-body s-split">
    <div class="split-col">
      <h3>字体碰撞即设计</h3>
      <div class="body">Bricolage Grotesque 的机械感 × Instrument Serif 的温度感 — 不是选一个字体，是让两种性格相遇</div>
    </div>
    <div class="split-divider"></div>
    <div class="split-col">
      <h3>4 色系统</h3>
      <div class="body">羊皮纸 · 砖红 · 琥珀金 · 墨黑。每种角色都有精确语义，不添加第五色。</div>
    </div>
  </div>`,

  stats: `<div class="slide-body s-stats">
    <h3>核心指标</h3>
    <div class="stats-grid" style="--stat-cols:4">
      ${[['21','精选主题'],['50','Lucide 图标'],['5','输出比例'],['4.9','用户满意度']].map(([v,l],i)=>`
      <div class="stat-card">
        <div class="stat-value" style="color:${ACCENT_COLORS[i%2]}">${v}</div>
        <div class="stat-label">${l}</div>
        <div class="stat-bar" style="background:${ACCENT_COLORS[i%2]}"></div>
      </div>`).join('')}
    </div>
  </div>`,

  compare: `<div class="slide-body s-compare">
    <h3>传统工具 vs 十页 Deck</h3>
    <div class="cmp-grid">
      <div class="cmp-col muted">
        <div class="cmp-header muted">传统工具</div>
        <ul>
          ${['需要安装软件','无法 AI 直接调用','不支持中文本地'].map(t=>`<li><span class="marker" style="color:var(--fg-muted)">–</span><span style="color:var(--fg-muted)">${t}</span></li>`).join('')}
        </ul>
      </div>
      <div class="cmp-col accent">
        <div class="cmp-header accent">十页 Deck</div>
        <ul>
          ${['克隆即用，零配置','AGENTS.md 一步到位','14 个中国本地场景'].map(t=>`<li><span class="marker" style="color:var(--accent)">✓</span><span>${t}</span></li>`).join('')}
        </ul>
      </div>
    </div>
  </div>`,

  chart: `<div class="slide-body s-chart">
    <h3>模板分布</h3>
    <div class="chart-card">
      ${[['Tier A 中国B端','78%'],['Tier B 中国C端','55%'],['Tier C 通用专业','38%'],['Tier D 国际经典','20%']].map(([l,v],i)=>`
      <div class="chart-row">
        <div class="chart-label">${l}</div>
        <div class="chart-track">
          <div class="chart-fill" style="width:${v};background:${ACCENT_COLORS[i%2]}">
            <span>${v}</span>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>`,

  toc: `<div class="slide-body s-toc">
    <h3>本次议程</h3>
    <div class="toc-grid" style="--toc-cols:3">
      ${['战略方向·2026核心目标','产品路线·三大版本','市场策略·增长飞轮','团队建设·关键岗位','财务展望·收入预测','问答·开放讨论'].map((t,i)=>`
      <div class="toc-card">
        <div class="toc-num">${String(i+1).padStart(2,'0')}</div>
        <div class="toc-title">${t.split('·')[0]}</div>
        <div class="toc-sub">${t.split('·')[1]}</div>
      </div>`).join('')}
    </div>
  </div>`,

  flow: `<div class="slide-body s-flow">
    <h3>产品上线流程</h3>
    <div class="flow-row">
      ${['需求评审','设计阶段','开发冲刺','测试验收','灰度发布'].map((s,i,a)=>`
      <div class="flow-col">
        <div style="position:relative">
          <div class="flow-node">${String(i+1).padStart(2,'0')}
            ${i<a.length-1?'<div class="flow-connector"></div>':''}
          </div>
        </div>
        <div class="flow-text"><div class="flow-label">${s}</div></div>
      </div>`).join('')}
    </div>
  </div>`,

  timeline: `<div class="slide-body s-timeline">
    <h3>公司成长轨迹</h3>
    <div class="tl-col">
      ${[['2022 Q1','公司成立','3人团队'],['2023 Q2','天使轮','融资200万'],['2024 Q1','规模化','用户10万'],['2025 Q3','A轮','估值5000万']].map(([d,t,desc],i,a)=>`
      <div class="tl-event">
        <div class="tl-date-col">
          <div class="tl-date">${d}</div>
          ${i<a.length-1?'<div class="tl-track"></div>':''}
        </div>
        <div class="tl-dot"></div>
        <div class="tl-content">
          <div class="tl-title">${t}</div>
          <div class="tl-desc">${desc}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>`,

  features: `<div class="slide-body s-features" style="justify-content:center;display:flex;flex-direction:column">
    <h3 style="font-family:var(--display-font);font-size:clamp(28px,5cqi,54px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin:0 0 2rem">产品核心能力</h3>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem">
      ${[['⚡','即插即用','自然语言描述','5 分钟上线，零代码配置'],['🛡','企业级安全','数据本地化','AES-256 + SOC2 认证'],['📈','持续优化','AI 自监控','检测异常并自动修复']].map(([e,t,s,d])=>`
      <div style="display:flex;flex-direction:column;gap:1rem;border-radius:1.25rem;padding:1.75rem;background:#fff;border:1.5px solid color-mix(in srgb,var(--fg) 10%,transparent);box-shadow:0 4px 24px -8px rgba(0,0,0,.10)">
        <div style="width:72px;height:72px;border-radius:1.2rem;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--accent) 10%,transparent);border:1.5px solid color-mix(in srgb,var(--accent) 22%,transparent);font-size:2em">${e}</div>
        <div style="font-family:var(--display-font);font-weight:700;font-size:clamp(18px,3cqi,32px);line-height:1.2">${t}</div>
        <div style="font-size:clamp(13px,1.8cqi,20px);color:var(--accent);font-weight:600">${s}</div>
        <div style="font-size:clamp(13px,1.7cqi,18px);color:var(--fg-muted);line-height:1.5">${d}</div>
      </div>`).join('')}
    </div>
  </div>`,

  matrix: `<div class="slide-body s-matrix">
    <h3>功能对比</h3>
    <div class="mx-table">
      <div class="mx-header" style="grid-template-columns:1fr 1fr 1fr 1fr">
        <div></div>
        <div class="mx-col-head">基础版</div>
        <div class="mx-col-head">专业版</div>
        <div class="mx-col-head">企业版</div>
      </div>
      ${[['AI自动生成','yes','yes','yes'],['自定义主题','no','yes','yes'],['团队协作','no','no','yes'],['API接口','no','partial','yes']].map(([f,...vals],i)=>`
      <div class="mx-row${i%2?' alt':''}" style="grid-template-columns:1fr 1fr 1fr 1fr;${i<3?'border-bottom:1px solid color-mix(in srgb,var(--fg) 8%,transparent)':''}">
        <div class="mx-row-label">${f}</div>
        ${vals.map(v=>`<div class="mx-cell ${v}">${v==='yes'?'✓':v==='no'?'✗':'◐'}</div>`).join('')}
      </div>`).join('')}
    </div>
  </div>`,
}

// ── Main ─────────────────────────────────────────────────────────────────
function buildHtml(type, slideBody) {
  return `<!doctype html>
<html lang=zh><head><meta charset=utf-8>
<style>${themeCss}</style>
<style>${HARNESS_CSS}</style>
<style>${fxCss}</style>
</head>
<body data-theme="keynote-dark">
<section data-slide aspect="16:9" style="position:relative">
  <div class="slide-inner">
    ${slideBody}
    <div class="slide-footer">01 / 01</div>
  </div>
</section>
</body></html>`
}

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()

  const results = []
  const types = Object.keys(SLIDE_HTMLS)

  for (const type of types) {
    const html = buildHtml(type, SLIDE_HTMLS[type])
    await page.setContent(html, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)

    const outPath = path.join(SHOTS_DIR, `${type}.png`)
    await page.screenshot({ path: outPath })

    const size = fs.statSync(outPath).size
    const pass = size > 40_000
    results.push({ type, pass, size: Math.round(size / 1024) + 'KB', path: outPath })
    console.log(`${pass ? '✓' : '✗'} ${type.padEnd(12)} ${Math.round(size/1024)}KB`)
  }

  await browser.close()

  const passed = results.filter(r => r.pass).length
  const report = [
    `# Verify All Types Report`,
    ``,
    `**${passed}/${types.length} PASSED** — ${new Date().toISOString()}`,
    ``,
    `| Type | Status | Size | Screenshot |`,
    `|------|--------|------|------------|`,
    ...results.map(r => `| ${r.type} | ${r.pass?'✅ PASS':'❌ FAIL'} | ${r.size} | ${r.path} |`),
  ].join('\n')

  const reportPath = '/tmp/verify-report.md'
  fs.writeFileSync(reportPath, report)
  console.log(`\nReport: ${reportPath}`)
  console.log(`Screenshots: ${SHOTS_DIR}/`)

  if (passed < types.length) {
    console.error(`\n⚠  ${types.length - passed} type(s) FAILED`)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
