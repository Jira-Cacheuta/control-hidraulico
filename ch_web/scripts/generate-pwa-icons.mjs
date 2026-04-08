/**
 * Genera íconos PWA desde `pwa-icon-source.png` (motor / bomba vectorial).
 * Fondo #F7FAFC alineado con `background_color` del manifest.
 * Incluye `favicon.ico` multipágina (16–256) para accesos directos en Windows.
 * Ejecutar: npm run icons:pwa (requiere sharp + to-ico).
 */
import { constants } from 'fs'
import { access, mkdir, writeFile } from 'fs/promises'
import { createRequire } from 'module'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const toIco = require('to-ico')

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const sourcePath = join(__dirname, 'pwa-icon-source.png')

const bg = { r: 247, g: 250, b: 252, alpha: 1 }

async function fileReadable(p) {
  try {
    await access(p, constants.R_OK)
    return true
  } catch {
    return false
  }
}

if (!(await fileReadable(sourcePath))) {
  console.error('Falta el archivo fuente:', sourcePath)
  process.exit(1)
}

await mkdir(publicDir, { recursive: true })

async function renderPngBuffer(size) {
  return sharp(sourcePath)
    .resize(size, size, { fit: 'contain', background: bg, position: 'centre' })
    .flatten({ background: '#F7FAFC' })
    .png()
    .toBuffer()
}

async function emitIcon(size, fileName) {
  const buf = await renderPngBuffer(size)
  await writeFile(join(publicDir, fileName), buf)
  console.log('wrote', fileName)
}

await emitIcon(180, 'apple-touch-icon.png')
await emitIcon(32, 'pwa-32x32.png')
await emitIcon(48, 'pwa-48x48.png')
await emitIcon(192, 'pwa-192x192.png')
await emitIcon(256, 'pwa-256x256.png')
await emitIcon(512, 'pwa-512x512.png')

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const icoBuffers = await Promise.all(icoSizes.map((s) => renderPngBuffer(s)))
const icoFile = join(publicDir, 'favicon.ico')
await writeFile(icoFile, await toIco(icoBuffers))
console.log('wrote favicon.ico')
