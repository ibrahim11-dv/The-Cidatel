import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright-core'

const baseUrl = process.env.CITADEL_URL || 'http://127.0.0.1:5173'
const defaultEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const executablePath = process.env.CITADEL_BROWSER || (existsSync(defaultEdge) ? defaultEdge : undefined)

if (!executablePath) throw new Error('Set CITADEL_BROWSER to a Chromium browser executable before running this check.')

async function move(page, from, to, touch = false) {
  const action = touch ? 'tap' : 'click'
  await page.locator(`[data-square="${from}"]`)[action]()
  await page.locator(`[data-square="${to}"]`)[action]()
}

async function keyboardMove(page, from, to) {
  await page.locator(`[data-square="${from}"]`).focus()
  await page.keyboard.press('Enter')
  await page.locator(`[data-square="${to}"]`).focus()
  await page.keyboard.press('Space')
}

async function noHorizontalOverflow(page, label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${label} must not scroll horizontally`)
}

async function waitForValue(read, ready, description) {
  const deadline = Date.now() + 20_000
  let value
  do {
    value = await read()
    if (ready(value)) return value
    await new Promise((resolve) => setTimeout(resolve, 100))
  } while (Date.now() < deadline)
  assert.fail(`${description}; last value was ${JSON.stringify(value)}`)
}

const browser = await chromium.launch({ executablePath, headless: true })
const errors = []
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 960 } })
  const page = await desktop.newPage()
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(`${baseUrl}/play/local`, { waitUntil: 'domcontentloaded' })
  const mainNavigation = page.getByRole('navigation', { name: 'Main navigation' })
  await mainNavigation.getByRole('link', { name: 'Local' }).waitFor()
  await mainNavigation.getByRole('link', { name: 'Bots' }).waitFor()
  await mainNavigation.getByRole('link', { name: 'Online' }).waitFor()
  assert.equal(await mainNavigation.getByRole('link', { name: 'Play' }).count(), 0, 'play modes are direct primary navigation links')
  assert.equal(await page.locator('.table-navigation').count(), 0, 'the page-level play-mode navigation is removed')
  assert.equal(await page.locator('.chess-board [data-square][tabindex="0"]').count(), 1, 'a board has one Tab stop')
  await page.locator('[data-square="e2"]').focus()
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.square), 'f2', 'right arrow moves focus one visual square')
  assert.equal(await page.locator('.chess-board [data-square][tabindex="0"]').count(), 1, 'directional focus keeps one board Tab stop')
  await page.keyboard.press('ArrowUp')
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.square), 'f3', 'up arrow moves focus one visual square')
  await keyboardMove(page, 'e2', 'e4')
  await move(page, 'e7', 'e5')
  await page.getByRole('button', { name: 'e4' }).waitFor()
  await page.getByRole('button', { name: 'e5' }).waitFor()
  await waitForValue(
    () => page.evaluate(() => JSON.parse(localStorage.getItem('citadel:local-game') || 'null')?.moves?.length),
    (count) => count === 2,
    'local game must be saved before refreshing',
  )
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('[aria-label="White pawn on e4"]').waitFor()
  await page.locator('[aria-label="Black pawn on e5"]').waitFor()
  await noHorizontalOverflow(page, 'desktop local table')
  await page.getByRole('button', { name: 'Resign' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Resign' }).click()
  await page.getByRole('link', { name: 'Return to play menu' }).click()
  await page.waitForURL(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.goto(`${baseUrl}/play/local`, { waitUntil: 'domcontentloaded' })
  await page.locator('.position-tools summary').click()
  await page.getByLabel('Import FEN or PGN').fill('7k/P7/8/8/8/8/8/7K w - - 0 1')
  await page.getByRole('button', { name: 'Load position / game' }).click()
  await page.locator('[aria-label="White pawn on a7"]').waitFor()
  await move(page, 'a7', 'a8')
  await page.getByRole('dialog', { name: 'Choose a piece for promotion' }).getByRole('button', { name: 'Promote to queen' }).click()
  await page.locator('[aria-label="White queen on a8"]').waitFor()

  await page.goto(`${baseUrl}/puzzles`, { waitUntil: 'domcontentloaded' })
  const whiteHome = await page.locator('[data-square="a1"]').boundingBox()
  const blackHome = await page.locator('[data-square="a8"]').boundingBox()
  assert.ok(whiteHome.y > blackHome.y, 'White-to-play puzzle starts with White at the player side')
  await page.getByRole('button', { name: 'Flip board' }).click()
  await waitForValue(
    async () => (await page.locator('[data-square="a1"]').boundingBox()).y < (await page.locator('[data-square="a8"]').boundingBox()).y,
    Boolean,
    'puzzle board must flip when requested',
  )
  await page.getByRole('button', { name: 'Flip board' }).click()
  await move(page, 'f6', 'g7')
  await page.getByText('Well found. This study is now marked in your scorebook.').waitFor()
  await page.getByRole('button', { name: /Légal's finish/ }).click()
  await move(page, 'c3', 'd5')
  await page.getByText('Not the intended move. Try another candidate.').waitFor()
  await page.getByRole('button', { name: 'Retry puzzle' }).click()
  await page.locator('[aria-label="White bishop on c4"]').waitFor()
  await move(page, 'c4', 'e5')
  await page.locator('[aria-label="Black bishop on d1"]').waitFor()
  await move(page, 'c4', 'f7')
  await page.locator('[aria-label="Black king on e7"]').waitFor()
  await move(page, 'e5', 'd5')
  await page.getByText('Well found. This study is now marked in your scorebook.').waitFor()
  await noHorizontalOverflow(page, 'desktop puzzle study')

  await page.goto(`${baseUrl}/play/bot`, { waitUntil: 'domcontentloaded' })
  await move(page, 'e2', 'e4')
  await waitForValue(
    () => page.locator('.move-ledger li').first().locator('button').nth(1).textContent(),
    (move) => move && move.trim() !== '…',
    'Stockfish must return a visible reply after the human opening move',
  )
  await page.getByRole('button', { name: 'Take back' }).click()
  await page.getByText('The score sheet will record each move.').waitFor()
  assert.equal(await page.locator('.bot-levels [role="radio"]').count(), 6)
  await page.getByRole('radio', { name: /Master/ }).click()
  await page.locator('.bot-levels [role="radio"][aria-checked="true"]', { hasText: 'Master' }).waitFor()
  await page.getByLabel('Your pieces').selectOption('b')
  await waitForValue(
    () => page.locator('.move-ledger li').first().locator('button').nth(0).textContent(),
    (move) => move && move.trim() !== '…',
    'Stockfish must make the opening move when the player chooses Black',
  )
  const blackPawn = await page.locator('[data-square="c7"]').boundingBox()
  const whitePawn = await page.locator('[data-square="c2"]').boundingBox()
  assert.ok(blackPawn.y > whitePawn.y, 'choosing Black places Black at the player side of the board')
  await page.locator('[data-square="c7"]').focus()
  await page.keyboard.press('ArrowUp')
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.square), 'c6', 'arrow navigation follows the flipped board orientation')
  await move(page, 'c7', 'c5')
  await page.locator('[aria-label="Black pawn on c5"]').waitFor()

  await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' })
  assert.equal(await page.locator('input[type="color"]').count(), 0, 'appearance no longer exposes raw color inputs')
  await page.getByRole('button', { name: 'Forest Chess' }).click()
  await page.locator('html[data-theme="forest"]').waitFor()
  await page.locator('.board-choice-forest').click()
  await page.locator('.appearance-preview .board-wrap.board-theme-forest').waitFor()
  await page.getByRole('button', { name: /Modern.*Crisp club set/ }).click()
  await page.locator('.appearance-preview .piece-style-modern').waitFor()
  await page.getByRole('button', { name: 'Midnight slate background' }).click()
  await page.locator('html[data-background="midnight-slate"]').waitFor()
  const backgroundUpload = page.getByLabel('Upload background image')
  await backgroundUpload.setInputFiles({ name: 'not-a-background.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg />') })
  await page.getByText('Choose a PNG, JPEG, or WebP image.').waitFor()
  await backgroundUpload.setInputFiles({
    name: 'club-background.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9J6D0AAAAASUVORK5CYII=', 'base64'),
  })
  await page.locator('html[data-background="upload"]').waitFor()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('html[data-theme="forest"]').waitFor()
  await page.locator('html[data-background="upload"]').waitFor()
  await page.getByRole('button', { name: 'Use uploaded background' }).waitFor()
  await page.locator('.appearance-preview .board-wrap.board-theme-forest.piece-style-modern').waitFor()
  await page.getByRole('button', { name: 'Reset background' }).click()
  await page.locator('html[data-background="parchment"]').waitFor()
  assert.equal(await page.getByRole('button', { name: 'Use uploaded background' }).count(), 0, 'reset removes the browser-local uploaded image')
  await noHorizontalOverflow(page, 'desktop appearance studio')
  await page.getByLabel('Local board orientation').selectOption('black')
  await waitForValue(
    () => page.evaluate(() => JSON.parse(localStorage.getItem('citadel:board-options') || '{}').orientation),
    (orientation) => orientation === 'black',
    'local board orientation must be saved before refreshing',
  )
  await page.reload({ waitUntil: 'domcontentloaded' })
  assert.equal(await page.getByLabel('Local board orientation').inputValue(), 'black', 'saved local board orientation is restored in settings')
  await page.goto(`${baseUrl}/play/local`, { waitUntil: 'domcontentloaded' })
  const blackHomePawn = await page.locator('[data-square="c7"]').boundingBox()
  const whiteHomePawn = await page.locator('[data-square="c2"]').boundingBox()
  assert.ok(blackHomePawn.y > whiteHomePawn.y, 'saved Black orientation places Black at the player side of a new local table')
  await page.goto(`${baseUrl}/online`, { waitUntil: 'domcontentloaded' })
  await Promise.all([
    page.waitForURL(/\/login\?next=%2Fonline$/, { waitUntil: 'commit', timeout: 5_000 }),
    page.getByRole('link', { name: 'Sign in' }).click(),
  ])
  await desktop.close()

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobilePage = await mobile.newPage()
  mobilePage.on('pageerror', (error) => errors.push(error.message))
  await mobilePage.goto(`${baseUrl}/play/local`, { waitUntil: 'domcontentloaded' })
  await mobilePage.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Online' }).waitFor()
  await move(mobilePage, 'e2', 'e4', true)
  await mobilePage.locator('[aria-label="White pawn on e4"]').waitFor()
  await noHorizontalOverflow(mobilePage, 'touch-sized local table')
  assert.ok((await mobilePage.locator('.chess-board').boundingBox()).width <= 354, 'mobile board stays within the padded viewport')
  await mobile.close()

  const reduced = await browser.newContext({ viewport: { width: 1024, height: 768 } })
  await reduced.addInitScript(() => {
    window.__citadelBoardAnimations = 0
    const animate = Element.prototype.animate
    Element.prototype.animate = function (...args) {
      window.__citadelBoardAnimations += 1
      return animate.apply(this, args)
    }
  })
  const reducedPage = await reduced.newPage()
  reducedPage.on('pageerror', (error) => errors.push(error.message))
  await reducedPage.emulateMedia({ reducedMotion: 'reduce' })
  await reducedPage.goto(`${baseUrl}/play/local`, { waitUntil: 'domcontentloaded' })
  await move(reducedPage, 'e2', 'e4')
  await reducedPage.locator('[aria-label="White pawn on e4"]').waitFor()
  assert.equal(await reducedPage.evaluate(() => window.__citadelBoardAnimations), 0, 'reduced-motion preference prevents board Web Animations')
  await reduced.close()

  assert.deepEqual(errors, [], 'the tested UI routes must not raise browser errors')
  console.log('Passed real Edge UI flow: direct play navigation, curated palette/background/board/piece settings with uploaded-background persistence, roving keyboard focus and local moves, completed-game navigation, rendered promotion choice, puzzle completion, Stockfish play, account sign-in return, touch-sized layout, and reduced-motion board moves.')
} finally {
  await browser.close()
}
