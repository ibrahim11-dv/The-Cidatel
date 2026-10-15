import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const baseUrl = process.env.CITADEL_URL || 'http://127.0.0.1:5173'
const defaultEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const executablePath = process.env.CITADEL_BROWSER || (existsSync(defaultEdge) ? defaultEdge : undefined)

if (!executablePath) {
  throw new Error('Set CITADEL_BROWSER to a Chromium browser executable before running this check.')
}

async function visible(locator, description) {
  await locator.waitFor({ state: 'visible', timeout: 20_000 })
  return locator
}

async function register(page, suffix) {
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const username = `browser_${stamp}`
  const next = encodeURIComponent(suffix)
  await page.goto(`${baseUrl}/register?next=${next}`, { waitUntil: 'domcontentloaded' })
  await page.locator('#username').fill(username)
  await page.locator('#email').fill(`${username}@example.test`)
  await page.locator('#password').fill('BrowserCheck9')
  await page.locator('#confirm-password').fill('BrowserCheck9')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/online(?:\?|$)/, { timeout: 20_000 })
  return username
}

async function move(page, from, to) {
  await page.locator(`[data-square="${from}"]`).click()
  await page.locator(`[data-square="${to}"]`).click()
}

const browser = await chromium.launch({ executablePath, headless: true })
let host
let guest
const pageErrors = []
try {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()
  await hostContext.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl })
  host = await hostContext.newPage()
  guest = await guestContext.newPage()
  host.on('pageerror', (error) => pageErrors.push(`host: ${error.message}`))
  guest.on('pageerror', (error) => pageErrors.push(`guest: ${error.message}`))
  host.on('console', (message) => { if (message.type() === 'error') pageErrors.push(`host console: ${message.text()}`) })
  guest.on('console', (message) => { if (message.type() === 'error') pageErrors.push(`guest console: ${message.text()}`) })

  await register(host, '/online')
  await host.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' })
  await host.getByLabel('Board coordinates').uncheck()
  await visible(host.getByText('Board preferences saved to your account.'), 'saved account board preference')
  await host.getByRole('button', { name: 'Forest Chess' }).click()
  await visible(host.getByText('Site palette saved to your account.'), 'saved account theme')
  await host.locator('.board-choice-forest').click()
  await visible(host.getByText('Board appearance saved to your account.'), 'saved account board palette')
  await host.getByRole('button', { name: /Modern.*Crisp club set/ }).click()
  await visible(host.getByText('Board appearance saved to your account.'), 'saved account piece style')
  assert.equal(await host.locator('input[type="color"]').count(), 0, 'account appearance does not expose raw colors')
  await host.reload({ waitUntil: 'domcontentloaded' })
  assert.equal(await host.getByLabel('Board coordinates').isChecked(), false, 'account board preference must restore after refresh')
  await host.locator('html[data-theme="forest"]').waitFor()
  await host.locator('.appearance-preview .board-wrap.board-theme-forest.piece-style-modern').waitFor()
  await host.goto(`${baseUrl}/online`, { waitUntil: 'domcontentloaded' })
  await visible(host.getByRole('button', { name: 'Create invitation' }), 'host online controls')
  await host.getByRole('button', { name: 'Create invitation' }).click()
  const invitation = await visible(host.getByLabel('Invitation link'), 'shared invitation link')
  await host.getByRole('button', { name: 'Copy invitation link' }).click()
  await visible(host.getByText('Invitation link copied.'), 'copied invitation confirmation')
  assert.equal(await host.evaluate(() => navigator.clipboard.readText()), await invitation.inputValue(), 'copied invitation must match the visible link')
  const code = new URL(await invitation.inputValue()).searchParams.get('invite')
  assert.ok(code, 'private invitation must include a join code')

  await register(guest, `/online?invite=${encodeURIComponent(code)}`)
  await visible(guest.locator('.online-game-layout'), 'guest automatic invitation join')
  await visible(host.locator('.online-game-layout'), 'host synchronized game table')

  await move(host, 'e2', 'e4')
  await visible(guest.locator('[aria-label="White pawn on e4"]'), 'guest synchronized white move')
  await host.reload({ waitUntil: 'domcontentloaded' })
  await visible(host.locator('[aria-label="White pawn on e4"]'), 'host restored game after browser refresh')

  await move(guest, 'e7', 'e5')
  await visible(host.locator('[aria-label="Black pawn on e5"]'), 'host synchronized black move')
  assert.match(await host.locator('.chess-clock').first().innerText(), /^\d+:\d{2}$/, 'host sees an authoritative clock')
  assert.match(await guest.locator('.chess-clock').first().innerText(), /^\d+:\d{2}$/, 'guest sees an authoritative clock')

  await guest.getByRole('button', { name: 'Resign' }).click()
  await visible(guest.getByRole('dialog'), 'resignation confirmation')
  await guest.getByRole('dialog').getByRole('button', { name: 'Resign' }).click()
  await visible(host.getByRole('heading', { name: /1-0/ }), 'synchronized resignation result')
  await host.getByRole('button', { name: 'Request rematch' }).click()
  await visible(guest.getByRole('button', { name: 'Accept rematch' }), 'guest rematch offer')
  await guest.getByRole('button', { name: 'Accept rematch' }).click()
  await visible(host.getByText('The score sheet will record each move.'), 'host fresh rematch score sheet')
  await visible(guest.getByText('The score sheet will record each move.'), 'guest fresh rematch score sheet')
  await guest.getByRole('button', { name: 'Resign' }).click()
  await guest.getByRole('dialog').getByRole('button', { name: 'Resign' }).click()
  await visible(host.getByRole('heading', { name: /0-1/ }), 'synchronized rematch result')
  await host.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded' })
  await visible(host.getByText('Online game').first(), 'winner scorebook entry')
  await visible(host.getByText('Won · resignation').first(), 'player-relative online result')
  assert.equal(await host.getByText('Online game').count(), 2, 'the scorebook must retain both the original game and its rematch')

  await guest.getByRole('button', { name: 'Return to online room' }).click()
  await host.goto(`${baseUrl}/online`, { waitUntil: 'domcontentloaded' })
  await visible(host.getByRole('button', { name: 'Create invitation' }), 'host draw-agreement controls')
  await host.getByRole('button', { name: 'Create invitation' }).click()
  const drawCode = new URL(await visible(host.getByLabel('Invitation link'), 'draw-test invitation link').then((link) => link.inputValue())).searchParams.get('invite')
  assert.ok(drawCode, 'draw-test invitation must include a join code')
  await guest.goto(`${baseUrl}/online?invite=${encodeURIComponent(drawCode)}`, { waitUntil: 'domcontentloaded' })
  await visible(guest.locator('.online-game-layout'), 'guest draw-test table')
  await visible(host.locator('.online-game-layout'), 'host draw-test table')
  await host.getByRole('button', { name: 'Offer draw' }).click()
  await visible(guest.getByRole('group', { name: 'Opponent draw offer' }), 'guest draw offer')
  await guest.getByRole('button', { name: 'Decline draw' }).click()
  await visible(host.getByRole('button', { name: 'Offer draw' }), 'host draw offer after decline')
  await guest.getByRole('button', { name: 'Offer draw' }).click()
  await visible(host.getByRole('group', { name: 'Opponent draw offer' }), 'host draw acceptance controls')
  await host.getByRole('button', { name: 'Accept draw' }).click()
  await visible(host.getByRole('heading', { name: /1\/2-1\/2/ }), 'host accepted draw result')
  await visible(guest.getByRole('heading', { name: /1\/2-1\/2/ }), 'guest accepted draw result')

  await guest.getByRole('button', { name: 'Return to online room' }).click()
  await visible(guest.getByRole('button', { name: 'Find an opponent' }), 'guest matchmaking controls')
  await host.getByRole('button', { name: 'Return to online room' }).click()
  await visible(host.getByRole('button', { name: 'Find an opponent' }), 'host matchmaking controls')
  await host.getByRole('button', { name: 'Find an opponent' }).click()
  await visible(host.getByRole('button', { name: 'Cancel matchmaking' }), 'host waiting room')
  await host.getByRole('button', { name: 'Cancel matchmaking' }).click()
  await visible(host.getByRole('button', { name: 'Find an opponent' }), 'host lobby after cancelling matchmaking')
  await host.getByRole('button', { name: 'Find an opponent' }).click()
  await visible(host.getByRole('button', { name: 'Cancel matchmaking' }), 'host renewed matchmaking search')
  await guest.getByRole('button', { name: 'Find an opponent' }).click()
  await visible(host.locator('.online-game-layout'), 'host matchmaking table')
  await visible(guest.locator('.online-game-layout'), 'guest matchmaking table')
  await host.getByRole('button', { name: 'Resign' }).click()
  await host.getByRole('dialog').getByRole('button', { name: 'Resign' }).click()
  await visible(guest.getByRole('heading', { name: /[01]-[01]/ }), 'synchronized matchmaking result')

  await hostContext.close()
  await guestContext.close()
  console.log('Passed real Edge online flow: account palette, board, piece and board-preference persistence, private invitation join, synchronized moves and clocks, refresh recovery, rematch, player-visible draw agreement, unified scorebook result, and cancellable two-player matchmaking.')
} catch (error) {
  const pageState = async (page) => page ? {
    url: page.url(),
    text: await page.locator('body').innerText().catch(() => ''),
  } : null
  console.error('Online browser state at failure:', await pageState(host), await pageState(guest), pageErrors)
  throw error
} finally {
  await browser.close()
}
