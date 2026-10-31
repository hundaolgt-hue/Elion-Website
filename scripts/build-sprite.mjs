// Build public/icons/sprite.svg from src/icons/registry.tsx (one <symbol> per icon).
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { writeFileSync, mkdirSync } from 'node:fs'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { ICONS } = await server.ssrLoadModule('/src/icons/registry.tsx')
const symbols = Object.entries(ICONS).map(([name, node]) => {
  const inner = renderToStaticMarkup(createElement('g', null, node))
  return `  <symbol id="elyon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`
}).join('\n')
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n<!-- Elyon Aerial Services icon library. Usage: <svg><use href="/icons/sprite.svg#elyon-precision"/></svg>. Classes .fill / .idle-* map to the site's CSS. -->\n${symbols}\n</svg>\n`
mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/sprite.svg', sprite)
console.log(`sprite: ${Object.keys(ICONS).length} icons -> public/icons/sprite.svg`)
await server.close()
