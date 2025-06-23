import type { Player } from '~/types/game'

const PLAYER_KEY = 'bingo-player'
const MARKED_NUMBERS_KEY = 'bingo-marked-numbers'
const ROUND_KEY = 'bingo-round'

export function savePlayerToStorage(player: Player, roomCode: string) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify({ player, roomCode }))
}

export function getPlayerFromStorage(roomCode: string): Player | null {
  try {
    const raw = localStorage.getItem(PLAYER_KEY)
    if (!raw) return null
    const { player, roomCode: storedRoom } = JSON.parse(raw)
    if (storedRoom !== roomCode) return null
    return player
  } catch {
    return null
  }
}

export function clearPlayerStorage() {
  localStorage.removeItem(PLAYER_KEY)
}

export function saveMarkedNumbersToStorage(markedNumbers: number[], roomCode: string, playerId: number, round: number) {
  const key = `${MARKED_NUMBERS_KEY}-${roomCode}-${playerId}`
  localStorage.setItem(key, JSON.stringify({ markedNumbers, round }))
}

export function getMarkedNumbersFromStorage(roomCode: string, playerId: number, currentRound: number): number[] {
  try {
    const key = `${MARKED_NUMBERS_KEY}-${roomCode}-${playerId}`
    const raw = localStorage.getItem(key)
    if (!raw) return []
    
    const { markedNumbers, round } = JSON.parse(raw)
    
    // If the round has changed, clear the marked numbers
    if (round !== currentRound) {
      clearMarkedNumbersStorage(roomCode, playerId)
      return []
    }
    
    return markedNumbers || []
  } catch {
    return []
  }
}

export function clearMarkedNumbersStorage(roomCode: string, playerId: number) {
  const key = `${MARKED_NUMBERS_KEY}-${roomCode}-${playerId}`
  localStorage.removeItem(key)
}

export function saveCurrentRound(roomCode: string, round: number) {
  const key = `${ROUND_KEY}-${roomCode}`
  localStorage.setItem(key, JSON.stringify(round))
}

export function getCurrentRound(roomCode: string): number {
  try {
    const key = `${ROUND_KEY}-${roomCode}`
    const raw = localStorage.getItem(key)
    if (!raw) return 1
    return JSON.parse(raw)
  } catch {
    return 1
  }
} 