// Vite ?raw import: all .md files in this directory loaded as strings.
const modules = import.meta.glob<string>('./*.md', { eager: true, query: '?raw', import: 'default' })

export const EXAMPLES: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, content]) => {
    const id = path.replace(/^\.\//, '').replace(/\.md$/, '')
    return [id, content]
  }),
)

export function getExample(id: string, fallbackId = 'keynote-dark'): string {
  return EXAMPLES[id] ?? EXAMPLES[fallbackId] ?? ''
}
