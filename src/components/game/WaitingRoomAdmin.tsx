import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { QRCodeSVG } from 'qrcode.react'
import Avatar, { genConfig } from 'react-nice-avatar'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { useUpdateRoomStatus } from '~/hooks/useRoom'
import { supabase } from '~/lib/supabase/client'
import type { Player } from '~/types/game'



interface Room {
  id: number
  code: string
  name: string
  status: string
  drawn_numbers: number[]
  created_at: string
  host_id: string
  round: number
}

interface WaitingRoomAdminProps {
  room: Room
  onGameStart: () => void
}

export function WaitingRoomAdmin({ room, onGameStart }: WaitingRoomAdminProps) {
  const [isQrModalOpen, setQrModalOpen] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([])
  const [playersData, setPlayersData] = useState<Record<number, Player>>({})
  const updateStatusMutation = useUpdateRoomStatus()
  
  const isChristmas = room.name.toLowerCase().includes('natal') || room.name.toLowerCase().includes('christmas')

  useEffect(() => {
    const loadPlayersData = async () => {
      try {
        const { data, error } = await supabase
          .from('player')
          .select('id, name, avatar_config')
          .eq('room_id', room.id)

        if (error) throw error

        const playersMap: Record<number, Player> = {}
        data?.forEach((player: any) => {
          playersMap[player.id] = player
        })
        setPlayersData(playersMap)
      } catch (error) {
      }
    }

    loadPlayersData()
  }, [room.id])

  useEffect(() => {
    const channel = supabase.channel(`room:${room.code}`, {
      config: {
        presence: {
          key: `host-${room.host_id}`,
        },
      },
    })

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
          name: isChristmas ? 'Papai Noel' : 'Anfitrião',
          is_host: true,
          host_id: room.host_id,
        })
      }
    })
      
    return () => {
      channel.unsubscribe()
    }
  }, [room.code, room.host_id, isChristmas])

  useEffect(() => {
    const playerUpdateChannel = supabase.channel(`admin-player-updates-${room.id}`)
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
          
          setPlayersData(prev => ({
            ...prev,
            [updatedPlayer.id]: updatedPlayer
          }))
          
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
  }, [room.id])

  const roomUrl = `https://dia-de-bingo.vercel.app/room/${room.code}`

  const handleStartGame = () => {
    updateStatusMutation.mutate({ 
      roomId: room.id, 
      status: 'playing',
      round: room.round + 1
    }, {
      onSuccess: () => {
        onGameStart()
      }
    })
  }

  const handleCopyRoomUrl = () => {
    navigator.clipboard.writeText(roomUrl)
    toast.success('URL da sala copiada para a área de transferência!')
  }

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
      
      <header className="p-4 bg-white/10 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-3 items-center gap-4">
          <div className="text-left">
            <p className="font-semibold hidden md:block">Entre em <br></br> <span className="font-bold text-xl">{roomUrl}</span></p>
          </div>
          <div className="text-center col-start-2">
            <p className="font-bold text-lg">PIN do jogo:</p>
            <p className="font-extrabold text-4xl md:text-6xl tracking-widest">{room.code}</p>
          </div>
          <button 
            onClick={() => setQrModalOpen(true)}
            className="bg-white p-2 rounded-md justify-self-end cursor-pointer hover:scale-105 transition-transform"
          >
            <QRCodeSVG value={roomUrl} size={100} bgColor="#ffffff" fgColor="#000000" className="w-16 h-16 md:w-24 md:h-24" />
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-4">
            {isChristmas ? '🎄 Bingo de Natal 🎄' : 'Dia de Bingo'}
          </h1>
          <p className={`text-xl ${isChristmas ? 'text-yellow-200' : 'text-blue-100'}`}>
            {isChristmas ? '🎅 Aguardando jogadores entrarem...' : 'Aguardando jogadores entrarem...'}
          </p>
        </motion.div>
        
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {onlinePlayers.map((player, index) => {
              const playerData = playersData[player.player_id]
              const avatarConfig = player.avatar_config || playerData?.avatar_config
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
                  ) : avatarConfig ? (
                    <Avatar
                      style={{ width: '48px', height: '48px' }}
                      {...avatarConfig}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold">{displayName}</div>
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
          <Button 
            onClick={handleStartGame}
            disabled={updateStatusMutation.isPending}
            className={`${isChristmas ? 'bg-red-600 hover:bg-red-700' : 'bg-green-500 hover:bg-green-600'} text-white font-bold`}
          >
            {isChristmas ? '🎄' : <Icon icon="material-symbols:play-arrow" className="mr-2" />}
            {updateStatusMutation.isPending ? 'Iniciando...' : isChristmas ? 'Iniciar Bingo de Natal!' : 'Iniciar Jogo'}
          </Button>
        </div>
      </footer>

      {isQrModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setQrModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-white p-8 rounded-2xl shadow-2xl relative flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <p className="font-bold text-2xl text-gray-800">Escaneie para entrar na sala</p>
              <p className="font-extrabold text-7xl text-blue-600 tracking-widest">{room.code}</p>
            </div>
            <div className='cursor-pointer group relative hover:bg-gray-400/50 rounded-lg p-6 group transition-all duration-300' onClick={handleCopyRoomUrl}>
              <Icon className="hidden absolute group-hover:block top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-blue-500 text-shadow-lg copy"  icon="material-symbols:content-copy-outline-rounded" />
              <QRCodeSVG value={roomUrl} size={300}  fgColor="#000000" bgColor="transparent"/>
            </div>
            <button
              onClick={() => setQrModalOpen(false)}
              className="cursor-pointer absolute -top-4 -right-4 bg-red-500 text-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
            >
              <Icon icon="material-symbols:close" className="text-2xl" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
} 