import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'dev-log-screens')

const BASE = process.env.BASE_URL || 'http://localhost:5175'

const targets = [
  { name: 'home-desktop', path: '/', viewport: { width: 1440, height: 900 } },
  { name: 'home-mobile', path: '/', viewport: { width: 390, height: 844 } },
  { name: 'admin-login', path: '/admin', viewport: { width: 1440, height: 900 } },
]

const browser = await chromium.launch()
try {
  await import('node:fs/promises').then((fs) => fs.mkdir(outDir, { recursive: true }))
  for (const t of targets) {
    const ctx = await browser.newContext({
      viewport: t.viewport,
      deviceScaleFactor: 1,
      colorScheme: 'dark',
    })
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('theme', 'dark')
        localStorage.setItem('kade_cookie_consent_v1', JSON.stringify({ value: 'accept', ts: Date.now() }))
      } catch {}
    })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.error(`[pageerror ${t.name}]`, e.message))
    await page.goto(BASE + t.path, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1500)
    const file = resolve(outDir, `${t.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    console.log(`✓ ${t.name} → ${file}`)
    await ctx.close()
  }
} finally {
  await browser.close()
}
