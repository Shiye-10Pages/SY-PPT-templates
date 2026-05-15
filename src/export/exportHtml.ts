/**
 * Snapshot the current deck root into a single self-contained HTML file.
 *
 * Export mode differs from editor preview:
 *  - Editor (DeckPreview.tsx): vertical scroll-snap, 100vh sections — good for editing.
 *  - Exported HTML: stacked absolute slides with JS navigation — proper presentation mode.
 *    Features: keyboard ← → + 1-9 jump, touch tapzones, auto-scale letterbox,
 *    idle-hiding chrome, print/PDF support, FX layer passthrough.
 */
export function exportHtml(deckRoot: HTMLElement, opts?: { title?: string }): string {
  const title = opts?.title ?? 'shi-ye-deck'
  const theme = deckRoot.getAttribute('data-theme') ?? 'keynote-dark'
  const aspect = (deckRoot.getAttribute('data-aspect') ?? '16:9') as AspectKey

  const css = collectStyles()
  const clone = deckRoot.cloneNode(true) as HTMLElement

  // Mark the first slide active so it's visible without JS interaction.
  const sections = clone.querySelectorAll<HTMLElement>('section[data-slide]')
  if (sections[0]) {
    sections[0].classList.add('deck-active')
    // Also make the first slide's animated elements visible immediately.
    sections[0].querySelectorAll<HTMLElement>('[data-slide-anim]').forEach(el => {
      el.classList.add('slide-visible')
    })
  }

  const totalSlides = sections.length
  const html = clone.outerHTML

  return `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
<style>${PRESENTATION_CSS}</style>
</head>
<body data-theme="${escapeAttr(theme)}">
${html}
<script>${presentationScript(totalSlides, aspect)}</script>
<noscript>
<style>
  [data-deck-root] { position:static !important; height:auto !important; overflow:visible !important; }
  [data-deck-root] section[data-slide] { position:relative !important; opacity:1 !important; height:100vh; }
</style>
</noscript>
</body>
</html>`
}

type AspectKey = '16:9' | '4:5' | '9:16' | '2.35:1' | '3:4'

const DESIGN_DIMS: Record<AspectKey, [number, number]> = {
  '16:9':   [1920, 1080],
  '4:5':    [1080, 1350],
  '9:16':   [1080, 1920],
  '2.35:1': [1880, 800],
  '3:4':    [1080, 1440],
}

/** CSS injected into every exported HTML, overriding the editor's scroll-snap. */
const PRESENTATION_CSS = `
  html,body{margin:0;padding:0;height:100%;overflow:hidden;background:var(--bg,#0a0a0a);}
  body{font-family:-apple-system,BlinkMacSystemFont,"Inter","PingFang SC","Hiragino Sans GB",system-ui,sans-serif;-webkit-font-smoothing:antialiased;}

  /* Stacked presentation shell */
  [data-deck-root]{position:fixed;inset:0;overflow:hidden;}
  [data-deck-root]>section[data-slide]{
    position:absolute;inset:0;
    opacity:0;pointer-events:none;
    transition:opacity 0.5s cubic-bezier(0.4,0,0.2,1);
  }
  [data-deck-root]>section[data-slide].deck-active{opacity:1;pointer-events:all;}

  /* Auto-scale letterbox wrapper (JS sets transform) */
  .deck-scaler{position:absolute;top:0;left:0;transform-origin:top left;}

  /* Chrome overlay */
  .deck-chrome{
    position:fixed;bottom:1.5rem;right:2rem;z-index:9999;
    display:flex;align-items:center;gap:0.75rem;
    font-family:monospace;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;
    color:rgba(255,255,255,0.35);
    transition:opacity 0.5s ease;
  }
  .deck-chrome.idle{opacity:0;}
  .deck-chrome button{
    background:none;border:1px solid currentColor;color:inherit;
    padding:0.2rem 0.5rem;border-radius:4px;cursor:pointer;font-size:0.65rem;
    letter-spacing:0.08em;text-transform:uppercase;
  }
  .deck-chrome button:hover{color:rgba(255,255,255,0.7);}

  /* Print: linear layout, one slide per page */
  @media print{
    html,body{height:auto;overflow:visible;}
    [data-deck-root]{position:static;overflow:visible;}
    [data-deck-root]>section[data-slide]{
      position:relative;opacity:1 !important;pointer-events:all;
      break-after:page;overflow:hidden;
    }
    [data-deck-root]>section[data-slide][data-slide-anim],[data-deck-root]>section[data-slide] [data-anim]{
      opacity:1 !important;transform:none !important;
    }
    .deck-chrome,.deck-scaler-wrap{display:none !important;}
  }
`

