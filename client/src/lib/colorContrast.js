function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => {
    const channel = parseInt(value, 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export function contrastRatio(first, second) {
  const a = luminance(first), b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function colorContrastIssues(colors) {
  return [
    ['Text on background', '--ink', '--paper'],
    ['Text on sidebar', '--ink', '--sidebar'],
    ['Text on panels', '--ink', '--paper-light'],
    ['Button text', '--paper', '--button'],
  ].map(([label, foreground, background]) => ({ label, ratio: contrastRatio(colors[foreground], colors[background]) }))
    .filter(({ ratio }) => ratio < 4.5)
}
