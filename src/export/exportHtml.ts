/**
 * Snapshot the current deck root into a single self-contained HTML file.
 * Strategy: inline all readable same-origin stylesheets, freeze final animation state,
 * and wrap in a minimal document with a CSS-only scroll snap layout.
 */
export function exportHtml(deckRoot: HTMLElement, opts?: { title?: string }): string {
  const title = opts?.title ?? 'shi-ye-deck'
  const theme = deckRoot.getAttribute('data-theme') ?? 'keynote-dark'

  const css = collectStyles()
  const clone = deckRoot.cloneNode(true) as HTMLElement
  // Make every animated chunk visible in the exported file.
  clone.querySelectorAll<HTMLElement>('[data-slide-anim]').forEach(el => {
    el.style.opacity = '1'
    el.style.transform = 'none'
    el.style.transition = ''
  })
  // Remove preview-only data attrs that don't matter, but keep data-theme.
  const html = clone.outerHTML

  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
<style>
  html, body { margin: 0; height: 100%; background: var(--bg, #0a0a0a); }
  [data-deck-root] { height: 100vh; overflow-y: auto; scroll-snap-type: y mandatory; scroll-behavior: smooth; }
  [data-deck-root] > section { scroll-snap-align: start; height: 100vh; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", "PingFang SC", "Hiragino Sans GB", system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
</style>
</head>
<body data-theme="${escapeAttr(theme)}">
${html}
<script>${exportedDeckScript()}</script>
</body>
</html>`
}

/**
 * Tiny self-contained runtime injected into every exported HTML. Mirrors the
 * effects that DeckPreview.tsx runs in the editor:
 *  - Promote each theme's `--fx-foo: 1` CSS var to a matching `data-fx-foo`
 *    attribute on the deck root so fx.css selectors light up.
 *  - Track mouse position into `--mx`/`--my` for the cursor-glow effect.
 *  - Run the IntersectionObserver that adds `.slide-visible` for entry anims.
 * Total weight ≈ 1.2 KB unminified.
 */
function exportedDeckScript(): string {
  return `
(function(){
  var FX=['mouse-glow','hover-lift','bg-breathe','accent-rule','bignum-pop','progress'];
  var root=document.querySelector('[data-deck-root]');
  if(!root)return;
  var cs=getComputedStyle(root);
  FX.forEach(function(name){
    if((cs.getPropertyValue('--fx-'+name)||'').trim()==='1') root.setAttribute('data-fx-'+name,'1');
  });
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var raf=0,px=0,py=0;
    root.addEventListener('mousemove',function(e){
      var r=root.getBoundingClientRect();
      px=(e.clientX-r.left)/r.width; py=(e.clientY-r.top)/r.height;
      if(!raf){raf=requestAnimationFrame(function(){
        root.style.setProperty('--mx',Math.max(0,Math.min(1,px)));
        root.style.setProperty('--my',Math.max(0,Math.min(1,py)));
        raf=0;
      });}
    },{passive:true});
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('slide-visible'); });
    },{root:root,threshold:0.25});
    root.querySelectorAll('[data-slide-anim]').forEach(function(el){ io.observe(el); });
  } else {
    root.querySelectorAll('[data-slide-anim]').forEach(function(el){ el.classList.add('slide-visible'); });
  }
})();
`.trim()
}

function collectStyles(): string {
  const chunks: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules
      if (!rules) continue
      for (const rule of Array.from(rules)) {
        chunks.push(rule.cssText)
      }
    } catch {
      // Skip cross-origin sheets we can't read.
    }
  }
  return chunks.join('\n')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  )
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;')
}
