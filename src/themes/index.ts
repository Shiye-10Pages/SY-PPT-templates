import type { ThemeMeta } from './types'

// Eager-import every theme's CSS so all variable blocks are present in the bundle.
const cssModules = import.meta.glob('./*/theme.css', { eager: true })
void cssModules

// Eager-import every theme's meta and build registry.
const metaModules = import.meta.glob<{ meta: ThemeMeta }>('./*/meta.ts', { eager: true })

export const THEMES: ThemeMeta[] = Object.values(metaModules)
  .map(m => m.meta)
  .sort((a, b) => {
    const tierOrder = a.tier.localeCompare(b.tier)
    if (tierOrder !== 0) return tierOrder
    return a.name.localeCompare(b.name)
  })

export function getTheme(id: string): ThemeMeta | undefined {
  return THEMES.find(t => t.id === id)
}

export const DEFAULT_THEME_ID = 'keynote-dark'

export type { ThemeMeta, ThemeLocale, ThemeTier, SlideAspect } from './types'
export { TIER_LABEL, ASPECT_TO_CARD_SIZE } from './types'
