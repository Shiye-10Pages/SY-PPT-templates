# AGENTS.md

This is the operating manual for AI coding agents (Claude Code, Cursor, Cline, Aider, etc.) working with **SY-PPT-templates** (a.k.a. 十页 Deck).

If you are a human, you probably want [README.md](README.md) instead.

---

## What This Library Is

SY-PPT-templates is a **Markdown → single-file HTML** slide generator with 20 curated themes, **14 of which are tuned for Chinese local scenarios** (government, SOE, restaurant promo, Xiaohongshu, Douyin, WeChat, book quotes, etc.) — these are the use cases mainstream tools like Gamma / Beautiful.ai / Tome largely ignore.

**Why it matters for agents:**
- The DSL is **a tiny, well-defined subset of Markdown**. You can learn it in 60 seconds from this file.
- Every theme is **CSS-only** — the look is driven by a small set of CSS variables. You do not need a build step to render output.
- The end deliverable is **one self-contained `.html` file**. The user double-clicks it. No server, no install, no cloud.

You do **not** need to run `pnpm dev`, start a dev server, or touch the React source code. Everything you need is in this file plus three files per template (`theme.css`, `meta.ts`, `example.md`).

---

## When to Use This

Reach for this library when the user wants any of:

- A **Chinese-context PPT** — party briefing, SOE annual report, restaurant promo, Xiaohongshu seeding, Douyin live-stream poster, WeChat Moments year-in-review, book-quote share card, kid-tutoring enrollment flyer, real-estate listing, factory monthly report, etc.
- **Sharable content cards** — small numbers of slides meant to be screenshotted into a social feed (4:5, 3:4, 9:16, 2.35:1 aspect ratios).
- **16:9 narrative decks** — keynote-style product launches, founder pitches, dashboards, Swiss-style editorial.
- A **single-file HTML deliverable** that opens by double-clicking, with no external runtime.

Do **not** use this library when:

- The user needs `.pptx` output — this is HTML-only.
- The user wants a fully WYSIWYG editor experience.

