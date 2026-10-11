// Original geometric Staunton-inspired silhouettes, drawn for The Citadel.
const shapes = {
  p: <><circle cx="40" cy="23" r="10" /><path d="M33 34h14l-3 11 9 13H27l9-13z" /></>,
  r: <><path d="M23 14h9v9h5v-9h6v9h5v-9h9v19l-9 7 3 18H29l3-18-9-7z" /><path d="M26 32h28M32 40h16" fill="none" /></>,
  b: <><path d="M40 12c-6 8-14 13-14 21 0 7 6 11 14 11s14-4 14-11c0-8-8-13-14-21z" /><path d="m43 21-9 13M33 45h14l6 13H27z" /></>,
  n: <><path d="m25 57 7-17-11 1-3-9 11-14 14-5 8-5 2 13c12 10 14 27 8 37H25zm5-29 8-4" /><path d="M43 25c-2 12-10 15-11 24" fill="none" /><circle cx="34" cy="26" r="2" className="piece-eye" /></>,
  q: <><path d="m23 26 9 8 8-14 8 14 9-8-8 25H31zM31 51h18l6 7H25z" /><circle cx="22" cy="22" r="4" /><circle cx="40" cy="15" r="4" /><circle cx="58" cy="22" r="4" /></>,
  k: <><path d="M36 9h8v7h7v7h-7v7h-8v-7h-7v-7h7zM40 34c-15-17-25 2-12 12l5 7h14l5-7c13-10 3-29-12-12zM32 53h16l7 6H25z" /></>,
}
export function ChessPiece({ type }) {
  return <svg viewBox="0 0 80 80" aria-hidden="true" focusable="false" className="piece-svg">
    <g fill="currentColor" stroke="var(--piece-edge)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      {shapes[type]}
      <path d="M26 58h28l4 6H22zM22 65h36l3 7H19z" />
    </g>
  </svg>
}
