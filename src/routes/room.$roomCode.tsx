import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import { useRoom } from '~/hooks/useRoom'
import { useAuth } from '~/lib/auth/auth-context'
import { supabase } from '~/lib/supabase/client'
import { WaitingRoomPlayer } from '~/components/game/WaitingRoomPlayer'
import { WaitingRoomAdmin } from '~/components/game/WaitingRoomAdmin'
import { GameAdmin } from '~/components/game/GameAdmin'
import { GamePlayer } from '~/components/game/GamePlayer'
import { GameOver } from '~/components/game/GameOver'
import { JoinRoomForm } from '~/components/game/JoinRoomForm'
import { LoadingScreen } from '~/components/game/LoadingScreen'
import type { Player, Room } from '~/types/game'
import { savePlayerToStorage, getPlayerFromStorage, clearMarkedNumbersStorage } from '~/utils/playerStorage'

export const Route = createFileRoute('/room/$roomCode')({
  component: RoomPage,
})

function RoomPage() {
  const { roomCode } = Route.useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: room, isLoading: roomLoading, error } = useRoom(roomCode)

  const [isHost, setIsHost] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)

  // Load player from localStorage on mount
  useEffect(() => {
    if (!currentPlayer && roomCode) {
      const stored = getPlayerFromStorage(roomCode)
      if (stored) setCurrentPlayer(stored)
    }
  }, [roomCode])

  useEffect(() => {
    if (!authLoading && !roomLoading && room && user) {
      setIsHost(user.id === room.host_id)
    }
  }, [user, room, authLoading, roomLoading])
  
  // Check initial room status
  useEffect(() => {
    if (room) {
      if (room.status === 'playing') {
        setGameStarted(true)
        setGameFinished(false)
      } else if (room.status === 'finished') {
        setGameFinished(true)
        setGameStarted(false)
        // Clear localStorage when game is finished
        if (currentPlayer) {
          clearMarkedNumbersStorage(roomCode, currentPlayer.id)
        }
      } else {
        setGameStarted(false)
        setGameFinished(false)
        // Clear localStorage when returning to waiting room
        if (currentPlayer) {
          clearMarkedNumbersStorage(roomCode, currentPlayer.id)
        }
      }
    }
  }, [room, roomCode, currentPlayer])

  // Real-time subscription to room status changes
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`room-page-status-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room',
          filter: `id=eq.${room.id}`
        },
        (payload) => {
          const updatedRoom = payload.new as Room
          
          if (updatedRoom.status === 'playing' && !gameStarted) {
            setGameStarted(true)
            setGameFinished(false)
          } else if (updatedRoom.status === 'waiting' && gameStarted) {
            setGameStarted(false)
            setGameFinished(false)
            toast.info('Voltando à sala de espera')
          } else if (updatedRoom.status === 'finished' && !gameFinished) {
            setGameFinished(true)
            setGameStarted(false)
            toast.info('O jogo foi finalizado')
          }
          
          if (updatedRoom.round !== room.round) {
            toast.info(`Nova rodada iniciada! (Rodada ${updatedRoom.round})`)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [room?.id, roomCode, currentPlayer, room?.round])
  
  const handleJoin = (player: Player) => {
    setCurrentPlayer(player)
    savePlayerToStorage(player, roomCode)
  }

  const handleGameStart = () => {
    setGameStarted(true)
  }

  if (authLoading || roomLoading) {
    return <LoadingScreen />
  }

  if (error || !room) {
    return <RoomNotFound roomCode={roomCode} />
  }

  // Game is finished
  if (gameFinished || room.status === 'finished') {
    return <GameOver roomName={room.name} />
  }

  // Game is active
  if (gameStarted || room.status === 'playing') {
    if (isHost) {
      return <GameAdmin room={room as Room} />
    } else if (currentPlayer) {
      return <GamePlayer room={room as Room} currentPlayer={currentPlayer} />
    }
  }

  // Waiting room
  if (isHost) {
    return <WaitingRoomAdmin room={room as Room} onGameStart={handleGameStart} />
  } else if (currentPlayer) {
    return <WaitingRoomPlayer room={room as Room} currentPlayer={currentPlayer} />
  } else {
    return <JoinRoomForm room={room as Room} roomCode={roomCode} onJoin={handleJoin} />
  }

  // Fallback - should not reach here
  return <LoadingScreen />
}

// Room Not Found Component
function RoomNotFound({ roomCode }: { roomCode: string }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  // Use stable positions to avoid hydration mismatch
  const particlePositions = [
    { left: '15%', top: '25%' },
    { left: '25%', top: '75%' },
    { left: '35%', top: '45%' },
    { left: '45%', top: '15%' },
    { left: '55%', top: '65%' },
    { left: '65%', top: '35%' },
    { left: '75%', top: '75%' },
    { left: '85%', top: '55%' },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#3c95f1] to-[#c3def9] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px)',
          backgroundPosition: 'center',
        }}
      />

      <div className="absolute inset-0 overflow-hidden">
        {particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-white rounded-full opacity-20"
            animate={{
              y: [0, -20, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={pos}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="text-8xl md:text-9xl font-bold text-white drop-shadow-lg mb-4">
            <Icon icon="material-symbols:room" className="inline-block" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Sala não encontrada
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-6 leading-relaxed">
            A sala com o código <span className="font-mono font-bold">{roomCode}</span> não existe ou foi removida.
          </p>
        </motion.div>

        <motion.div
          className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
          variants={itemVariants}
        >
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center text-sm md:text-base font-bold text-white"
                whileHover={{ scale: 1.1 }}
                transition={{ delay: i * 0.02 }}
              >
                {i === 12 ? (
                  <Icon icon="material-symbols:star" className="text-yellow-300" />
                ) : (
                  ((i % 5) * 15) + Math.floor(i / 5) + 1
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-white">
            Verifique se o código está correto ou peça ao administrador para compartilhar novamente!
          </p>
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
          <motion.button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon="material-symbols:arrow-back" />
            Voltar
          </motion.button>
          <motion.button
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon="material-symbols:home" />
            Ir para o Início
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
} 