import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '~/lib/supabase/client'
import { BingoSheet } from './BingoSheet'
import { BingoResult } from './BingoResult'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import { toast } from 'sonner'
import { saveMarkedNumbersToStorage, getMarkedNumbersFromStorage, saveCurrentRound } from '~/utils/playerStorage'
import type { Player, Room } from '~/types/game'

interface GamePlayerProps {
  room: Room
  currentPlayer: Player
}

export function GamePlayer({ room, currentPlayer }: GamePlayerProps) {
  const navigate = useNavigate()
  const [currentRoom, setCurrentRoom] = useState(room)
  const currentRoomRef = useRef(room)
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set())
  const [hasCalledBingo, setHasCalledBingo] = useState(false)
  const [bingoClaims, setBingoClaims] = useState<
    { claimId: number; playerId: number; name: string; avatarConfig?: any; status: 'pending' | 'win' | 'lose'; phrase?: string }[]
  >([])
  const [bingoChannel, setBingoChannel] = useState<any>(null)
  const [currentBingoResult, setCurrentBingoResult] = useState<{
    playerId: number;
    result: 'win' | 'lose';
    phrase: string;
    playerName: string;
    avatarConfig?: any;
  } | null>(null)
  const [showBingoConfirmation, setShowBingoConfirmation] = useState(false)

  useEffect(() => {
    const fetchLatestRoom = async () => {
      try {
        const { data, error } = await supabase
          .from('room')
          .select('*')
          .eq('code', room.code)
          .single()

        if (error) throw error

        if (data) {
          if (data.status === 'waiting' && room.status === 'playing') {
            navigate({ to: `/room/${data.code}` })
            return
          } else if (data.status === 'finished') {
            navigate({ to: `/room/${data.code}/game-over` })
            return
          }

          setCurrentRoom(data)
          currentRoomRef.current = data
        }
      } catch (error) {
      }
    }

    fetchLatestRoom()
  }, [room.code, room.status, navigate])

  useEffect(() => {
    setCurrentRoom(room)
    currentRoomRef.current = room
  }, [room])

  useEffect(() => {
    const storedMarkedNumbers = getMarkedNumbersFromStorage(currentRoom.code, currentPlayer.id, currentRoom.round)
    setMarkedNumbers(new Set(storedMarkedNumbers))
    
    saveCurrentRound(currentRoom.code, currentRoom.round)
  }, [currentRoom.code, currentPlayer.id, currentRoom.round])

  useEffect(() => {
    if (markedNumbers.size > 0) {
      saveMarkedNumbersToStorage(Array.from(markedNumbers), currentRoom.code, currentPlayer.id, currentRoom.round)
    }
  }, [markedNumbers, currentRoom.code, currentPlayer.id, currentRoom.round])

  useEffect(() => {
    if (!currentRoom.id) return

    const roomUpdateSubscription = supabase.channel(`game-player-room-${currentRoom.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${currentRoom.id}` },
        (payload) => {
          const updatedRoom = payload.new as Room
          const previousStatus = currentRoomRef.current.status
          const previousRound = currentRoomRef.current.round
          
          const roundChanged = updatedRoom.round !== previousRound
          const statusChanged = updatedRoom.status !== previousStatus
          

          if (statusChanged) {
            if (updatedRoom.status === 'waiting') {
              window.location.href = `/room/${updatedRoom.code}`
              return
            } else if (updatedRoom.status === 'finished') {
              window.location.href = `/room/${updatedRoom.code}/game-over`
              return
            }
          }
          
          currentRoomRef.current = updatedRoom
          
          setCurrentRoom(updatedRoom)
          
          if (roundChanged) {
            setMarkedNumbers(new Set())
            setHasCalledBingo(false)
            setBingoClaims([])
            setCurrentBingoResult(null)
            saveCurrentRound(updatedRoom.code, updatedRoom.round)
            toast.info(`Nova rodada iniciada! (Rodada ${updatedRoom.round})`)
          }
        }
      )
      .subscribe()
      
    return () => {
      roomUpdateSubscription.unsubscribe()
    }
  }, [currentRoom.id, navigate])

  useEffect(() => {
    const channel = supabase
      .channel(`bingo:${currentRoom.id}`)
      .on('broadcast', { event: 'bingo-claim' }, (event) => {
        const payload = event.payload as { playerId: number; name: string; avatarConfig?: any; claimId: number; round?: number }
        if (payload.round && payload.round !== currentRoom.round) return
        setBingoClaims((prev) => {
          if (prev.some((c) => c.playerId === payload.playerId && c.status === 'pending')) return prev
          return [...prev, { claimId: payload.claimId, playerId: payload.playerId, name: payload.name, avatarConfig: payload.avatarConfig, status: 'pending' }]
        })
      })
      .on('broadcast', { event: 'bingo-result' }, (event) => {
        const payload = event.payload as { playerId: number; result: 'win' | 'lose'; phrase: string; playerName?: string; avatarConfig?: any }
        setBingoClaims((prev) =>
          prev.map((c) =>
            c.playerId === payload.playerId ? { ...c, status: payload.result, phrase: payload.phrase } : c
          )
        )

        if (payload.playerId === currentPlayer.id) {
          setHasCalledBingo(false)
        }

        setCurrentBingoResult({
          playerId: payload.playerId,
          result: payload.result,
          phrase: payload.phrase,
          playerName: payload.playerName || bingoClaims.find(c => c.playerId === payload.playerId)?.name || 'Jogador',
          avatarConfig: payload.avatarConfig || bingoClaims.find(c => c.playerId === payload.playerId)?.avatarConfig
        })
        
        setTimeout(() => {
          setCurrentBingoResult(null)
        }, 5000)
      })
      .subscribe()

    setBingoChannel(channel)

    return () => {
      channel.unsubscribe()
    }
  }, [currentRoom.id, currentPlayer.id, currentRoom.round])

  const handleNumberClick = (number: number) => {
    setMarkedNumbers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(number)) {
        newSet.delete(number)
      } else {
        newSet.add(number)
      }
      return newSet
    })
  }

  const handleCallBingoClick = () => {
    const hasPendingClaim = bingoClaims.some(
      claim => claim.playerId === currentPlayer.id && claim.status === 'pending'
    )

    if (hasPendingClaim || hasCalledBingo) {
      toast.info('Você já chamou bingo nesta rodada!')
      return
    }

    setShowBingoConfirmation(true)
  }

  const handleConfirmBingoCall = async () => {
    if (!bingoChannel || hasCalledBingo) return


    setShowBingoConfirmation(false)

    try {
      const { data: existingClaims, error: checkError } = await supabase
        .from('bingo_claims')
        .select('id, status')
        .eq('player_id', currentPlayer.id)
        .eq('room_id', currentRoom.id)
        .eq('round', currentRoom.round)
        .in('status', ['pending'])

      if (checkError) {
        toast.error('Erro ao verificar bingo')
        return
      }

      if (existingClaims && existingClaims.length > 0) {
        toast.error('Você já tem um bingo pendente nesta rodada!')
        return
      }

      const { data: claim, error } = await supabase
        .from('bingo_claims')
        .insert({
          player_id: currentPlayer.id,
          room_id: currentRoom.id,
          round: currentRoom.round,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        toast.error('Erro ao chamar bingo')
        return
      }

      setHasCalledBingo(true)

      await bingoChannel.send({
        type: 'broadcast',
        event: 'bingo-claim',
        payload: {
          playerId: currentPlayer.id,
          name: currentPlayer.name,
          avatarConfig: currentPlayer.avatar_config,
          claimId: claim.id,
          round: currentRoom.round
        }
      })

      toast.success('Bingo chamado! Aguardando verificação...')
    } catch (error) {
      toast.error('Erro ao chamar bingo')
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
      
      <header className="p-4 bg-white/10 backdrop-blur-sm text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{currentRoom.name}</h1>
              <Badge className="bg-blue-500/80 text-white text-sm md:text-base px-2 py-1">
                Rodada {currentRoom.round}
              </Badge>
            </div>
            <p className="text-sm md:text-base text-blue-100">Jogador: {currentPlayer.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm md:text-base">
              <span className="text-blue-100">Marcados: </span>
              <span className="font-bold text-white">{markedNumbers.size}</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <motion.div
          className="w-full max-w-md mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="text-center mb-6"
            variants={itemVariants}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Sua Cartela</h2>
            <p className="text-blue-100">
              Marque os números conforme eles são sorteados!
            </p>
          </motion.div>

          <motion.div 
            className="mb-6"
            variants={itemVariants}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
              <BingoSheet
                numbers={currentPlayer.bingo_sheet}
                markedNumbers={Array.from(markedNumbers)}
                onNumberClick={handleNumberClick}
                readOnly={false}
                className="bg-white/20 p-4 rounded-lg"
              />
            </div>
          </motion.div>

          <motion.div 
            className="text-center"
            variants={itemVariants}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-100">Progresso:</span>
                <span className="font-bold">{markedNumbers.size}/25</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(markedNumbers.size / 25) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="p-4 bg-black/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-white gap-3">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:casino" />
            <span className="font-medium">Jogo em andamento</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Aguardando números</span>
          </div>
          <Button
            onClick={handleCallBingoClick}
            disabled={hasCalledBingo}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-2 px-6 py-2 rounded-full shadow-lg disabled:opacity-50"
          >
            <Icon icon="material-symbols:campaign" className="text-xl" />
            {hasCalledBingo 
              ? 'Bingo enviado' 
                : 'Gritar BINGO'}
          </Button>
        </div>
      </footer>

  
      {currentBingoResult && (
        <BingoResult
          result={currentBingoResult.result}
          playerName={currentBingoResult.playerName}
          avatarConfig={currentBingoResult.avatarConfig}
          phrase={currentBingoResult.phrase}
          onClose={() => setCurrentBingoResult(null)}
        />
      )}

      <Dialog open={showBingoConfirmation} onOpenChange={setShowBingoConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-whit">Confirmar Bingo</DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              <div className="space-y-3">
                <p className="text-red-600 font-semibold">
                  ⚠️ É muito paia fingir bingo!
                </p>
                <p>
                  Certifique-se de que você realmente completou uma linha, coluna ou diagonal antes de confirmar.
                </p>
                <p className="text-sm text-gray-600">
                  Falsos bingos podem resultar em penalidades.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowBingoConfirmation(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmBingoCall}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold"
            >
              <Icon icon="material-symbols:campaign" className="mr-2" />
              Confirmar Bingo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 