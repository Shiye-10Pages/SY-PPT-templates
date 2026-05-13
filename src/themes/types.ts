export type ThemeLocale = 'cn' | 'global'
export type ThemeTier = 'A' | 'B' | 'C' | 'D'
export type SlideAspect = '16:9' | '4:5' | '9:16' | '2.35:1' | '3:4'

export type ThemeMeta = {
  id: string
  name: string                  // 中文名 (e.g. "政务汇报红")
  scene: string                 // '党建 / 政府汇报' 等使用场景
  locale: ThemeLocale
  tier: ThemeTier
  description: string
  swatch: [string, string, string, string]
  exampleFile: string           // matches key in examples registry
  defaultAspect: SlideAspect
}

export const TIER_LABEL: Record<ThemeTier, string> = {
  A: '中国 B 端实用',
  B: '中国 C 端内容',
  C: '通用专业',
  D: '国际化经典',
}

export const ASPECT_TO_CARD_SIZE: Record<SlideAspect, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
  '2.35:1': { w: 1880, h: 800 },
  '3:4': { w: 1080, h: 1440 },
}