Note: animations are supported via a CSS-only FX layer opt-in by 4 themes (`keynote-dark`, `data-dashboard`, `xhs-pastel`, `swiss-paper`) — cursor-follow glow, entry stagger, hover-lift, etc. See [Interactive FX Layer](#interactive-fx-layer).

---

## How to Use This Library (Workflow)

The standard workflow:

1. **Read `index.json`** at the repo root to see all 20 templates with metadata (id, tier, scenarios, vibe, aspect ratio, palette, paths).
2. **Ask the user 1–3 brief questions** to narrow scenario: purpose, audience, desired aspect ratio (only if not obvious from the brief).
3. **Match the user's brief to the best template** using `scenarios_zh` / `scenarios_en` / `best_for` / `vibe` fields. See [How to Choose a Template](#how-to-choose-a-template) below.
4. **Read** that template's `theme.css` (palette + fonts) and the matching `src/examples/<id>.md` (concrete DSL example).
5. **Write the user's content as Markdown** following the [DSL](#the-dsl-markdown-syntax-reference) below. Aim for 6–10 slides.
6. **Render the final single-file HTML** by inlining theme CSS + a tiny render harness into the template (see [Rendering](#rendering-from-markdown-to-single-file-html) below).
7. **Save** to the user's chosen path (or `./output.html` by default); tell them to double-click to open.

Do not deviate. In particular: do not start a dev server, do not modify `src/`, do not invent new DSL syntax.

---

## The DSL: Markdown Syntax Reference

The parser is `src/parser/parseMarkdown.ts`. The rules below match it exactly. Every slide compiles to one of eleven `SlideAST` types.

### Deck-level frontmatter (optional)

A single `@ratio` line at the very top of the markdown (before any `# Cover`) overrides the theme's default aspect ratio for the whole deck:

```
@ratio 9:16

# Cover title
...
```

Accepted values: `16:9` / `4:5` / `3:4` / `9:16` / `2.35:1`. If absent, the theme's `defaultAspect` (from its `meta.ts`) is used. The directive is stripped before slide parsing so it never renders.

### Slide separator

```
---
```

A line containing only `---` (with optional surrounding whitespace) ends the current slide and starts a new one. **Always put a blank line above and below `---`**.

Fallback: if a Markdown source has **no `---` at all**, every `## Heading` starts a new slide.

### 1. Cover slide (first slide only)

```
# Big Cover Title
Optional subtitle that wraps onto multiple lines
```

Rule: A first-slide chunk where line 1 is `# Title`. Everything after line 1 becomes the subtitle (joined with spaces). Renders as `cover` type — big title, small subtitle, "COVER" label.

### 2. Big text (single emphatic statement)

```
# Just one big line
```

OR with eyebrow:

```
## Small eyebrow
# Big punchline
```

Renders as `bigText` — fills the slide with one heroic phrase.

### 3. Big number

```
> 90%
optional caption below
```

Rule: a `>` blockquote line whose content matches a number pattern (`$NN`, `¥NN`, `90`, `90%`, `90K`, `1.5M`, `1.2B`, `1×`, etc.). The line after `>` (no leading marker) becomes the caption.

Supported number suffixes: `%`, `×`, `K`, `M`, `B` (case-insensitive). Supported prefixes: `$`, `¥`, `￥`, `+`, `-`.

Renders as `bigNumber` — the number explodes to fill the slide.

### 4. Quote

```
> This is the quote line. Multiple > lines are joined together.
> Optional second line of quote.
Optional citation (no leading > marker)
```

Rule: one or more `>` lines whose content is **not** a number pattern. Any non-`>` lines become the citation, joined with spaces.

Renders as `quote` — large curly quote mark, the quote body in display font, citation underneath.

### 5. List

```
## Optional list heading
- Item one
- Item two
- Item three
```

OR numbered:

```
## Optional heading
1. First
2. Second
3. Third
```

OR with `>` heading:

```
> Heading via blockquote
- Item one
- Item two
```

Bullets accepted: `-`, `*`, `+`, or `1.`, `2.`, `3.` etc. The renderer auto-scales font and gap when the list has more than 6 / 9 items.

Renders as `list` — numbered items with hanging accent-colored ordinals (the renderer always shows numbers, regardless of marker style).

### 6. Price card

```
## Optional product / package name
¥ 38 / 位
~~原价 98~~
Optional tagline (limited time, last 3 days, etc.)
```

Rules:
- `## Title` is optional.
- The price line must match `[¥$￥]NN` optionally followed by `/ unit`. Examples: `¥ 38 / 位`, `$ 99 / mo`, `￥ 9.9 / 杯`.
- The strike-through line must match `~~ [optional 原价] [¥$] NN ~~`. Examples: `~~原价 98~~`, `~~¥ 198~~`.
- Any other non-empty line becomes the tagline.

Renders as `priceCard` — title, giant accent-colored price, optional struck-through original price, pill-shaped tagline.

### 7. Contact

```
## Optional heading
📞 138-0013-8000
💬 微信: example-account
📍 北京市朝阳区
🌐 https://example.com
📧 hello@example.com
```

OR using Chinese labels:

```
## Optional heading
电话: 138-0013-8000
微信: example-account
地址: 北京市朝阳区
网址: https://example.com
邮箱: hello@example.com
```

Recognized emoji prefixes: `📞 ☎️ ☎` (phone), `💬` (wechat), `📍` (address), `🌐` (website), `📧 ✉️` (email).

Recognized text labels: `电话 / 手机 / 微信 / 地址 / 网址 / 官网 / 邮箱 / 微博 / 抖音 / 公众号` followed by `:` or `：`.

A chunk qualifies as a contact slide only when **every non-heading line** parses as a contact channel.

Renders as `contact` — icon + label + value list.

### 8. QR code slide

```
@qr
扫码加店长微信领 50 元券
店铺名 · 分店
![alt](optional/image/path.png)
```

Rule: chunk starts with literal `@qr` directive (case-insensitive). Format:
- Line 2 = caption (the call-to-action)
- Line 3 = label (e.g. store name)
- Optional Markdown image `![alt](path)` line = the QR image source (if missing, renders a dashed placeholder)

Renders as `qrCode` — small uppercase label, square QR area (or placeholder), caption underneath.

### 9. Poster hero

```
@poster
今晚 8 点
# Big poster headline
Subtitle line
[CTA button text]
Optional countdown line
```

Rule: chunk starts with literal `@poster` directive (case-insensitive). Format:
- Pre-title line = eyebrow (or auto-becomes countdown if it starts with `今晚|明天|后天|周|月|<digit>`)
- `# Title` line = the big headline
- Next non-empty line after title = subtitle
- `[CTA]` in square brackets = the CTA button text
- Last non-empty line = countdown

Renders as `posterHero` — eyebrow, optional pill-shaped countdown badge, giant title, subtitle, pill-shaped CTA. Best for 9:16 vertical posters.

### 10. Image slide (`@image` directive)

```
@image
![alt](https://example.com/image.jpg)
Optional caption text below
```

Or just a URL on its own line:

```
@image
https://example.com/cover.jpg
Optional caption
```

Renders as `image` — single image centred on the slide with optional caption. For URL-served images the file is fetched at render time; for data URIs (e.g. images dragged into the editor) the bytes are inlined into the HTML.

### 11. Icon row (`@icons` directive)

```
@icons
## 三大优势

- :rocket: 极速生成
- :shield-check: 隐私保护
- :sparkles: 视觉惊艳
```

Body items can be bullet-prefixed (`- :icon: label`) or bare (`:icon: label`). Heading via `## ...` is optional. Renders as 3–6 accent-tinted tiles with an inline Lucide SVG icon and a label underneath.

**Available icons (50, all from Lucide MIT):**

`check`, `x`, `star`, `heart`, `sparkles`, `zap`, `flame`, `award`, `trophy`, `trending-up`, `trending-down`, `bar-chart`, `pie-chart`, `activity`, `target`, `rocket`, `gauge`, `user`, `users`, `phone`, `mail`, `message-circle`, `map-pin`, `globe`, `home`, `briefcase`, `package`, `layers`, `cpu`, `database`, `code`, `smartphone`, `monitor`, `dollar-sign`, `shopping-cart`, `gift`, `tag`, `credit-card`, `arrow-right`, `arrow-up-right`, `lightbulb`, `shield`, `shield-check`, `lock`, `clock`, `calendar`, `search`, `settings`, `bookmark`, `book`, `camera`, `image`, `film`, `leaf`, `moon`, `sun`.

Unknown names are kept verbatim (the slide renders with a bullet placeholder).

### Inline icons (any text)

You can put `:icon-name:` tokens inside cover subtitles, list items, section bodies, quote text, etc. They become inline SVGs at render time (sized to the surrounding text):

```
- :star: 高品质 — 我们用得心服口服
- :trending-up: 数据 — 用户留存率提升 40%
```

Same name pool as `@icons`. Unknown tokens are passed through unchanged.

### Images inside other slides

Drop a Markdown image line `![alt](url)` into a **cover**, **section**, or **`@poster`** chunk and the renderer pulls it out as a layered image:

- **Cover**: full-bleed background image with a dark vignette over the title/subtitle
- **Section**: two-column layout (image on the left at 4:5 narrow widths, on a side at 16:9)
- **`@poster`**: image becomes the hero background

Example:

```
# 朋友圈直发
副标题 :star: 你也能做出来

![cover](https://images.unsplash.com/photo-...)
```

**For agents**: prefer hosted URLs (`https://...`). Don't generate data URIs unless the user explicitly hands you one; data URIs balloon the HTML size by ~33% and can't be cached. The editor's drag-paste UX produces data URIs for end users — that's the only place they're expected.

### 12. Section (fallback)

Anything that doesn't match the above falls back to `section`: the first heading becomes the section heading, everything else becomes body text. If the body contains a `![alt](url)` line, the image is rendered side-by-side with the text.

```
## Section heading
Plain body text. Multiple lines preserved.
```

### Summary table

| If the chunk looks like…                                    | Renders as     |
| ----------------------------------------------------------- | -------------- |
| First slide with `# Title`                                  | `cover`        |
| Single `# Big` line (or `## eyebrow` + `# Big`)            | `bigText`      |
| `> 90%` (a number)                                          | `bigNumber`    |
| `> some text` (not a number)                                | `quote`        |
| `## Heading` + bulleted/numbered list                       | `list`         |
| `¥ NN` price line + optional strike + tagline               | `priceCard`    |
| Lines all leading with 📞💬📍🌐📧 or label:                  | `contact`      |
| Starts with `@qr`                                           | `qrCode`       |
| Starts with `@poster`                                       | `posterHero`   |
| Starts with `@image`                                        | `image`        |
| Starts with `@icons`                                        | `iconRow`      |
| Anything else                                               | `section`      |

---

## How to Choose a Template

Read `index.json`. Each template has:

- `tier`: A (Chinese B2B) / B (Chinese C-end content) / C (general professional) / D (international classic)
- `scenarios_zh` and `scenarios_en`: keyword lists
- `audience`: who this is for
- `default_ratio`: `16:9` / `4:5` / `9:16` / `2.35:1` / `3:4`
- `vibe`: tone description
- `best_for`: trigger phrases — match these against the user's brief
- `color_palette`: visual summary

**Matching heuristic:**

1. **Aspect ratio first.** Is it a vertical phone share (3:4, 4:5, 9:16), a horizontal narrative (16:9), or an ultrawide cover (2.35:1)? This eliminates ~70% of options.
2. **Scenario keyword match.** Scan `best_for` and `scenarios_zh` for words in the user brief.
3. **Vibe match.** If two are close, pick the one whose `vibe` matches the user's tone — formal / playful / authoritative / minimal.
4. **Tier as tiebreaker.** Prefer Tier A for B2B Chinese, Tier B for C-end Chinese content, Tier C for generic professional, Tier D when the user explicitly wants Apple-keynote or Swiss-editorial vibes.

When the user is vague, prefer:
- `keynote-dark` for product launches in English / international context
- `restaurant-promo` for warm celebratory Chinese promos
- `xhs-pastel` for soft pastel content cards
- `solo-founder` for minimal personal pitches

Never mix two themes in one deck. If you genuinely can't choose, ask the user one question.

---

## Interactive FX Layer

4 themes opt in to a CSS-only "FX layer" (plus a tiny mouse-tracker JS) for richer interactivity. The rest of the 16 themes are untouched.

| Theme | FX |
|---|---|
| `keynote-dark` | Cursor-follow indigo halo + big-number pop entry |
| `data-dashboard` | Cursor-follow cyan halo + big-number pop + list-item progress bars |
| `xhs-pastel` | Hover-lift on items + slow background gradient drift |
| `swiss-paper` | Animated red rule that draws in on each slide (no cursor follow — keeps minimalism) |

Implementation: each theme's `theme.css` sets per-FX flags like `--fx-mouse-glow: 1`. A 1.2KB runtime (`exportedDeckScript` in `src/export/exportHtml.ts`) promotes those CSS vars to `data-fx-*` attributes on the deck root; `src/styles/fx.css` selectors light up the matching effect. The same script also writes mouse position to `--mx`/`--my` so cursor halos follow the pointer.

**For agent-generated decks**: include the FX layer CSS (`fx.css`) and the runtime script in your rendered HTML. The runtime is reproduced in the "Putting it all together" section below. If you skip these, the 4 themes still look fine — just without the interactive polish.

All FX respect `prefers-reduced-motion: reduce` and gracefully degrade if JS is disabled.

## Rendering: From Markdown to Single-File HTML

The repo's React source (`src/`) is **for the live editor preview only**. As an agent, **you should not use it**. Instead, render statically using the recipe below.

### The recipe

A rendered deck is **one HTML file** with:

1. A `<head>` containing:
   - `<title>` (you set this from the user's brief)
   - Google Fonts CSS link (Inter; theme.css fonts handle Chinese via system fallback)
   - The full contents of the chosen `src/themes/<id>/theme.css` pasted inline
   - A small **render harness CSS** (provided in full below — copy-paste)
2. A `<body data-theme="<id>">` containing one `<section data-slide aspect="<ratio>">` per slide, each holding one slide-body element.

Slide layout, gradients, fonts, and accent colors are driven by the **CSS variables** that `theme.css` sets on `[data-theme="<id>"]`. The render harness wires those variables to a fixed visual structure that mirrors `src/components/Slide.tsx`.

### Render harness CSS (copy verbatim)

Paste this **after** the theme.css block, inside a single `<style>` tag. It is plain CSS — no Tailwind, no build step.

```html
<style>
  /* --- base / reset --- */
  *,*::before,*::after { box-sizing: border-box; }
  html,body { margin:0; padding:0; height:100%; }
  body {
    font-family: var(--body-font, "PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif);
    background: var(--bg, #0a0a0a);
    color: var(--fg, #fafafa);
    -webkit-font-smoothing: antialiased;
  }

  /* --- deck shell --- */
  [data-deck-root] {
    height: 100vh;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }
  section[data-slide] {
    scroll-snap-align: start;
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, var(--bg-grad-from) 0%, var(--bg-grad-to) 100%);
    color: var(--fg);
    padding: var(--slide-padding, 8vw);
  }
  /* Vertical aspect: slide inner is letterboxed to its aspect ratio */
  section[data-slide][aspect="4:5"]  > .slide-inner,
  section[data-slide][aspect="3:4"]  > .slide-inner,
  section[data-slide][aspect="9:16"] > .slide-inner {
    aspect-ratio: var(--ar);
    height: 90%;
    max-height: 90%;
    width: auto;
  }
  section[data-slide][aspect="2.35:1"] > .slide-inner {
    aspect-ratio: 2.35/1;
    width: 92%;
    max-width: 92%;
    height: auto;
  }
  section[data-slide][aspect="16:9"] > .slide-inner {
    width: 100%;
    height: 100%;
  }
  .slide-inner {
    container-type: inline-size;
    position: relative;
    display: flex;
    flex-direction: column;
    max-width: 1200px;
    margin: 0 auto;
  }
  /* Decorative glow corners */
  section[data-slide]::before {
    content:"";
    position: absolute; inset: 0;
    pointer-events: none;
    background:
      radial-gradient(60% 50% at 80% 20%, var(--accent-glow-1) 0%, transparent 60%),
      radial-gradient(50% 40% at 10% 90%, var(--accent-glow-2) 0%, transparent 55%);
  }
  .slide-body { position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; }
  .slide-footer { position: absolute; bottom: 1.5rem; right: 2rem; z-index: 1; font-size: 0.75rem; letter-spacing: 0.25em; text-transform: uppercase; font-variant-numeric: tabular-nums; color: var(--fg-muted); }

  /* --- typography helpers (all sizes use container queries on .slide-inner) --- */
  .display { font-family: var(--display-font); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); }
  .eyebrow { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.3em; color: var(--fg-muted); }

  /* --- slide types --- */

  /* cover */
  .s-cover { justify-content: center; }
  .s-cover .eyebrow { margin-bottom: 1.5rem; }
  .s-cover h1 { font-size: clamp(48px, 13cqi, 140px); line-height: 0.95; margin: 0; }
  .s-cover p { margin-top: 2rem; max-width: 820px; font-size: clamp(18px, 2.5cqi, 28px); color: var(--fg-muted); line-height: 1.5; }

  /* bigText */
  .s-bigText { justify-content: center; }
  .s-bigText .eyebrow { margin-bottom: 2rem; }
  .s-bigText h2 { font-size: clamp(40px, 11cqi, 120px); line-height: 1.05; margin: 0; }

  /* bigNumber */
  .s-bigNumber { justify-content: center; align-items: center; text-align: center; }
  .s-bigNumber .num { font-family: var(--display-font); font-weight: 900; letter-spacing: -0.06em; color: var(--accent); font-size: clamp(120px, 35cqi, 360px); line-height: 1; font-variant-numeric: tabular-nums; }
  .s-bigNumber .cap { margin-top: 3rem; max-width: 820px; font-size: clamp(18px, 3cqi, 32px); color: var(--fg-muted); line-height: 1.4; }

  /* quote */
  .s-quote { justify-content: center; }
  .s-quote .mark { font-size: clamp(80px, 17.5cqi, 180px); color: var(--accent); font-family: var(--display-font); font-weight: 700; line-height: 1; margin-bottom: 2rem; }
  .s-quote blockquote { margin: 0; font-family: var(--display-font); font-size: clamp(28px, 6.5cqi, 64px); font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
  .s-quote .cite { margin-top: 2.5rem; font-size: 0.875rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--fg-muted); }

  /* list */
  .s-list { justify-content: center; }
  .s-list h3 { font-family: var(--display-font); font-size: clamp(36px, 7cqi, 72px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 1.1; margin: 0 0 3rem; }
  .s-list ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 24px; }
  .s-list li { display: flex; align-items: baseline; gap: 1.5rem; font-size: clamp(20px, 3cqi, 36px); line-height: 1.4; }
  .s-list li .ord { color: var(--accent); font-weight: 700; font-size: 0.75em; font-family: var(--display-font); flex-shrink: 0; font-variant-numeric: tabular-nums; }
  /* dense lists auto-shrink */
  .s-list.dense h3 { font-size: clamp(28px,5cqi,52px); margin-bottom: 2.25rem; }
  .s-list.dense ul { gap: 14px; }
  .s-list.dense li { font-size: clamp(16px,2.5cqi,28px); }
  .s-list.very-dense ul { gap: 10px; }
  .s-list.very-dense li { font-size: clamp(14px,2cqi,22px); }

  /* section */
  .s-section { justify-content: center; }
  .s-section h3 { font-family: var(--display-font); font-size: clamp(32px,6.5cqi,64px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 1.1; margin: 0 0 2rem; }
  .s-section .body { font-size: clamp(18px,2.5cqi,28px); color: var(--fg-muted); line-height: 1.55; white-space: pre-wrap; }

  /* priceCard */
  .s-priceCard { justify-content: center; align-items: center; text-align: center; }
  .s-priceCard .pc-title { font-family: var(--display-font); font-size: clamp(28px,5cqi,56px); font-weight: var(--display-weight,800); margin-bottom: 1.5rem; max-width: 820px; }
  .s-priceCard .pc-row { display: flex; align-items: baseline; gap: 0.75rem; font-variant-numeric: tabular-nums; }
  .s-priceCard .pc-currency { color: var(--accent); font-family: var(--display-font); font-size: clamp(40px,7cqi,72px); font-weight: 700; line-height: 1; }
  .s-priceCard .pc-price { color: var(--accent); font-family: var(--display-font); font-size: clamp(120px,26cqi,280px); font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
  .s-priceCard .pc-unit { color: var(--fg-muted); font-size: clamp(24px,3cqi,36px); font-weight: 500; line-height: 1; }
  .s-priceCard .pc-orig { margin-top: 1.5rem; text-decoration: line-through; color: var(--fg-muted); font-size: clamp(20px,3cqi,32px); font-variant-numeric: tabular-nums; }
  .s-priceCard .pc-tag { margin-top: 2.5rem; display: inline-block; padding: 0.5rem 1.5rem; border-radius: 999px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); font-size: clamp(16px,2.5cqi,24px); font-weight: 600; }

  /* contact */
  .s-contact { justify-content: center; }
  .s-contact h3 { font-family: var(--display-font); font-size: clamp(32px,6cqi,64px); font-weight: var(--display-weight,800); margin: 0 0 3rem; }
  .s-contact ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1.5rem; }
  .s-contact li { display: flex; align-items: center; gap: 1.25rem; font-size: clamp(20px,3cqi,36px); font-variant-numeric: tabular-nums; }
  .s-contact .icon { width: 2.4em; text-align: center; font-size: 1em; flex-shrink: 0; }
  .s-contact .label { color: var(--fg-muted); font-size: 0.65em; width: 3em; font-weight: 500; }
  .s-contact .value { font-weight: 600; }

  /* qrCode */
  .s-qrCode { justify-content: center; align-items: center; text-align: center; }
  .s-qrCode .qr-label { font-size: 0.875rem; letter-spacing: 0.3em; text-transform: uppercase; color: var(--fg-muted); margin-bottom: 2rem; }
  .s-qrCode .qr-box { width: min(50vh,50vw); height: min(50vh,50vw); background: color-mix(in srgb, var(--fg) 8%, transparent); border: 2px dashed color-mix(in srgb, var(--fg) 30%, transparent); border-radius: 24px; display: flex; align-items: center; justify-content: center; }
  .s-qrCode .qr-box .placeholder { color: var(--fg-muted); font-size: clamp(14px,2cqi,20px); display:flex; flex-direction:column; gap:0.75rem; align-items:center; }
  .s-qrCode .qr-box .placeholder .grid { font-size: 4em; line-height: 1; }
  .s-qrCode .qr-box img { width: 90%; height: 90%; object-fit: contain; border-radius: 12px; }
  .s-qrCode .qr-caption { margin-top: 3rem; max-width: 820px; font-family: var(--display-font); font-size: clamp(24px,4cqi,44px); font-weight: var(--display-weight,800); line-height: 1.25; }

  /* posterHero */
  .s-posterHero { justify-content: center; align-items: flex-start; text-align: left; }
  .s-posterHero .countdown { display: inline-block; padding: 0.375rem 1.25rem; border-radius: 999px; background: var(--accent); color: var(--bg); font-size: clamp(14px,2cqi,22px); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 1.5rem; }
  .s-posterHero .eyebrow { margin-bottom: 1rem; }
  .s-posterHero h2 { font-family: var(--display-font); font-size: clamp(56px,16cqi,180px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 0.95; margin: 0; }
  .s-posterHero .subtitle { margin-top: 1.5rem; max-width: 820px; color: var(--fg-muted); font-size: clamp(20px,3cqi,36px); line-height: 1.35; }
  .s-posterHero .cta { display: inline-block; margin-top: 2.5rem; padding: 0.75rem 2rem; border-radius: 999px; background: var(--accent); color: var(--bg); font-size: clamp(18px,2.5cqi,28px); font-weight: 700; }

  /* image slide */
  .s-image { justify-content: center; align-items: center; gap: 1.5rem; }
  .s-image img { max-height: 78%; max-width: 100%; border-radius: 24px; object-fit: contain; box-shadow: 0 24px 64px -32px rgba(0,0,0,0.45); }
  .s-image .caption { max-width: 820px; text-align: center; color: var(--fg-muted); font-size: clamp(14px, 2cqi, 22px); letter-spacing: 0.05em; }

  /* iconRow slide */
  .s-iconRow { justify-content: center; }
  .s-iconRow h3 { font-family: var(--display-font); font-size: clamp(32px, 6cqi, 60px); font-weight: var(--display-weight,800); letter-spacing: var(--display-tracking,-0.02em); line-height: 1.1; margin: 0 0 3rem; }
  .s-iconRow ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 2rem; grid-template-columns: repeat(var(--icon-cols, 3), minmax(0, 1fr)); }
  .s-iconRow li { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
  .s-iconRow .icon-tile { width: clamp(64px, 10cqi, 120px); height: clamp(64px, 10cqi, 120px); display: flex; align-items: center; justify-content: center; border-radius: 1rem; background: color-mix(in srgb, var(--accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); color: var(--accent); }
  .s-iconRow .icon-tile svg { width: 55%; height: 55%; }
  .s-iconRow .label { font-size: clamp(14px, 2.2cqi, 24px); line-height: 1.4; font-weight: 600; }

  /* inline icon (`:icon-name:` in any text) */
  .icon-inline { display: inline-flex; align-items: center; width: 1em; height: 1em; margin-inline: 0.12em; color: var(--accent); vertical-align: -0.15em; }
  .icon-inline svg { width: 100%; height: 100%; }
</style>
```

### Interactive FX layer (optional, opt-in by 4 themes)

Append this `<style>` block after the harness CSS for FX-enabled themes. Themes opt in via `--fx-*: 1` flags in their `theme.css`; this stylesheet contains the actual visual rules.

```html
<style>
[data-deck-root] { --mx: 0.5; --my: 0.5; }
[data-theme] [data-slide]::after {
  content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
  opacity: calc(var(--fx-mouse-glow, 0) * 1);
  background: radial-gradient(36% 28% at calc(var(--mx)*100%) calc(var(--my)*100%),
    color-mix(in srgb, var(--accent) 28%, transparent) 0%, transparent 70%);
  transition: background 80ms linear;
}
[data-fx-hover-lift="1"] [data-slide] li { transition: transform 240ms cubic-bezier(0.2,0.7,0.1,1); }
[data-fx-hover-lift="1"] [data-slide] li:hover { transform: translateY(-3px); }
[data-fx-bg-breathe="1"] [data-slide] { animation: fx-breathe 16s ease-in-out infinite alternate; background-size: 200% 200%; }
@keyframes fx-breathe { 0%{background-position:0% 0%} 100%{background-position:100% 50%} }
[data-fx-accent-rule="1"] [data-slide] .slide-body::before {
  content:""; position:absolute; top:0; left:0; height:4px; width:0; background:var(--accent);
  animation: fx-rule-draw 900ms cubic-bezier(0.2,0.7,0.1,1) 200ms forwards;
}
@keyframes fx-rule-draw { to { width: 30%; } }
[data-fx-bignum-pop="1"] [data-slide-anim].slide-visible .num,
[data-fx-bignum-pop="1"] [data-slide-anim].slide-visible blockquote {
  animation: fx-bignum-pop 1000ms cubic-bezier(0.2,0.7,0.1,1) both;
}
@keyframes fx-bignum-pop { from { opacity:0; transform:translateY(28px) scale(.92); letter-spacing:-.12em } to { opacity:1; transform:none } }
@media (prefers-reduced-motion: reduce) {
  [data-theme] [data-slide]::after { background: none !important; }
  [data-fx-bg-breathe="1"] [data-slide],
  [data-fx-bignum-pop="1"] [data-slide-anim].slide-visible .num,
  [data-fx-bignum-pop="1"] [data-slide-anim].slide-visible blockquote { animation: none !important; }
  [data-fx-accent-rule="1"] [data-slide] .slide-body::before { animation: none !important; width: 30%; }
}
</style>
```

### FX runtime (optional, opt-in by 4 themes)

A tiny inline `<script>` at the very end of `<body>` activates the FX flags and tracks mouse position. Skip this for non-interactive themes — but you can include it always (the script no-ops if no FX flags are set).

```html
<script>
(function(){
  var FX=['mouse-glow','hover-lift','bg-breathe','accent-rule','bignum-pop','progress'];
  var root=document.querySelector('[data-deck-root]'); if(!root)return;
  var cs=getComputedStyle(root);
  FX.forEach(function(n){ if((cs.getPropertyValue('--fx-'+n)||'').trim()==='1') root.setAttribute('data-fx-'+n,'1'); });
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var raf=0,px=0,py=0;
    root.addEventListener('mousemove',function(e){
      var r=root.getBoundingClientRect();
      px=(e.clientX-r.left)/r.width; py=(e.clientY-r.top)/r.height;
      if(!raf){raf=requestAnimationFrame(function(){
        root.style.setProperty('--mx',Math.max(0,Math.min(1,px)));
        root.style.setProperty('--my',Math.max(0,Math.min(1,py))); raf=0;
      });}
    },{passive:true});
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('slide-visible')})},{root:root,threshold:0.25});
    root.querySelectorAll('[data-slide-anim]').forEach(function(el){io.observe(el)});
  } else { root.querySelectorAll('[data-slide-anim]').forEach(function(el){el.classList.add('slide-visible')}); }
})();
</script>
```

### Aspect ratio note

Set the deck's overall aspect on each section: `<section data-slide aspect="16:9">`. For `4:5` use `--ar: 4/5`, for `9:16` use `--ar: 9/16`, etc. The harness keys off the `aspect` attribute, so simply set it correctly per slide.

If you want the **whole deck** to default to one ratio (most common), set `style="--ar: 4/5"` on the `<section>` (or stamp the same `aspect` attribute on every section).

### Per-slide HTML blueprints

Below, for each slide type, is the **exact** HTML to emit. Replace the placeholders.

#### cover

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-cover">
      <div class="eyebrow">Cover</div>
      <h1 class="display">{TITLE}</h1>
      <!-- omit <p> if no subtitle -->
      <p>{SUBTITLE}</p>
    </div>
    <div class="slide-footer">01 / 08</div>
  </div>
</section>
```

#### bigText

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-bigText">
      <!-- omit eyebrow if not present -->
      <div class="eyebrow">{EYEBROW}</div>
      <h2 class="display">{TEXT}</h2>
    </div>
    <div class="slide-footer">02 / 08</div>
  </div>
</section>
```

#### bigNumber

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-bigNumber">
      <div class="num">{VALUE}</div>
      <!-- omit if no caption -->
      <div class="cap">{CAPTION}</div>
    </div>
    <div class="slide-footer">03 / 08</div>
  </div>
</section>
```

#### quote

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-quote">
      <div class="mark">&ldquo;</div>
      <blockquote class="display">{TEXT}</blockquote>
      <!-- omit if no cite -->
      <div class="cite">— {CITE}</div>
    </div>
    <div class="slide-footer">04 / 08</div>
  </div>
</section>
```

#### list

Add class `dense` when items > 6, `very-dense` when items > 9.

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-list">
      <!-- omit h3 if no heading -->
      <h3>{HEADING}</h3>
      <ul>
        <li><span class="ord">01</span><span>{ITEM 1}</span></li>
        <li><span class="ord">02</span><span>{ITEM 2}</span></li>
        <!-- ... -->
      </ul>
    </div>
    <div class="slide-footer">05 / 08</div>
  </div>
</section>
```

#### section

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-section">
      <h3>{HEADING}</h3>
      <div class="body">{BODY}</div>
    </div>
    <div class="slide-footer">06 / 08</div>
  </div>
</section>
```

#### priceCard

```html
<section data-slide aspect="4:5" style="--ar:4/5">
  <div class="slide-inner">
    <div class="slide-body s-priceCard">
      <!-- omit if no title -->
      <div class="pc-title">{TITLE}</div>
      <div class="pc-row">
        <span class="pc-currency">¥</span>
        <span class="pc-price">{PRICE}</span>
        <!-- omit pc-unit if no unit -->
        <span class="pc-unit">/ {UNIT}</span>
      </div>
      <!-- omit if no originalPrice -->
      <div class="pc-orig">原价 ¥{ORIGINAL_PRICE}</div>
      <!-- omit if no tagline -->
      <div class="pc-tag">{TAGLINE}</div>
    </div>
    <div class="slide-footer">07 / 08</div>
  </div>
</section>
```

#### contact

For each channel, set `{ICON}` to one of 📞 💬 📍 🌐 📧 and `{LABEL}` to one of 电话 微信 地址 网址 邮箱.

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-contact">
      <h3>{HEADING}</h3>
      <ul>
        <li>
          <span class="icon">📞</span>
          <span class="label">电话</span>
          <span class="value">138-0013-8000</span>
        </li>
        <li>
          <span class="icon">💬</span>
          <span class="label">微信</span>
          <span class="value">example-account</span>
        </li>
        <!-- ... -->
      </ul>
    </div>
    <div class="slide-footer">08 / 08</div>
  </div>
</section>
```

#### qrCode

```html
<section data-slide aspect="4:5" style="--ar:4/5">
  <div class="slide-inner">
    <div class="slide-body s-qrCode">
      <!-- omit if no label -->
      <div class="qr-label">{LABEL}</div>
      <div class="qr-box">
        <!-- If you have an image, use <img src="{SRC}" alt=""> instead of the placeholder -->
        <div class="placeholder">
          <div class="grid">⊞</div>
          <div>放置二维码</div>
        </div>
      </div>
      <div class="qr-caption">{CAPTION}</div>
    </div>
    <div class="slide-footer">07 / 08</div>
  </div>
</section>
```

#### posterHero

```html
<section data-slide aspect="9:16" style="--ar:9/16">
  <div class="slide-inner">
    <div class="slide-body s-posterHero">
      <!-- omit if no countdown -->
      <div class="countdown">{COUNTDOWN}</div>
      <!-- omit if no eyebrow -->
      <div class="eyebrow">{EYEBROW}</div>
      <h2>{TITLE}</h2>
      <!-- omit if no subtitle -->
      <div class="subtitle">{SUBTITLE}</div>
      <!-- omit if no cta -->
      <div class="cta">{CTA}</div>
    </div>
    <div class="slide-footer">08 / 08</div>
  </div>
</section>
```

#### image

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-image">
      <img src="{SRC}" alt="{ALT}">
      <!-- omit if no caption -->
      <div class="caption">{CAPTION}</div>
    </div>
    <div class="slide-footer">07 / 08</div>
  </div>
</section>
```

#### iconRow

For 3 items use `--icon-cols:3`; for 4+ items use `--icon-cols:4`. `{ICON_SVG}` is the raw SVG markup for the chosen Lucide icon (looked up by name from the catalog above).

```html
<section data-slide aspect="16:9">
  <div class="slide-inner">
    <div class="slide-body s-iconRow" style="--icon-cols:3">
      <h3>{HEADING}</h3>
      <ul>
        <li>
          <span class="icon-tile">{ICON_SVG}</span>
          <span class="label">{LABEL 1}</span>
        </li>
        <!-- repeat for each item -->
      </ul>
    </div>
    <div class="slide-footer">05 / 08</div>
  </div>
</section>
```

### Putting it all together

The final file you write looks like this skeleton:

```html
<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{USER_TITLE}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    /* PASTE THE FULL CONTENTS OF src/themes/<id>/theme.css HERE */
  </style>
  <style>
    /* PASTE THE FULL "Render harness CSS" FROM ABOVE HERE (without the surrounding <style> tag) */
  </style>
  <style>
    /* OPTIONAL: paste the "Interactive FX layer" stylesheet here.
       Skip for cost-sensitive output; the 4 FX themes still look fine without it. */
  </style>
</head>
<body data-theme="{TEMPLATE_ID}">
  <div data-deck-root data-theme="{TEMPLATE_ID}">
    <!-- one <section data-slide aspect="..."> per slide -->
  </div>
  <!-- OPTIONAL: paste the "FX runtime" script here. Required for cursor-follow halo + slide-visible entry animations. -->
</body>
</html>
```

The footer numbering is `NN / TT` where `TT` is total slides — update it on every slide.

---

## Quality Checklist

Before declaring done, verify:

- [ ] Every slide chunk in your Markdown matches exactly one DSL rule (cover / bigText / bigNumber / quote / list / priceCard / contact / qrCode / posterHero / section).
- [ ] The final HTML has the theme.css inlined and the render harness CSS inlined.
- [ ] `<body data-theme="<id>">` matches the chosen template id.
- [ ] Every `<section data-slide>` carries the right `aspect="..."` attribute.
- [ ] Footer counter `NN / TT` is correct on every slide.
- [ ] The number on a `bigNumber` slide fits the regex (digits + optional `% × K M B` suffix). If it doesn't, the slide will be miscategorized as a quote.
- [ ] Strikethrough lines on price cards use `~~ ... ~~` (Markdown), not HTML `<s>`.
- [ ] Contact lines use one of the recognized emoji prefixes or label words.
- [ ] No Tailwind classes leaked into the output. Use only the harness classes (`.s-cover`, `.s-list`, etc.) plus the helpers (`.display`, `.eyebrow`).
- [ ] The file is fully self-contained except for the Google Fonts `<link>` (which gracefully degrades to system fonts if offline).
- [ ] Chinese template names are preserved as-is in commentary to the user (don't translate "政务汇报红" away).
- [ ] One deck = one theme. Do not mix themes.
- [ ] If you used `@ratio`, it sits on the very first line (before any `# Cover`).
- [ ] All `:icon-name:` tokens reference one of the 50 supported names; otherwise the token is left literal.
- [ ] Image URLs are reachable hosted URLs, not data URIs (unless the user explicitly handed you one).
- [ ] For FX themes (keynote-dark / data-dashboard / xhs-pastel / swiss-paper), you included the FX layer CSS and runtime script.

---

## Common Mistakes to Avoid

- ❌ **Don't run `pnpm dev`** — agents render statically. Starting a server is a sign you're heading the wrong way.
- ❌ **Don't invent new Markdown syntax** outside the DSL. If the user asks for something the DSL can't express, fall back to `section` slides or ask whether to skip.
- ❌ **Don't auto-translate Chinese template names** — preserve `政务汇报红`, `小红书种草`, etc. The user picked this library because they want Chinese context.
- ❌ **Don't mix multiple themes in one deck** — each output uses exactly one theme.
- ❌ **Don't forget the `data-theme` attribute** on `<body>` — without it, theme.css variables never apply and the deck renders in the bare default.
- ❌ **Don't use HTML entities in number slides** — `>` `&` etc. should be literal Markdown source; if you must escape inside the rendered HTML, escape only `<`, `>`, `&`, `"`, `'`.
- ❌ **Don't include `src/` source files in the output** — the deliverable is one HTML, not a project zip.
- ❌ **Don't generate gigantic data URIs for images** — they bloat the HTML. Use hosted URLs (`https://...`) whenever possible. Data URIs are for the editor's drag-paste UX, not for agent-authored decks.
- ❌ **Don't invent new `:icon:` names** — stick to the 50 listed. Unknown names render as literal text.

---

## Worked Example: Restaurant Anniversary Deck

User brief: "帮我做一份奶茶店 3 周年的 PPT，买一送一，适合发朋友圈"

### Step 1 — Read `index.json`, narrow candidates

- `restaurant-promo` (Tier A, 4:5, restaurant/promo scenarios) — best match
- `xhs-pastel` (Tier B, 3:4) — also possible but more "lifestyle seeding" tone

Pick `restaurant-promo`.

### Step 2 — Read theme + example

- Read `src/themes/restaurant-promo/theme.css`
- Read `src/examples/restaurant-promo.md` to confirm the DSL idioms used by this theme.

### Step 3 — Author the Markdown (DSL)

```markdown
# 3 周年庆
买一送一 · 只此一周

---

## 三年陪伴 谢谢你
> 1095
天 / 卖出 16 万杯奶茶 / 老客 4200 位

---

## 招牌奶茶
¥ 9.9 / 杯
~~原价 19.8~~
全场买一送一 · 仅此 7 天

---

## 三周年限定特惠

- 招牌奶茶 买一送一
- 第二杯半价 全场通用
- 老客凭朋友圈截图再减 3 元
- 工作日下午 2-5 点免单抽奖

---

> 喝奶茶 就是开心
> 三周年 · 还想陪你下一个三年

---

## 联系我们
📞 138-0013-8000
💬 微信: nailai-3rd
📍 朝阳区建国路 88 号 · 万达广场 3F

---

@qr
扫码加店长微信领 5 元券
[奶茶店名] · 3 周年特别企划
```

### Step 4 — Render

Write `output.html`. The skeleton (truncated):

```html
<!doctype html>
<html lang="zh">
<head>
  <meta charset="utf-8">
  <title>奶茶店 3 周年庆</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    [data-theme="restaurant-promo"] {
      --bg: #FFF8E7;
      --bg-grad-from: #FFF8E7;
      --bg-grad-to: #FFEDC2;
      --fg: #2A1810;
      --fg-muted: rgba(42, 24, 16, 0.55);
      --accent: #E63946;
      --accent-2: #FFB400;
      --accent-glow-1: rgba(255, 180, 0, 0.18);
      --accent-glow-2: rgba(230, 57, 70, 0.10);
      --display-font: "PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
      --body-font: "PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
      --display-weight: 900;
      --display-tracking: -0.02em;
      --slide-radius: 0px;
    }
  </style>
  <style>/* ... full render-harness CSS from this AGENTS.md, verbatim ... */</style>
</head>
<body data-theme="restaurant-promo">
  <div data-deck-root data-theme="restaurant-promo">
    <section data-slide aspect="4:5" style="--ar:4/5">
      <div class="slide-inner">
        <div class="slide-body s-cover">
          <div class="eyebrow">Cover</div>
          <h1 class="display">3 周年庆</h1>
          <p>买一送一 · 只此一周</p>
        </div>
        <div class="slide-footer">01 / 07</div>
      </div>
    </section>
    <!-- 6 more slides … -->
  </div>
</body>
</html>
```

### Step 5 — Deliver

Save to the user's path (default `./output.html`) and tell them: "已生成 output.html，双击打开就能看。每屏可以单独截图发朋友圈。"

---

## File Map: What Lives Where

| Path                                           | Purpose                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                    | This manual.                                                                                                                                                  |
| `index.json`                                   | Machine-readable catalog of all 20 templates: id, tier, scenarios, vibe, palette, paths, screenshots.                                                         |
| `README.md`                                    | Human-readable readme. Has visual previews of 6 featured templates. Read this if the user wants to see what the library looks like.                          |
| `src/themes/<id>/theme.css`                    | Per-theme CSS variables. **Paste this verbatim** into the rendered HTML's `<head>`.                                                                          |
| `src/themes/<id>/meta.ts`                      | TS metadata. Not needed for rendering, but holds the color swatch and short description if you want it.                                                       |
| `src/examples/<id>.md`                         | Reference markdown showing how this theme is typically used. Read for vibe, copy-paste idioms.                                                                |
| `src/parser/parseMarkdown.ts`                  | The parser. Only read this if you want to confirm an edge case of the DSL.                                                                                    |
| `src/components/Slide.tsx`                     | The React renderer. The render harness CSS in this file mirrors its visual structure. Read only if you want to verify a layout decision.                      |
| `screenshots/`                                 | PNG previews used by README.md.                                                                                                                                |
| `scripts/generate-screenshots.ts`              | Playwright script used to refresh the README previews. Agents do not need to run this for end-user tasks.                                                      |

---

## Versioning

This manual is at `version: 1.0.0` of `SY-PPT-templates` (matching `index.json`). If you see a newer version in `index.json`, re-read this file — the DSL or render harness may have changed.

---

## TL;DR for Speed

1. `cat index.json` → pick a template by `best_for` + aspect.
2. `cat src/themes/<id>/theme.css` → grab CSS variables.
3. `cat src/examples/<id>.md` → see how the DSL is used.
4. Write the user's content as Markdown using the 10 DSL slide types.
5. Emit `<!doctype html>…</html>` with theme.css + render harness CSS inlined, and one `<section data-slide aspect="...">…</section>` per slide.
6. Save to `./output.html`. Tell the user to double-click.

That's it.
