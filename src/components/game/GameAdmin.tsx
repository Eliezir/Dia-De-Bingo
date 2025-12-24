import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Avatar from 'react-nice-avatar'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { ConfirmationModal } from '~/components/ui/confirmation-modal'
import { toast } from 'sonner'
import { supabase } from '~/lib/supabase/client'
import { BingoSheet } from './BingoSheet'
import { BingoResult } from './BingoResult'
import { useAudioPlayer } from '~/hooks/useAudioPlayer'
import { getRandomAudio, markAudioAsUsed, getRandomPhrase, markPhraseAsUsed } from '~/utils/audioManager'
import type { Room, Player } from '~/types/game'

interface GameAdminProps {
  room: Room
}

export function GameAdmin({ room }: GameAdminProps) {
  const { playAudio } = useAudioPlayer()
  const [currentRoom, setCurrentRoom] = useState(room)
  const [isDrawing, setIsDrawing] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showBingoCheck, setShowBingoCheck] = useState(false)
  const [playerMarkedNumbers, setPlayerMarkedNumbers] = useState<Set<number>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isRouletteSpinning, setIsRouletteSpinning] = useState(false)
  const [rouletteNumber, setRouletteNumber] = useState<number | null>(null)
  const [isVerifyingBingo, setIsVerifyingBingo] = useState(false)
  const [showBingoResult, setShowBingoResult] = useState(false)
  const [bingoResult, setBingoResult] = useState<{
    result: 'win' | 'lose'
    playerName: string
    avatarConfig?: any
    phrase: string
  } | null>(null)
  const [showEndGameConfirmation, setShowEndGameConfirmation] = useState(false)
  const [showBackToWaitingConfirmation, setShowBackToWaitingConfirmation] = useState(false)
  const [isMarkingDrawnNumbers, setIsMarkingDrawnNumbers] = useState(false)
  const [bingoClaims, setBingoClaims] = useState<
    { claimId: number; playerId: number; name: string; avatarConfig?: any; status: 'pending' | 'win' | 'lose'; createdAt?: string; resultPhrase?: string | null }[]
  >([])
  const [bingoChannel, setBingoChannel] = useState<any>(null)
  const [showBingoClaimsModal, setShowBingoClaimsModal] = useState(false)

  useEffect(() => {
    loadPlayers()
  }, [])

  useEffect(() => {
    loadBingoClaims()
  }, [currentRoom.round])

  useEffect(() => {
    const roomSubscription = subscribeToRoomChanges()
    const playerSubscription = subscribeToPlayerChanges()

    return () => {
      roomSubscription?.unsubscribe()
      playerSubscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`bingo:${room.id}`)
      .on('broadcast', { event: 'bingo-claim' }, async (event) => {
        const payload = event.payload as { playerId: number; name: string; avatarConfig?: any; claimId: number; round?: number }
        if (payload.round && payload.round !== currentRoom.round) return
        await loadBingoClaims()
        toast.success(`${payload.name} chamou BINGO!`, {
          duration: 8000,
          className: 'bg-yellow-500 text-black font-bold text-lg border-4 border-yellow-600 shadow-2xl',
          style: {
            animation: 'pulse 2s infinite',
          },
          action: {
            label: 'Verificar',
            onClick: () => {
              const player = players.find(p => p.id === payload.playerId)
              if (player) handleCheckPlayerBingo(player)
            }
          },
          icon: '🎯',
        })
      })
      .on('broadcast', { event: 'bingo-result' }, async (event) => {
        await loadBingoClaims()
      })
      .subscribe()

    setBingoChannel(channel)
    return () => {
      channel.unsubscribe()
    }
  }, [room.id, players, currentRoom.round])

  const loadPlayers = async () => {
    const { data, error } = await supabase
      .from('player')
      .select('*')
      .eq('room_id', room.id)

    if (error) {
      toast.error('Erro ao carregar jogadores')
      return
    }

    setPlayers(data || [])
  }

  const loadBingoClaims = async () => {
    const { data, error } = await supabase
      .from('bingo_claims')
      .select(`
        *,
        player:player_id (
          id,
          name,
          avatar_config
        )
      `)
      .eq('room_id', room.id)
      .eq('round', currentRoom.round)
      .order('created_at', { ascending: true })

    if (error) {
      return
    }

    const claims = data?.map(claim => ({
      claimId: claim.id,
      playerId: claim.player_id,
      name: (claim.player as any)?.name || 'Unknown',
      avatarConfig: (claim.player as any)?.avatar_config,
      status: claim.status === 'confirmed' ? 'win' as const : claim.status === 'rejected' ? 'lose' as const : 'pending' as const,
      createdAt: claim.created_at,
      resultPhrase: claim.result_phrase
    })) || []

    setBingoClaims(claims.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }))
  }

  const subscribeToRoomChanges = () => {
    const channel = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room',
        filter: `id=eq.${room.id}`
      }, (payload) => {
        if (payload.new) {
          const updatedRoom = payload.new as Room
          const previousRound = currentRoom.round
          setCurrentRoom(updatedRoom)
          if (updatedRoom.round !== previousRound) {
            loadBingoClaims()
          }
        }
      })
      .subscribe()
    
    return channel
  }

  const subscribeToPlayerChanges = () => {
    const channel = supabase
      .channel(`players:${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player',
        filter: `room_id=eq.${room.id}`
      }, () => {
        loadPlayers()
      })
      .subscribe()
    
    return channel
  }

  const handleDrawNumber = async () => {
    if (isDrawing || currentRoom.drawn_numbers.length >= 90) return

    setIsDrawing(true)
    setIsRouletteSpinning(true)

    setTimeout(() => {
      setIsRouletteSpinning(false)
      setIsDrawing(false)
    }, 2000)

    try {
      const { data, error } = await supabase.functions.invoke('draw-number', {
        body: { roomId: room.id }
      })

      if (error) {
        toast.error('Erro ao sortear número')
        return
      }

      setRouletteNumber(data.number)
    } catch (error) {
      toast.error('Erro ao sortear número')
    }
  }

  const handleCheckPlayerBingo = async (player: Player) => {
    setSelectedPlayer(player)
    setPlayerMarkedNumbers(new Set())
    setIsVerifyingBingo(false)
    setShowBingoCheck(true)
  }

  const handlePlayerNumberClick = (number: number) => {
    setPlayerMarkedNumbers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(number)) {
        newSet.delete(number)
      } else {
        newSet.add(number)
      }
      return newSet
    })
  }

  const animateMarkDrawnNumbers = async () => {
    setIsMarkingDrawnNumbers(true)
    setPlayerMarkedNumbers(new Set())

    if (!selectedPlayer?.bingo_sheet || !Array.isArray(selectedPlayer.bingo_sheet)) {
      setIsMarkingDrawnNumbers(false)
      return
    }

    const sheet = selectedPlayer.bingo_sheet
    const drawnNumbers = currentRoom.drawn_numbers

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const number = sheet[row][col]
        
        if (drawnNumbers.includes(number)) {
          await new Promise(resolve => setTimeout(resolve, 500))
          setPlayerMarkedNumbers(prev => new Set([...prev, number]))
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsMarkingDrawnNumbers(false)
    setIsVerifyingBingo(true)
  }

  const handleConfirmBingo = async () => {
    if (!selectedPlayer) return

    const selectedPhrase = getRandomPhrase('win', room.code)
    const selectedAudio = getRandomAudio(room.code, 'win')

    markPhraseAsUsed(room.code, 'win', selectedPhrase)
    markAudioAsUsed(room.code, 'win', selectedAudio)

    try {
      playAudio(selectedAudio).catch(() => {
      })

      const playerClaims = bingoClaims.filter(c => c.playerId === selectedPlayer.id)
      const claim = playerClaims[playerClaims.length - 1]
      
      if (claim) {
        setBingoClaims(prev => prev.map(c => 
          c.claimId === claim.claimId 
            ? { ...c, status: 'win' as const, resultPhrase: selectedPhrase }
            : c
        ))

        const { error } = await supabase
          .from('bingo_claims')
          .update({
            status: 'confirmed',
            result_phrase: selectedPhrase,
            checked_at: new Date().toISOString()
          })
          .eq('id', claim.claimId)

        if (error) throw error
      }

      if (bingoChannel) {
        bingoChannel.send({
          type: 'broadcast',
          event: 'bingo-result',
          payload: {
            playerId: selectedPlayer.id,
            result: 'win',
            phrase: selectedPhrase,
            playerName: selectedPlayer.name,
            avatarConfig: selectedPlayer.avatar_config
          }
        })
      }

      setBingoResult({
        result: 'win',
        playerName: selectedPlayer.name,
        avatarConfig: selectedPlayer.avatar_config,
        phrase: selectedPhrase
      })
      setShowBingoResult(true)
      setShowBingoCheck(false)
      setSelectedPlayer(null)
    } catch (error) {
      toast.error('Erro ao confirmar bingo')
    }
  }

  const handleNotBingo = async () => {
    if (!selectedPlayer) return

    const selectedPhrase = getRandomPhrase('lose', room.code)
    const selectedAudio = getRandomAudio(room.code, 'lose')

    markPhraseAsUsed(room.code, 'lose', selectedPhrase)
    markAudioAsUsed(room.code, 'lose', selectedAudio)

    try {
      playAudio(selectedAudio).catch(() => {
      })

      const playerClaims = bingoClaims.filter(c => c.playerId === selectedPlayer.id)
      const claim = playerClaims[playerClaims.length - 1]
      
      if (claim) {
        setBingoClaims(prev => prev.map(c => 
          c.claimId === claim.claimId 
            ? { ...c, status: 'lose' as const, resultPhrase: selectedPhrase }
            : c
        ))

        const { error } = await supabase
          .from('bingo_claims')
          .update({
            status: 'rejected',
            result_phrase: selectedPhrase,
            checked_at: new Date().toISOString()
          })
          .eq('id', claim.claimId)

        if (error) throw error
      }

      if (bingoChannel) {
        bingoChannel.send({
          type: 'broadcast',
          event: 'bingo-result',
          payload: {
            playerId: selectedPlayer.id,
            result: 'lose',
            phrase: selectedPhrase,
            playerName: selectedPlayer.name,
            avatarConfig: selectedPlayer.avatar_config
          }
        })
      }

      setBingoResult({
        result: 'lose',
        playerName: selectedPlayer.name,
        avatarConfig: selectedPlayer.avatar_config,
        phrase: selectedPhrase
      })
      setShowBingoResult(true)
      setShowBingoCheck(false)
      setSelectedPlayer(null)
    } catch (error) {
      toast.error('Erro ao rejeitar bingo')
    }
  }

  const checkBingoPattern = (markedNumbers: number[]): boolean => {
    if (!selectedPlayer?.bingo_sheet || !Array.isArray(selectedPlayer.bingo_sheet)) return false

    const sheet = selectedPlayer.bingo_sheet
    const markedSet = new Set(markedNumbers)

    for (let row = 0; row < 5; row++) {
      if (sheet[row].every(num => markedSet.has(num))) return true
    }

    for (let col = 0; col < 5; col++) {
      if (sheet.every(row => markedSet.has(row[col]))) return true
    }

    if (sheet.every((row, i) => markedSet.has(row[i]))) return true
    if (sheet.every((row, i) => markedSet.has(row[4 - i]))) return true

    return false
  }

  const handleBackToWaitingRoom = async () => {
    try {
      const { error } = await supabase
        .from('room')
        .update({ 
          status: 'waiting', 
          drawn_numbers: []
        })
        .eq('id', room.id)

      if (error) {
        toast.error('Erro ao voltar à sala de espera')
        return
      }

      toast.success('Voltando à sala de espera')
      
      window.location.href = `/room/${room.code}`
    } catch (error) {
      toast.error('Erro ao voltar à sala de espera')
    }
  }

  const handleEndGame = async () => {
    try {
      const { error } = await supabase
        .from('room')
        .update({ status: 'finished' })
        .eq('id', room.id)

      if (error) {
        toast.error('Erro ao finalizar jogo')
        return
      }

      toast.success('Jogo finalizado')
      
      localStorage.removeItem(`markedNumbers_${room.code}`)
      window.location.href = `/room/${room.code}/game-over`
    } catch (error) {
      toast.error('Erro ao finalizar jogo')
    }
  }

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBingoLetter = (number: number): string => {
    if (number >= 1 && number <= 18) return 'B'
    if (number >= 19 && number <= 36) return 'I'
    if (number >= 37 && number <= 54) return 'N'
    if (number >= 55 && number <= 72) return 'G'
    if (number >= 73 && number <= 90) return 'O'
    return ''
  }

  const getBingoLetterColor = (letter: string): string => {
    switch (letter) {
      case 'B': return 'text-blue-600'
      case 'I': return 'text-red-600'
      case 'N': return 'text-purple-600'
      case 'G': return 'text-green-600'
      case 'O': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const formatBingoNumber = (number: number): { letter: string; number: number; color: string } => {
    const letter = getBingoLetter(number)
    const color = getBingoLetterColor(letter)
    return { letter, number, color }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex">
      <div className="flex-1 flex flex-col">
        <header className="p-6 bg-white/10 backdrop-blur-sm text-white border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{room.name}</h1>
                <Badge className="bg-blue-500/80 text-white text-base px-3 py-1">
                  Rodada {currentRoom.round}
                </Badge>
              </div>
              <p className="text-blue-100">Modo Administrador</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm text-blue-100">Jogadores</div>
                <div className="text-2xl font-bold">{players.length}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">Sorteados</div>
                <div className="text-2xl font-bold">{currentRoom.drawn_numbers.length}/90</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBingoClaimsModal(true)}
                  className={`border-yellow-300 text-yellow-200 bg-yellow-500/10 hover:bg-yellow-500/20 ${bingoClaims.some(c => c.status === 'pending') ? 'animate-pulse' : ''}`}
                >
                  <Icon icon="material-symbols:campaign" className="mr-2" />
                  Bingos chamados
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Icon icon="material-symbols:group" className="mr-2" />
                      Jogadores ({players.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-96 bg-white/10 backdrop-blur-sm border-white/20 px-2">
                    <SheetHeader>
                      <SheetTitle className="text-white">Jogadores</SheetTitle>
                      <Input
                        placeholder="Buscar jogador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder:text-blue-100"
                      />
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {filteredPlayers.length === 0 ? (
                        <p className="text-center text-blue-100">Nenhum jogador encontrado</p>
                      ) : (
                        filteredPlayers.map((player, index) => (
                          <Card key={player.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  {player.avatar_config ? (
                                    <Avatar
                                      style={{ width: '40px', height: '40px' }}
                                      {...player.avatar_config}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                      {player.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-bold text-white">{player.name}</h3>
                                    <p className="text-sm text-blue-100">Jogador #{index + 1}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="bg-white/20 text-white">
                                  Ativo
                                </Badge>
                                {bingoClaims.some(c => c.playerId === player.id && c.status === 'pending') && (
                                  <Badge className="bg-yellow-500/80 text-black ml-2">
                                    <Icon icon="material-symbols:campaign" className="mr-1" />
                                    Bingo!
                                  </Badge>
                                )}
                              </div>
                              <Button
                                onClick={() => handleCheckPlayerBingo(player)}
                                size="sm"
                                variant="outline"
                                className="w-full border-white/30 text-white hover:bg-white/10"
                                disabled={!bingoClaims.some(c => c.playerId === player.id)}
                              >
                                <Icon icon="material-symbols:visibility" className="mr-2" />
                                {bingoClaims.some(c => c.playerId === player.id) ? 'Verificar Bingo' : 'Verificar Bingo'}
                              </Button>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
                <Button
                  onClick={() => setShowBackToWaitingConfirmation(true)}
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Icon icon="material-symbols:refresh" className="mr-2" />
                  Nova Rodada
                </Button>
                <Button
                  onClick={() => setShowEndGameConfirmation(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Icon icon="material-symbols:stop" className="mr-2" />
                  Finalizar Jogo
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">Roleta de Números</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <motion.div
                  key={isRouletteSpinning ? 'spinning' : 'stopped'}
                  className="text-8xl font-bold text-white bg-white/20 rounded-2xl p-8 inline-block min-w-[200px]"
                  animate={isRouletteSpinning ? { 
                    scale: [1, 1.1, 1],
                    rotate: [0, 360, 0]
                  } : { rotate: 0 }}
                  transition={isRouletteSpinning ? {
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  {rouletteNumber ? (
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold text-white/80">
                        {getBingoLetter(rouletteNumber)}
                      </span>
                      <span className="text-8xl font-bold text-white">
                        {rouletteNumber}
                      </span>
                    </div>
                  ) : (
                    '?'
                  )}
                </motion.div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleDrawNumber}
                  disabled={isDrawing || currentRoom.drawn_numbers.length >= 90}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-8 py-4"
                >
                  <Icon icon="material-symbols:casino" className="mr-2 text-2xl" />
                  {isDrawing ? 'Girando...' : 'Sortear Número'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-6 flex-1">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white">Números Sorteados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-20 gap-2 max-h-96 overflow-y-auto">
                {(() => {
                  const sortedNumbers = [...currentRoom.drawn_numbers].sort((a, b) => a - b)
                  const lastThreeNumbers = new Set(currentRoom.drawn_numbers.slice(-3))
                  return sortedNumbers.map(num => {
                    const bingoInfo = formatBingoNumber(num)
                    const isLastThree = lastThreeNumbers.has(num)
                    return (
                      <motion.div
                        key={num}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20
                        }}
                        className={`rounded-full flex flex-col items-center justify-center font-bold text-xs border-2 transition-all ${
                          isLastThree 
                            ? 'bg-blue-500 text-white border-blue-300 ring-offset-1 w-14 h-14' 
                            : 'bg-white w-12 h-12 border-gray-200'
                        }`}
                      >
                        <span className={`font-bold ${isLastThree ? 'text-white text-sm' : `text-xs ${bingoInfo.color}`}`}>
                          {bingoInfo.letter}
                        </span>
                        <span className={isLastThree ? 'text-white text-sm' : 'text-blue-500 text-xs'}>
                          {bingoInfo.number}
                        </span>
                      </motion.div>
                    )
                  })
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showBingoResult && bingoResult && (
        <BingoResult
          result={bingoResult.result}
          playerName={bingoResult.playerName}
          avatarConfig={bingoResult.avatarConfig}
          phrase={bingoResult.phrase}
          onClose={() => {
            setShowBingoResult(false)
            setBingoResult(null)
          }}
        />
      )}

      <Dialog open={showBingoCheck && !showBingoResult} onOpenChange={setShowBingoCheck}>
        <DialogContent className="w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Verificar Bingo - {selectedPlayer?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                {selectedPlayer?.avatar_config ? (
                  <Avatar
                    style={{ width: '56px', height: '56px' }}
                    {...selectedPlayer.avatar_config}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xl">
                    {selectedPlayer?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedPlayer?.name}</h3>
                  <p className="text-sm text-gray-600">
                    Jogador #
                    {selectedPlayer
                      ? players.findIndex((p) => p.id === selectedPlayer.id) + 1
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Números Marcados:</span> {playerMarkedNumbers.size}
                </div>
                <div>
                  <span className="font-medium">Total de Números Sorteados:</span>{' '}
                  {currentRoom.drawn_numbers.length}
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex gap-6">
                <div className="flex-1">
                  <BingoSheet
                    numbers={selectedPlayer?.bingo_sheet && Array.isArray(selectedPlayer.bingo_sheet) ? selectedPlayer.bingo_sheet : []}
                    markedNumbers={Array.from(playerMarkedNumbers)}
                    onNumberClick={isVerifyingBingo ? handlePlayerNumberClick : undefined}
                    readOnly={!isVerifyingBingo}
                    className="bg-white p-6 rounded-lg"
                    isAdminMode={true}
                  />
                </div>
                
                <div className="w-1/3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Números Sorteados ({currentRoom.drawn_numbers.length})</h4>
                  <div className="grid grid-cols-6 gap-1 max-h-80 overflow-y-auto">
                    {currentRoom.drawn_numbers
                      .sort((a, b) => a - b) 
                      .map(num => {
                        const bingoInfo = formatBingoNumber(num)
                        return (
                          <div
                            key={num}
                            className={`min-w-8 min-h-8 rounded-full flex flex-col items-center justify-center text-xs font-bold text-white aspect-square ${
                              playerMarkedNumbers.has(num) ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          >
                            <span className="text-[clamp(0.5rem,2.5vw,1rem)] font-bold leading-none">
                              {bingoInfo.letter}
                            </span>
                            <span className="text-[clamp(0.625rem,3vw,1.25rem)] leading-none">
                              {bingoInfo.number}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                  {currentRoom.drawn_numbers.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-2">Nenhum número sorteado ainda</p>
                  )}
                </div>
              </div>
            </div>
            
            {!isVerifyingBingo ? (                
                <div className="flex justify-center">
                  <Button
                    onClick={animateMarkDrawnNumbers}
                    disabled={isMarkingDrawnNumbers}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Icon icon="material-symbols:check-circle" className="mr-2" />
                    {isMarkingDrawnNumbers ? 'Marcando números...' : 'Marcar Números Sorteados'}
                  </Button>
                </div>
            ) : (
              <div className="space-y-4">                
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setIsVerifyingBingo(false)}
                    variant="outline"
                    size="lg"
                  >
                    <Icon icon="material-symbols:arrow-back" className="mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleConfirmBingo}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Icon icon="material-symbols:celebration" className="mr-2" />
                    Confirmar Bingo
                  </Button>
                  <Button
                    onClick={handleNotBingo}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Icon icon="material-symbols:close" className="mr-2" />
                    Não é Bingo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={showBackToWaitingConfirmation}
        onOpenChange={setShowBackToWaitingConfirmation}
        title="Voltar à Sala de Espera"
        description="Tem certeza que deseja voltar à sala de espera para iniciar uma nova rodada? A rodada atual será finalizada, os números sorteados serão limpos e os jogadores poderão gerar novas cartelas. A rodada será incrementada automaticamente."
        confirmText="Voltar e Iniciar Nova Rodada"
        onConfirm={handleBackToWaitingRoom}
        variant="default"
      />

      <ConfirmationModal
        open={showEndGameConfirmation}
        onOpenChange={setShowEndGameConfirmation}
        title="Finalizar Jogo"
        description="Tem certeza que deseja finalizar o jogo? Esta ação não pode ser desfeita."
        confirmText="Finalizar"
        onConfirm={handleEndGame}
        variant="destructive"
      />

      <Dialog open={showBingoClaimsModal} onOpenChange={setShowBingoClaimsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Icon icon="material-symbols:campaign" className="text-yellow-500" />
              Bingos Chamados - Rodada {currentRoom.round}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {bingoClaims.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum bingo chamado ainda nesta rodada</p>
            ) : (
              bingoClaims.map((claim, index) => (
                <Card key={claim.claimId} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold text-lg border-2 border-yellow-500/40">
                            #{index + 1}
                          </div>
                        </div>
                        {claim.avatarConfig ? (
                          <Avatar
                            style={{ width: '48px', height: '48px' }}
                            {...claim.avatarConfig}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                            {claim.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-blue-500 text-lg">{claim.name}</h3>
                          {claim.createdAt && (
                            <p className="text-sm text-blue-400">
                              Chamado às {new Date(claim.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {claim.resultPhrase && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              "{claim.resultPhrase}"
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {claim.status === 'pending' && (
                            <Badge className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/40">
                              Aguardando
                            </Badge>
                          )}
                          {claim.status === 'win' && (
                            <Badge className="bg-green-500/20 text-green-500 border border-green-500/40">
                              Confirmado
                            </Badge>
                          )}
                          {claim.status === 'lose' && (
                            <Badge className="bg-red-500/20 text-red-500 border border-red-400/40">
                              Rejeitado
                            </Badge>
                          )}
                        </div>
                      </div>
                      {claim.status === 'pending' && (
                        <Button
                          onClick={() => {
                            const player = players.find(p => p.id === claim.playerId)
                            if (player) {
                              handleCheckPlayerBingo(player)
                              setShowBingoClaimsModal(false)
                            }
                          }}
                          size="sm"
                          className="ml-4 bg-blue-600 hover:bg-blue-700"
                        >
                          <Icon icon="material-symbols:visibility" className="mr-2" />
                          Verificar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 