/**
 * Genera favicon.ico desde public/favicon.svg (formas simples, legible a 16px).
 * Los PNG grandes de PWA siguen saliendo de icons:pwa + pwa-icon-source.png.
 */
import { createRequire } from 'module'
import { readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const toIco = require('to-ico')

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svgPath = join(publicDir, 'favicon.svg')

const svg = await readFile(svgPath)
const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoBuffers = await Promise.all(
  icoSizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
)
await writeFile(join(publicDir, 'favicon.ico'), await toIco(icoBuffers))
console.log('wrote favicon.ico from favicon.svg')
