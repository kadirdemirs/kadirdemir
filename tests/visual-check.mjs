import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '..', 'dev-log-screens')

const BASE = process.env.BASE_URL || 'http://localhost:5176'

const targets = [
  { name: 'home-desktop', path: '/', viewport: { width: 1440, height: 900 } },
  { name: 'home-process', path: '/', viewport: { width: 1440, height: 900 }, scrollTo: '.hm-process' },
  { name: 'home-milestones', path: '/', viewport: { width: 1440, height: 900 }, scrollTo: '.hm-milestones' },
  { name: 'home-testimonials', path: '/', viewport: { width: 1440, height: 900 }, scrollTo: '.hm-testimonials' },
  { name: 'home-mobile', path: '/', viewport: { width: 390, height: 844 } },
  { name: 'links-desktop', path: '/links', viewport: { width: 1440, height: 900 } },
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
    await page.waitForTimeout(2200)
    if (t.scrollTo) {
      try {
        // Scroll bit by bit to trigger lazy-loaded sections, then jump to target.
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let y = 0
            const step = () => {
              y += 600
              window.scrollTo(0, y)
              if (y < document.body.scrollHeight) setTimeout(step, 80)
              else resolve()
            }
            step()
          })
        })
        await page.waitForTimeout(500)
        await page.$eval(t.scrollTo, (el) => el.scrollIntoView({ block: 'center' }))
        await page.waitForTimeout(900)
      } catch { /* selector missing — ignore */ }
    }
    const file = resolve(outDir, `${t.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    console.log(`✓ ${t.name} → ${file}`)
    await ctx.close()
  }
} finally {
  await browser.close()
}
