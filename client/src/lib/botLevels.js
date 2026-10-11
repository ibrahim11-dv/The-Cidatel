export const BOT_LEVELS = [
  { id: 'beginner', label: 'Beginner', skill: 0, moveTime: 120, note: 'A first sparring partner. Still a real engine: expect an occasional strong move.' },
  { id: 'easy', label: 'Easy', skill: 3, moveTime: 200, note: 'A relaxed practice table with room to experiment.' },
  { id: 'intermediate', label: 'Intermediate', skill: 7, moveTime: 350, note: 'Develop your pieces and watch for tactics.' },
  { id: 'advanced', label: 'Advanced', skill: 11, moveTime: 550, note: 'A sharper test of planning and calculation.' },
  { id: 'expert', label: 'Expert', skill: 16, moveTime: 800, note: 'Precise play with a deeper search.' },
  { id: 'master', label: 'Master', skill: 20, moveTime: 1200, note: 'Full engine skill within a short search budget.' },
]
export function getBotLevel(id) {
  return BOT_LEVELS.find((level) => level.id === id) || BOT_LEVELS[1]
}
