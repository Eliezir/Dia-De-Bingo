import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useRoom } from '~/hooks/useRoom'
import { GameOver } from '~/components/game/GameOver'
import { LoadingScreen } from '~/components/game/LoadingScreen'

export const Route = createFileRoute('/room/$roomCode/game-over')({
  component: GameOverPage,
})

function GameOverPage() {
  const { roomCode } = Route.useParams()
  const { data: room, isLoading, error } = useRoom(roomCode)
  const [winner, setWinner] = useState<string | undefined>()

  useEffect(() => {
    // Clear localStorage when game is over
    localStorage.removeItem(`markedNumbers_${roomCode}`)
  }, [roomCode])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Sala não encontrada</h1>
          <p>O código da sala pode estar incorreto ou a sala foi removida.</p>
        </div>
      </div>
    )
  }

  return <GameOver roomName={room.name} winner={winner} />
} 