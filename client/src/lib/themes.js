const palette = (background, sidebar, panel, text, muted, accent, light, dark) => ({
  '--paper': background, '--sidebar': sidebar, '--paper-light': panel, '--paper-deep': sidebar,
  '--ink': text, '--ink-soft': muted, '--brass': accent, '--walnut': accent,
  '--walnut-dark': sidebar, '--wood-light': light, '--wood-dark': dark, '--rule': muted + '55',
})
export const THEMES = [
  { id: 'walnut', name: 'Classic Walnut', colors: palette('#1d1916', '#26201b', '#302821', '#f2e8d8', '#b8a794', '#b99665', '#e8d4b0', '#866347') },
  { id: 'oak', name: 'Natural Oak', colors: palette('#eee3cf', '#e0cfaf', '#f8f0e1', '#30271e', '#6e5c47', '#725127', '#eedcba', '#ac8559') },
  { id: 'mahogany', name: 'Dark Mahogany', colors: palette('#211617', '#2f1c1d', '#3c2425', '#f5e3d8', '#c4a39a', '#d5a076', '#eed2b6', '#825147') },
  { id: 'forest', name: 'Forest Chess', colors: palette('#18211c', '#202d24', '#2b382e', '#eeeada', '#abbca6', '#b5be81', '#e0dbc1', '#617760') },
  { id: 'midnight', name: 'Midnight Wood', colors: palette('#171a20', '#20242c', '#2b3039', '#e9e4da', '#a8adb7', '#ccb57e', '#d9d5c7', '#65717e') },
  { id: 'ivory', name: 'Minimal Ivory', colors: palette('#f6f3eb', '#eae5d9', '#fffdf7', '#292820', '#716b5b', '#706039', '#ece4d0', '#a29a80') },
]
export function readTheme() {
  try { return localStorage.getItem('citadel:theme') || 'walnut' } catch { return 'walnut' }
}
export function savedTheme(session) {
  const accountTheme = session?.preferences?.siteTheme
  return THEMES.some((theme) => theme.id === accountTheme) ? accountTheme : readTheme()
}
export const CUSTOM_COLORS = [
  ['--paper', 'Background'], ['--sidebar', 'Sidebar'], ['--paper-light', 'Panels'],
  ['--ink', 'Text'], ['--brass', 'Accent'], ['--button', 'Buttons'],
  ['--wood-light', 'Light squares'], ['--wood-dark', 'Dark squares'],
  ['--selected', 'Selected square'], ['--legal', 'Legal moves'], ['--last-move', 'Last move'],
]
export function normalizeColors(value) {
  return Object.fromEntries(CUSTOM_COLORS.filter(([key]) => /^#[0-9a-f]{6}$/i.test(value?.[key] || '')).map(([key]) => [key, value[key]]))
}
export function readCustomColors() {
  try { return normalizeColors(JSON.parse(localStorage.getItem('citadel:custom-colors'))) } catch { return {} }
}
export function saveCustomColors(value) {
  try { localStorage.setItem('citadel:custom-colors', JSON.stringify(normalizeColors(value))); return true } catch { return false }
}
export function themeColors(id, overrides = {}) {
  const theme = THEMES.find((item) => item.id === id) || THEMES[0]
  return { ...theme.colors, '--button': theme.colors['--brass'], '--selected': '#3c6540', '--legal': '#271b0e', '--last-move': '#efcd77', ...normalizeColors(overrides) }
}
export function applyTheme(id, overrides = readCustomColors()) {
  const theme = THEMES.find((item) => item.id === id) || THEMES[0]
  Object.entries(themeColors(id, overrides)).forEach(([key, value]) => document.documentElement.style.setProperty(key, value))
  document.documentElement.dataset.theme = theme.id
}
