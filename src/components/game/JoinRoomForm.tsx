import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'
import { useJoinRoom } from '~/hooks/useRoom'
import type { Player, Room } from '~/types/game'

interface JoinRoomFormProps {
  room: Room
  roomCode: string
  onJoin: (player: Player) => void
}

export function JoinRoomForm({ room, roomCode, onJoin }: JoinRoomFormProps) {
  const [playerName, setPlayerName] = useState('')
  const joinRoomMutation = useJoinRoom()

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!playerName.trim()) {
      toast.error('Por favor, digite seu nome')
      return
    }

    joinRoomMutation.mutate({ roomCode, name: playerName }, {
      onSuccess: (data) => {
        onJoin(data)
      }
    })
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#3c95f1] to-[#c3def9] overflow-hidden">
      {/* Background Grid and Particles */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px)',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-white rounded-full opacity-20"
            animate={{ y: [0, -20, 0], x: [0, (i % 2 === 0 ? 10 : -10), 0] }}
            transition={{ duration: 3 + (i * 0.5), repeat: Infinity, delay: i * 0.3 }}
            style={{ 
              left: `${10 + (i * 10)}%`, 
              top: `${20 + (i * 8)}%` 
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Entrar na Sala de Bingo
          </motion.h1>
          <motion.p
            className="text-lg text-blue-100 mb-6"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Você está entrando na sala <span className="font-bold text-white">{room.name}</span>
          </motion.p>

          <form onSubmit={handleJoin} className="space-y-6">
            <motion.div
              className="space-y-2 text-left"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Label htmlFor="playerName" className="text-white/80">Seu Nome</Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Ex: Dona Verônica"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:ring-white"
                required
              />
            </motion.div>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full"
                disabled={joinRoomMutation.isPending}
              >
                {joinRoomMutation.isPending ? 'Entrando...' : 'Entrar na Sala'}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  )
} 