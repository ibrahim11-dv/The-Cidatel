export function invitationCodeFromSearch(search = '') {
  return new URLSearchParams(search).get('invite')?.trim() || ''
}

export function shouldAutoJoinInvitation({ checkingActive, code, gameId, invitation, searching, attempted }) {
  return !checkingActive && !!code && !gameId && !invitation && !searching && !attempted
}
