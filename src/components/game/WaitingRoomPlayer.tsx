import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '~/lib/supabase/client'
import { BingoSheet } from './BingoSheet'
import { savePlayerToStorage, clearMarkedNumbersStorage } from '~/utils/playerStorage'
import type { Room, Player } from '~/types/game'

interface WaitingRoomPlayerProps {
  room: Room
  currentPlayer: Player
}

export function WaitingRoomPlayer({ room, currentPlayer }: WaitingRoomPlayerProps) {
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([])
  const [bingoSheet, setBingoSheet] = useState<number[][]>([])

  // Use the bingo sheet from the player data
  useEffect(() => {
    if (currentPlayer.bingo_sheet && Array.isArray(currentPlayer.bingo_sheet)) {
      setBingoSheet(currentPlayer.bingo_sheet)
      console.log('bingoSheet', currentPlayer.bingo_sheet)
      
    }
  }, [currentPlayer.bingo_sheet])

  useEffect(() => {
    const channel = supabase.channel(`room:${room.code}`, {
      config: {
        presence: {
          key: `player-${currentPlayer.id}`,
        },
      },
    })

    // Listen to presence events
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const players = Object.values(newState).map((p: any) => p[0]).filter(Boolean)
        setOnlinePlayers(players)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const newPlayers = newPresences.map((p: any) => p[0]).filter(Boolean)
        if (newPlayers.length > 0 && newPlayers[0]?.name) {
          toast.info(`${newPlayers[0].name} entrou na sala!`)
          setOnlinePlayers(prev => [...prev, ...newPlayers])
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const leftPlayers = leftPresences.map((p: any) => p[0]).filter(Boolean)
        if (leftPlayers.length > 0 && leftPlayers[0]?.name) {
          toast.info(`${leftPlayers[0].name} saiu da sala.`)
          setOnlinePlayers(prev => prev.filter(p => !leftPresences.some(lp => lp.key === p.key)))
        }
      })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ 
          name: currentPlayer.name,
          is_host: false,
          player_id: currentPlayer.id,
        })
      }
    })
      
    return () => {
      channel.unsubscribe()
    }
  }, [room.code, currentPlayer.id, currentPlayer.name])

  // Listen to room status changes
  useEffect(() => {
    const roomStatusChannel = supabase.channel(`waiting-room-status-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${room.id}` },
        (payload) => {
          const updatedRoom = payload.new as Room
          
          if (updatedRoom.status === 'playing') {
            // Redirect to game when admin starts the game
            window.location.href = `/room/${room.code}`
          } else if (updatedRoom.status === 'finished') {
            // Redirect to game over when game is finished
            window.location.href = `/room/${room.code}/game-over`
          }
        }
      )
      .subscribe()
      
    return () => {
      roomStatusChannel.unsubscribe()
    }
  }, [room.id, room.code])

  const handleGenerateNewSheet = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-bingo-sheet', {
        body: { playerId: currentPlayer.id }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data && data.bingoSheet) {
        setBingoSheet(data.bingoSheet)
        
        const updatedPlayer = {
          ...currentPlayer,
          bingo_sheet: data.bingoSheet
        }
        savePlayerToStorage(updatedPlayer, room.code)
        
        clearMarkedNumbersStorage(room.code, currentPlayer.id)
        
        toast.success('Nova cartela gerada!')
      }
    } catch (error) {
      console.error('Error generating new bingo sheet:', error)
      toast.error('Erro ao gerar nova cartela')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#3c95f1] to-[#c3def9] overflow-hidden flex flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px)',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Header */}
      <header className="p-4 bg-white/10 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
          <div className="text-left">
            <p className="font-semibold hidden md:block">Entre em <span className="font-bold text-2xl">www.diadebingo.com</span></p>
          </div>
          <div className="text-center col-start-2">
            <p className="font-bold text-lg">PIN do jogo:</p>
            <p className="font-extrabold text-4xl md:text-6xl tracking-widest">{room.code}</p>
          </div>
          <div className="justify-self-end flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(room.code)}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Icon icon="material-symbols:content-copy" className="w-4 h-4 mr-1" />
              Copiar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  <Icon icon="material-symbols:qr-code" className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>QR Code da Sala</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center p-4">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">QR Code: {room.code}</span>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          className="text-center mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-5xl font-extrabold text-white drop-shadow-lg mb-4"
            variants={itemVariants}
          >
            Dia de Bingo
          </motion.h1>
          <motion.p 
            className="text-xl text-blue-100"
            variants={itemVariants}
          >
            Aguardando o anfitrião iniciar o jogo...
          </motion.p>
        </motion.div>

        {/* Player Info */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {currentPlayer.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="font-bold text-lg">
                {currentPlayer.name || 'Jogador'}
              </div>
              <div className="text-sm text-blue-100">Jogador</div>
            </div>
          </div>
        </motion.div>

        {/* Bingo Sheet Preview */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold text-center mb-4">Sua Cartela de Bingo</h2>
            
            {bingoSheet.length > 0 && (
              <div className="flex justify-center mb-4">
                <BingoSheet
                  numbers={bingoSheet}
                  readOnly={true}
                  className="bg-white/20 p-4 rounded-lg"
                />
              </div>
            )}
            
            <div className="flex justify-center">
              <Button
                onClick={handleGenerateNewSheet}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                <Icon icon="material-symbols:shuffle" className="w-4 h-4 mr-2" />
                Gerar Nova Cartela
              </Button>
            </div>
            
            <p className="text-center text-blue-100 text-sm mt-4">
              Você pode gerar uma nova cartela enquanto aguarda o início do jogo!
            </p>
          </div>
        </motion.div>

        {/* Players Grid */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {onlinePlayers.map((player, index) => (
              <div key={`${player.name}-${index}`} className="p-4 rounded-lg bg-black/20 text-white flex items-center justify-center">
                <div className="text-center">
                  <div className="font-bold">{player.name}</div>
                  {player.player_id === currentPlayer.id && (
                    <div className="text-xs text-blue-600">Você</div>
                  )}
                  {player.is_host && (
                    <div className="text-xs text-blue-600">Anfitrião</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-4 bg-black/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Icon icon="material-symbols:group" />
            <span className="font-bold">{onlinePlayers.length} jogadores</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Aguardando início do jogo</span>
          </div>
        </div>
      </footer>
    </div>
  )
} 