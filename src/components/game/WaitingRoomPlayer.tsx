import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Avatar, { genConfig } from 'react-nice-avatar'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '~/components/ui/dialog'
import { toast } from 'sonner'
import { supabase } from '~/lib/supabase/client'
import { BingoSheet } from './BingoSheet'
import { AvatarBuilder } from './AvatarBuilder'
import { savePlayerToStorage, clearMarkedNumbersStorage, saveAvatarConfig, getAvatarConfig } from '~/utils/playerStorage'
import { useUpdatePlayerAvatar } from '~/hooks/useRoom'
import type { Room, Player } from '~/types/game'

type AvatarConfig = ReturnType<typeof genConfig>

interface WaitingRoomPlayerProps {
  room: Room
  currentPlayer: Player
}

export function WaitingRoomPlayer({ room, currentPlayer }: WaitingRoomPlayerProps) {
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([])
  const [bingoSheet, setBingoSheet] = useState<number[][]>([])
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(() => {
    // Try to load from currentPlayer first (from Supabase)
    if (currentPlayer.avatar_config) {
      return currentPlayer.avatar_config
    }
    // Fallback to localStorage
    const saved = getAvatarConfig(currentPlayer.id)
    if (saved) return saved
    // Generate new if nothing found
    return genConfig(currentPlayer.name)
  })
  const updateAvatarMutation = useUpdatePlayerAvatar()

  // Load avatar from Supabase on mount
  useEffect(() => {
    const loadAvatarFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('player')
          .select('avatar_config')
          .eq('id', currentPlayer.id)
          .single()

        if (error) throw error

        if (data?.avatar_config) {
          setAvatarConfig(data.avatar_config)
          saveAvatarConfig(currentPlayer.id, data.avatar_config)
        }
      } catch (error) {
        console.error('Error loading avatar from Supabase:', error)
      }
    }

    loadAvatarFromSupabase()
  }, [currentPlayer.id])

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
          avatar_config: avatarConfig,
        })
      }
    })
      
    return () => {
      channel.unsubscribe()
    }
  }, [room.code, currentPlayer.id, currentPlayer.name, avatarConfig])

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

  // Listen to player avatar updates
  useEffect(() => {
    const playerUpdateChannel = supabase.channel(`player-avatar-updates-${room.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'player', 
          filter: `room_id=eq.${room.id}` 
        },
        (payload) => {
          const updatedPlayer = payload.new as Player
          
          // If this is the current player, update local state
          if (updatedPlayer.id === currentPlayer.id && updatedPlayer.avatar_config) {
            setAvatarConfig(updatedPlayer.avatar_config)
            saveAvatarConfig(currentPlayer.id, updatedPlayer.avatar_config)
          }
          
          // Update online players list with new avatar
          setOnlinePlayers(prev => 
            prev.map(p => 
              p.player_id === updatedPlayer.id 
                ? { ...p, avatar_config: updatedPlayer.avatar_config }
                : p
            )
          )
        }
      )
      .subscribe()
      
    return () => {
      playerUpdateChannel.unsubscribe()
    }
  }, [room.id, currentPlayer.id])

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

  const isChristmas = room.name.toLowerCase().includes('natal') || room.name.toLowerCase().includes('christmas')

  const snowflakePositions = Array.from({ length: 20 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 2
  }))

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#3c95f1] to-[#c3def9] overflow-hidden flex flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: isChristmas
            ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 40px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 40px)'
            : 'repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px)',
          backgroundPosition: 'center',
        }}
      />
      {isChristmas && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {snowflakePositions.map((pos, i) => (
              <motion.div
                key={i}
                className="absolute text-white text-2xl"
                style={{ left: pos.left, top: pos.top }}
                animate={{
                  y: [0, 100],
                  rotate: [0, 360],
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: pos.duration,
                  repeat: Infinity,
                  delay: pos.delay,
                  ease: "linear"
                }}
              >
                <Icon icon="material-symbols:snowflake" />
              </motion.div>
            ))}
          </div>
          <div className="absolute top-4 left-4 text-4xl animate-bounce pointer-events-none">
            🎄
          </div>
          <div className="absolute top-4 right-4 text-4xl animate-bounce pointer-events-none" style={{ animationDelay: '0.5s' }}>
            ⭐
          </div>
          <div className="absolute bottom-20 left-8 text-3xl pointer-events-none">
            🎁
          </div>
          <div className="absolute bottom-20 right-8 text-3xl pointer-events-none">
            🦌
          </div>
        </>
      )}
      
      {/* Header */}
      <header className="p-4 bg-white/10 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
          <div className="text-left">
            <p className="font-semibold hidden md:block">Entre em <br/><span className="font-bold text-xl">dia-de-bingo.vercel.app/room/{room.code}</span></p>
          </div>
          <div className="text-center col-start-2 flex flex-col items-center justify-center">
            <p className="font-bold text-lg">PIN do jogo:</p>
            <p className="font-extrabold text-4xl md:text-6xl tracking-widest">{room.code}</p>
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
            {isChristmas ? '🎄 Bingo de Natal 🎄' : 'Dia de Bingo'}
          </motion.h1>
          <motion.p 
            className={`text-xl ${isChristmas ? 'text-yellow-200' : 'text-blue-100'}`}
            variants={itemVariants}
          >
            {isChristmas ? '🎅 Aguardando o anfitrião iniciar o jogo...' : 'Aguardando o anfitrião iniciar o jogo...'}
          </motion.p>
        </motion.div>

        {/* Player Info */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
            {avatarConfig ? (
              <Avatar
                style={{ width: '48px', height: '48px' }}
                {...avatarConfig}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {currentPlayer.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="text-center">
              <div className="font-bold text-lg">
                {currentPlayer.name || 'Jogador'}
              </div>
              <div className="text-sm text-blue-100">Jogador</div>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <AvatarBuilder
              currentConfig={avatarConfig}
              onSave={async (config) => {
                // Save to localStorage immediately for instant feedback
                setAvatarConfig(config)
                saveAvatarConfig(currentPlayer.id, config)
                
                // Save to Supabase
                try {
                  await updateAvatarMutation.mutateAsync({
                    playerId: currentPlayer.id,
                    avatarConfig: config
                  })
                  
                  toast.success('Avatar salvo com sucesso!')
                } catch (error) {
                  console.error('Error saving avatar to Supabase:', error)
                  toast.error('Erro ao salvar avatar no servidor, mas foi salvo localmente')
                }
              }}
              playerName={currentPlayer.name}
            />
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
              {isChristmas ? '🎁 Você pode gerar uma nova cartela enquanto aguarda o início do jogo! 🎁' : 'Você pode gerar uma nova cartela enquanto aguarda o início do jogo!'}
            </p>
          </div>
        </motion.div>

        {/* Players Grid */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {onlinePlayers.map((player, index) => {
              const displayName = player.is_host && isChristmas ? 'Papai Noel' : player.name
              const isHostAndChristmas = player.is_host && isChristmas
              
              return (
                <div key={`${player.name}-${index}`} className="p-4 rounded-lg bg-black/20 text-white flex flex-col items-center justify-center gap-2">
                  {isHostAndChristmas ? (
                    <img
                      src="/santa-avatar.png"
                      alt="Papai Noel"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : player.avatar_config ? (
                    <Avatar
                      style={{ width: '48px', height: '48px' }}
                      {...player.avatar_config}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold">{displayName}</div>
                    {player.player_id === currentPlayer.id && (
                      <div className="text-xs text-blue-50">Você</div>
                    )}
                    {player.is_host && (
                      <div className="text-xs text-yellow-400">
                        {isChristmas ? '🎅 Papai Noel' : 'Anfitrião'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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
            <div className={`w-3 h-3 rounded-full animate-pulse ${isChristmas ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="font-medium">
              {isChristmas ? '🎅 Aguardando início do jogo' : 'Aguardando início do jogo'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
} 