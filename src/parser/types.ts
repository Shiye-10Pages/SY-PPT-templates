export type ContactChannel = {
  kind: 'phone' | 'wechat' | 'address' | 'website' | 'email' | 'other'
  value: string
  label?: string
}

export type SlideAST =
  | { type: 'cover'; title: string; subtitle?: string; image?: string }
  | { type: 'bigText'; text: string; eyebrow?: string }
  | { type: 'bigNumber'; value: string; caption?: string }
  | { type: 'list'; heading?: string; items: string[] }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'section'; heading: string; body: string; image?: string }
  | {
      type: 'priceCard'
      title?: string
      price: string
      originalPrice?: string
      unit?: string
      tagline?: string
    }
  | { type: 'contact'; heading?: string; channels: ContactChannel[] }
  | { type: 'qrCode'; caption: string; label?: string; src?: string }
  | {
      type: 'posterHero'
      eyebrow?: string
      title: string
      subtitle?: string
      cta?: string
      countdown?: string
      image?: string
    }
  | { type: 'image'; src: string; alt?: string; caption?: string }
  | { type: 'iconRow'; heading?: string; items: { icon: string; label: string }[] }
  | { type: 'chapter'; heading: string; sub?: string; number?: string }
  | {
      type: 'split'
      left: { heading?: string; body: string; image?: string }
      right: { heading?: string; body: string; image?: string }
      reversed?: boolean
    }
  | { type: 'stats'; heading?: string; items: { value: string; label: string; note?: string }[] }
  | { type: 'compare'; heading?: string; a: { label: string; items: string[] }; b: { label: string; items: string[] } }
  | { type: 'chart'; heading?: string; items: { label: string; value: number; displayValue: string }[] }
  | { type: 'toc'; heading?: string; items: { title: string; sub?: string; num?: string }[] }
  | { type: 'flow'; heading?: string; steps: { label: string; desc?: string }[]; direction?: 'horizontal' | 'vertical' }
  | { type: 'timeline'; heading?: string; events: { date: string; title: string; desc?: string }[] }
  | {
      type: 'matrix'
      heading?: string
      cols: string[]
      rows: { label: string; values: ('yes' | 'no' | 'partial' | string)[] }[]
    }
  | { type: 'features'; heading?: string; items: { icon: string; title: string; sub?: string; desc?: string }[] }