function presentationScript(totalSlides: number, aspect: AspectKey): string {
  const [designW, designH] = DESIGN_DIMS[aspect] ?? [1920, 1080]

  return `(function(){
var TOTAL=${totalSlides}, current=0;
var FX=['mouse-glow','hover-lift','bg-breathe','accent-rule','bignum-pop','progress'];

var root=document.querySelector('[data-deck-root]');
if(!root)return;
var slides=Array.from(root.querySelectorAll('section[data-slide]'));

/* --- FX layer passthrough --- */
var cs=getComputedStyle(root);
FX.forEach(function(n){
  if((cs.getPropertyValue('--fx-'+n)||'').trim()==='1') root.setAttribute('data-fx-'+n,'1');
});

/* --- Auto-scale letterbox --- */
var W=${designW}, H=${designH};
function scale(){
  var s=Math.min(innerWidth/W, innerHeight/H);
  var ox=Math.round((innerWidth-W*s)/2), oy=Math.round((innerHeight-H*s)/2);
  slides.forEach(function(sl){
    sl.style.width=W+'px'; sl.style.height=H+'px';
    sl.style.transform='scale('+s+') translate('+ox/s+'px,'+oy/s+'px)';
    sl.style.transformOrigin='top left';
  });
}
scale(); window.addEventListener('resize',scale,{passive:true});

/* --- Navigation --- */
function goTo(n){
  if(n<0)n=0; if(n>=TOTAL)n=TOTAL-1;
  if(n===current)return;
  var prev=slides[current], next=slides[n];
  prev.classList.remove('deck-active');
  next.classList.add('deck-active');
  next.querySelectorAll('[data-slide-anim]').forEach(function(el){
    el.classList.add('slide-visible');
  });
  current=n;
  updateChrome();
  resetIdle();
}
function next(){ goTo(current+1); }
function prev(){ goTo(current-1); }

/* Keyboard */
document.addEventListener('keydown',function(e){
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key===' '||e.key==='PageDown'){e.preventDefault();next();}
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();prev();}
  else if(e.key==='Home'){e.preventDefault();goTo(0);}
  else if(e.key==='End'){e.preventDefault();goTo(TOTAL-1);}
  else if(e.key==='r'||e.key==='R'){e.preventDefault();goTo(0);}
  else if(/^[1-9]$/.test(e.key)){e.preventDefault();goTo(parseInt(e.key)-1);}
  else if(e.key==='0'){e.preventDefault();goTo(9);}
});

/* Touch tapzones */
if(!matchMedia('(hover:hover)').matches){
  document.addEventListener('click',function(e){
    var x=e.clientX/innerWidth;
    if(x<0.33)prev(); else if(x>0.67)next();
  });
}

/* Mouse glow */
if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
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

/* Chrome overlay */
var chrome=document.createElement('div');
chrome.className='deck-chrome';
var counter=document.createElement('span');
var btnPrev=document.createElement('button'); btnPrev.textContent='←'; btnPrev.onclick=prev;
var btnNext=document.createElement('button'); btnNext.textContent='→'; btnNext.onclick=next;
chrome.append(btnPrev,counter,btnNext);
document.body.appendChild(chrome);

function updateChrome(){
  counter.textContent=String(current+1).padStart(2,'0')+' / '+String(TOTAL).padStart(2,'0');
}
updateChrome();

var idleTimer;
function resetIdle(){
  chrome.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer=setTimeout(function(){ chrome.classList.add('idle'); },1800);
}
document.addEventListener('mousemove',resetIdle,{passive:true});
document.addEventListener('keydown',resetIdle,{passive:true});
resetIdle();

/* Initial slide already marked deck-active + slide-visible in HTML */
})();`
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
