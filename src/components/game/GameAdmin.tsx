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
import type { Room, Player } from '~/types/game'

const frasesBingo = {
  vitoria: [
    '🎉 BINGO! Temos um vencedor(a)!',
    '🔥 EXPLODIU! Bingo confirmado!',
    '🏆 Parabéns! Você completou a cartela!',
    '💰 Alguém está com sorte hoje! BINGO!',
    '🎊 Uhuuu! A sorte sorriu para você!',
    '🚀 Direto para o pódio! BINGO!',
    '✨ Cartela cheia, coração feliz!',
    '🌟 Temos um mestre do Bingo entre nós!',
    '✅ Conferido e aprovado! É BINGO!',
    '🎈 A vitória chegou! Parabéns pelo Bingo!'
  ],
  erro: [
    '🤡 Alô, é do circo? Temos um palhaço gritando bingo errado!',
    '🛑 O VAR analisou e detectou: 100% de audácia e 0% de bingo.',
    '🤔 Marcou o número da Mega Sena na cartela errada, foi?',
    '🙈 Alguém traz um óculos para esse ser humano, por favor!',
    '🤏 Faltou isso aqui pra ser verdade... Mentira, faltou muito!',
    '🤣 O inimigo da vitória ataca novamente!',
    '🚩 Alarme falso! Voltem para seus lugares, nada para ver aqui.',
    '🕯️ O desespero é tanto que começou a inventar número!',
    '🤪 Tá ouvindo vozes ou só queria chamar atenção mesmo?'
  ]
} as const

interface GameAdminProps {
  room: Room
}

