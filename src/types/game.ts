export interface Player {
  id: number
  name: string
  room_id: number
  bingo_sheet: number[][]
}

export interface Room {
  id: number
  code: string
  name: string
  status: 'waiting' | 'playing' | 'finished'
  drawn_numbers: number[]
  created_at: string
  host_id: string
} 