import type { Player } from '~/types/game'

const KEY = 'bingo-player'

export function savePlayerToStorage(player: Player, roomCode: string) {
  localStorage.setItem(KEY, JSON.stringify({ player, roomCode }))
}

export function getPlayerFromStorage(roomCode: string): Player | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { player, roomCode: storedRoom } = JSON.parse(raw)
    if (storedRoom !== roomCode) return null
    return player
  } catch {
    return null
  }
}

export function clearPlayerStorage() {
  localStorage.removeItem(KEY)
} 