export function GameAdmin({ room }: GameAdminProps) {
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
  const [showWinAnimation, setShowWinAnimation] = useState(false)
  const [showLoseAnimation, setShowLoseAnimation] = useState(false)
  const [showEndGameConfirmation, setShowEndGameConfirmation] = useState(false)
  const [showBackToWaitingConfirmation, setShowBackToWaitingConfirmation] = useState(false)
  const [isMarkingDrawnNumbers, setIsMarkingDrawnNumbers] = useState(false)
  const [winPhrase, setWinPhrase] = useState<string | null>(null)
  const [errorPhrase, setErrorPhrase] = useState<string | null>(null)

  useEffect(() => {
    loadPlayers()
    const roomSubscription = subscribeToRoomChanges()
    const playerSubscription = subscribeToPlayerChanges()

    return () => {
      roomSubscription?.unsubscribe()
      playerSubscription?.unsubscribe()
    }
  }, [])

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
          setCurrentRoom(payload.new as Room)
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

    // Simulate roulette spinning
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

  const handleCheckPlayerBingo = (player: Player) => {
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

    // Animate checking all numbers on the sheet and mark the ones that were drawn
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const number = sheet[row][col]
        
        // Check if this number was drawn
        if (drawnNumbers.includes(number)) {
          // Mark this cell as verified with a delay for suspense
          await new Promise(resolve => setTimeout(resolve, 500))
          setPlayerMarkedNumbers(prev => new Set([...prev, number]))
        }
      }
    }

    // Wait a moment after all numbers are marked for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsMarkingDrawnNumbers(false)
    setIsVerifyingBingo(true)
  }

  const handleConfirmBingo = () => {
    const frases = frasesBingo.vitoria
    const random = frases[Math.floor(Math.random() * frases.length)]
    setWinPhrase(random)
    setShowWinAnimation(true)
  }

  const handleNotBingo = () => {
    const frases = frasesBingo.erro
    const random = frases[Math.floor(Math.random() * frases.length)]
    setErrorPhrase(random)
    setShowLoseAnimation(true)
  }

  const checkBingoPattern = (markedNumbers: number[]): boolean => {
    if (!selectedPlayer?.bingo_sheet || !Array.isArray(selectedPlayer.bingo_sheet)) return false

    const sheet = selectedPlayer.bingo_sheet
    const markedSet = new Set(markedNumbers)

    // Check horizontal lines
    for (let row = 0; row < 5; row++) {
      if (sheet[row].every(num => markedSet.has(num))) return true
    }

    // Check vertical lines
    for (let col = 0; col < 5; col++) {
      if (sheet.every(row => markedSet.has(row[col]))) return true
    }

    // Check diagonals
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

  // Get Bingo letter for a number based on traditional rules
  const getBingoLetter = (number: number): string => {
    if (number >= 1 && number <= 18) return 'B'
    if (number >= 19 && number <= 36) return 'I'
    if (number >= 37 && number <= 54) return 'N'
    if (number >= 55 && number <= 72) return 'G'
    if (number >= 73 && number <= 90) return 'O'
    return ''
  }

  // Get color for Bingo letter
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

  // Format number with Bingo letter
  const formatBingoNumber = (number: number): { letter: string; number: number; color: string } => {
    const letter = getBingoLetter(number)
    const color = getBingoLetterColor(letter)
    return { letter, number, color }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
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
                              </div>
                              <Button
                                onClick={() => handleCheckPlayerBingo(player)}
                                size="sm"
                                variant="outline"
                                className="w-full border-white/30 text-white hover:bg-white/10"
                              >
                                <Icon icon="material-symbols:visibility" className="mr-2" />
                                Verificar Bingo
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

        {/* Roulette Section */}
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

        {/* Drawn Numbers Section */}
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

      {/* Win Animation - Full Screen */}
      {showWinAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-green-500/95 backdrop-blur-sm flex items-center justify-center z-[100]"
          onClick={() => {
            setShowWinAnimation(false)
            setShowBingoCheck(false)
            setWinPhrase(null)
          }}
        >
          <motion.div 
            className="text-center w-full h-full flex flex-col items-center justify-center p-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Avatar + Nome */}
            <motion.div
              className="flex flex-col items-center gap-3 mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {selectedPlayer?.avatar_config ? (
                <Avatar
                  style={{ width: '80px', height: '80px' }}
                  {...(selectedPlayer as any).avatar_config}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl">
                  {selectedPlayer?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <p className="text-2xl md:text-3xl text-white font-semibold">
                {selectedPlayer?.name}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Icon icon="material-symbols:celebration" className="text-9xl md:text-[12rem] text-white mb-8 mx-auto" />
            </motion.div>
            <motion.h2 
              className="text-7xl md:text-9xl font-bold text-white mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              BINGO!
            </motion.h2>
            <motion.p 
              className="text-2xl md:text-4xl text-white mb-4 font-semibold max-w-3xl px-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {winPhrase || 'Parabéns pelo bingo!'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}

      {/* Lose Animation - Full Screen */}
      {showLoseAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-red-500/95 backdrop-blur-sm flex items-center justify-center z-[100]"
          onClick={() => {
            setShowLoseAnimation(false)
            setShowBingoCheck(false)
            setErrorPhrase(null)
          }}
        >
          <motion.div 
            className="text-center w-full h-full flex flex-col items-center justify-center p-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Avatar + Nome */}
            <motion.div
              className="flex flex-col items-center gap-3 mb-6"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {selectedPlayer?.avatar_config ? (
                <Avatar
                  style={{ width: '80px', height: '80px' }}
                  {...(selectedPlayer as any).avatar_config}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl">
                  {selectedPlayer?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <p className="text-2xl md:text-3xl text-white font-semibold">
                {selectedPlayer?.name}
              </p>
            </motion.div>
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Icon icon="material-symbols:close" className="text-9xl md:text-[12rem] text-white mb-8 mx-auto" />
            </motion.div>
            <motion.h2 
              className="text-7xl md:text-9xl font-bold text-white mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              NÃO É BINGO
            </motion.h2>
            <motion.p 
              className="text-2xl md:text-4xl text-white mb-4 font-semibold max-w-3xl px-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {errorPhrase || 'Verificação negada'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}

      {/* Bingo Check Dialog */}
      <Dialog open={showBingoCheck && !showWinAnimation && !showLoseAnimation} onOpenChange={setShowBingoCheck}>
        <DialogContent className="w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Verificar Bingo - {selectedPlayer?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Player Info */}
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
            
            {/* Bingo Sheet */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex gap-6">
                {/* Bingo Sheet */}
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
            
            {/* Verification Steps */}
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

      {/* Confirmation Modals */}
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
    </div>
  )
} 