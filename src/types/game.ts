export interface Player {
  id: number
  name: string
  room_id: number
  bingo_sheet: number[][]
  avatar_config?: any
}

export interface Room {
  id: number
  code: string
  name: string
  status: 'waiting' | 'playing' | 'finished'
  drawn_numbers: number[]
  created_at: string
  host_id: string
  round: number
}

export type BingoClaimStatus = 'pending' | 'checking' | 'confirmed' | 'rejected'

export interface BingoClaim {
  id: number
  created_at: string
  player_id: number
  room_id: number
  status: BingoClaimStatus
  result_phrase: string | null
  checked_at: string | null
} 