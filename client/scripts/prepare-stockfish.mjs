import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const clientDirectory = resolve(scriptDirectory, '..')
const stockfishDirectory = resolve(clientDirectory, 'node_modules', 'stockfish')
const packageInfo = JSON.parse(await readFile(resolve(stockfishDirectory, 'package.json'), 'utf8'))
const engineBaseName = `stockfish-${packageInfo.buildVersion}-lite-single`
const sourceDirectory = resolve(stockfishDirectory, 'bin')
const destinationDirectory = resolve(clientDirectory, 'public', 'stockfish')

await mkdir(destinationDirectory, { recursive: true })
await Promise.all([
  copyFile(resolve(sourceDirectory, `${engineBaseName}.js`), resolve(destinationDirectory, `${engineBaseName}.js`)),
  copyFile(resolve(sourceDirectory, `${engineBaseName}.wasm`), resolve(destinationDirectory, `${engineBaseName}.wasm`)),
  copyFile(resolve(stockfishDirectory, 'Copying.txt'), resolve(destinationDirectory, 'COPYING.txt')),
])

console.log(`Prepared Stockfish ${packageInfo.version} for the browser.`)
