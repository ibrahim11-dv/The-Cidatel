const PREFERENCE_KEY = 'citadel:background'
const DATABASE_NAME = 'citadel-appearance'
const STORE_NAME = 'backgrounds'
const UPLOAD_KEY = 'uploaded-background'
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_BACKGROUND_BYTES = 5 * 1024 * 1024

export const BACKGROUND_PRESETS = [
  {
    id: 'parchment',
    name: 'Parchment',
    image: 'radial-gradient(circle at 18% 12%, rgba(232, 211, 166, .34), transparent 35%), repeating-linear-gradient(115deg, rgba(255,255,255,.04) 0 1px, transparent 1px 7px), linear-gradient(135deg, #34281d, #16120f 72%)',
  },
  {
    id: 'walnut-grain',
    name: 'Walnut grain',
    image: 'repeating-linear-gradient(101deg, rgba(236, 188, 120, .09) 0 2px, transparent 2px 16px), radial-gradient(ellipse at 72% 18%, rgba(144, 82, 44, .4), transparent 44%), linear-gradient(135deg, #382018, #150d0a 76%)',
  },
  {
    id: 'forest-felt',
    name: 'Forest felt',
    image: 'radial-gradient(circle at 26% 22%, rgba(148, 171, 111, .24), transparent 34%), repeating-radial-gradient(circle at 0 0, rgba(255,255,255,.035) 0 1px, transparent 1px 8px), linear-gradient(135deg, #1b3528, #0c1d16 74%)',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight slate',
    image: 'linear-gradient(115deg, transparent 0 46%, rgba(181, 201, 219, .09) 46.2% 46.5%, transparent 46.7% 100%), radial-gradient(circle at 70% 18%, rgba(95, 127, 163, .28), transparent 35%), linear-gradient(135deg, #202a3a, #0d1119 76%)',
  },
]

const defaultChoice = { kind: 'preset', id: 'parchment' }

function isPreset(id) {
  return BACKGROUND_PRESETS.some((preset) => preset.id === id)
}

export function readBackgroundChoice() {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCE_KEY) || 'null')
    if (value?.kind === 'upload') return { kind: 'upload' }
    if (value?.kind === 'preset' && isPreset(value.id)) return value
  } catch {
    // Use the calm default when local storage is unavailable or malformed.
  }
  return defaultChoice
}

function saveChoice(choice) {
  localStorage.setItem(PREFERENCE_KEY, JSON.stringify(choice))
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Browser storage is unavailable for uploaded backgrounds.'))
      return
    }
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Browser storage is unavailable for uploaded backgrounds.'))
  })
}

async function readUpload() {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(UPLOAD_KEY)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new Error('The uploaded background could not be read.'))
    })
  } finally {
    database.close()
  }
}

async function writeUpload(value) {
  const database = await openDatabase()
  try {
    await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, UPLOAD_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('The uploaded background could not be saved.'))
    })
  } finally {
    database.close()
  }
}

async function deleteUpload() {
  const database = await openDatabase()
  try {
    await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(UPLOAD_KEY)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('The uploaded background could not be removed.'))
    })
  } finally {
    database.close()
  }
}

function uploadedImage(url) {
  return `url("${url}")`
}

export function applyBackground(choice, uploadUrl = null) {
  const root = document.documentElement
  const preset = choice.kind === 'preset' ? BACKGROUND_PRESETS.find((item) => item.id === choice.id) : null
  root.dataset.background = preset ? preset.id : uploadUrl ? 'upload' : defaultChoice.id
  root.style.setProperty('--site-background-image', preset?.image || (uploadUrl ? uploadedImage(uploadUrl) : BACKGROUND_PRESETS[0].image))
}

export function choosePreset(id) {
  if (!isPreset(id)) throw new Error('That background is not available.')
  const choice = { kind: 'preset', id }
  saveChoice(choice)
  applyBackground(choice)
  return choice
}

export async function loadUploadedBackground() {
  const image = await readUpload()
  return image instanceof Blob ? image : null
}

export async function saveUploadedBackground(file) {
  if (!ACCEPTED_TYPES.has(file?.type)) throw new Error('Choose a PNG, JPEG, or WebP image.')
  if (file.size > MAX_BACKGROUND_BYTES) throw new Error('Choose an image smaller than 5 MB.')
  await writeUpload(file)
  const choice = { kind: 'upload' }
  saveChoice(choice)
  return choice
}

export async function resetBackground() {
  try { await deleteUpload() } catch (error) {
    if (!String(error.message).includes('unavailable')) throw error
  }
  saveChoice(defaultChoice)
  applyBackground(defaultChoice)
  return defaultChoice
}
