export type ContactChannel = {
  kind: 'phone' | 'wechat' | 'address' | 'website' | 'email' | 'other'
  value: string
  label?: string
}

export type SlideAST =
  | { type: 'cover'; title: string; subtitle?: string }
  | { type: 'bigText'; text: string; eyebrow?: string }
  | { type: 'bigNumber'; value: string; caption?: string }
  | { type: 'list'; heading?: string; items: string[] }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'section'; heading: string; body: string }
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
    }
