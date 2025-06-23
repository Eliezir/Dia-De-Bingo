import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
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
    // Check if there's a valid bingo pattern
    const hasBingo = checkBingoPattern(Array.from(playerMarkedNumbers))
    
    if (hasBingo) {
      setShowWinAnimation(true)
      
      // Auto-close after animation
      setTimeout(() => {
        setShowWinAnimation(false)
        setShowBingoCheck(false)
      }, 3000)
    } else {
      setShowLoseAnimation(true)
      
      // Auto-close after animation
      setTimeout(() => {
        setShowLoseAnimation(false)
      }, 2000)
    }
  }

  const handleNotBingo = () => {
    setShowLoseAnimation(true)
    
    // Auto-close after animation
    setTimeout(() => {
      setShowLoseAnimation(false)
      setShowBingoCheck(false)
    }, 2000)
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
          drawn_numbers: [],
          round: currentRoom.round + 1 // Increment round for new game
        })
        .eq('id', room.id)

      if (error) {
        toast.error('Erro ao voltar à sala de espera')
        return
      }

      toast.success('Jogadores redirecionados para a sala de espera')
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-6 bg-white/10 backdrop-blur-sm text-white border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{room.name}</h1>
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
                                <div>
                                  <h3 className="font-bold text-white">{player.name}</h3>
                                  <p className="text-sm text-blue-100">Jogador #{index + 1}</p>
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
                  <Icon icon="material-symbols:arrow-back" className="mr-2" />
                  Voltar à Sala
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
                  {rouletteNumber || '?'}
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
                {currentRoom.drawn_numbers.map(num => (
                  <motion.div
                    key={num}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-blue-500"
                  >
                    {num}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bingo Check Dialog */}
      <Dialog open={showBingoCheck} onOpenChange={setShowBingoCheck}>
        <DialogContent className="w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Verificar Bingo - {selectedPlayer?.name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Win Animation */}
          {showWinAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-green-500/90 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div 
                className="text-center p-12 bg-white rounded-3xl border border-green-300 shadow-2xl"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Icon icon="material-symbols:celebration" className="text-8xl text-green-600 mb-6 mx-auto" />
                <h2 className="text-6xl font-bold text-green-600 mb-4">BINGO!</h2>
                <p className="text-2xl text-gray-700 mb-4">{selectedPlayer?.name} venceu! 🎉</p>
                <p className="text-lg text-gray-600">Parabéns pelo bingo!</p>
              </motion.div>
            </motion.div>
          )}

          {/* Lose Animation */}
          {showLoseAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div 
                className="text-center p-12 bg-white rounded-3xl border border-red-300 shadow-2xl"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Icon icon="material-symbols:close" className="text-8xl text-red-600 mb-6 mx-auto" />
                <h2 className="text-6xl font-bold text-red-600 mb-4">NÃO É BINGO</h2>
                <p className="text-2xl text-gray-700 mb-4">Verificação negada</p>
                <p className="text-lg text-gray-600">Continue verificando outros jogadores</p>
              </motion.div>
            </motion.div>
          )}
          
          <div className="space-y-6">
            {/* Player Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Informações do Jogador</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nome:</span> {selectedPlayer?.name}
                </div>
                <div>
                  <span className="font-medium">Números Marcados:</span> {playerMarkedNumbers.size}
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
                    <div className="grid grid-cols-8 gap-1 max-h-80 overflow-y-auto">
                      {currentRoom.drawn_numbers
                        .sort((a, b) => a - b) 
                        .map(num => (
                          <div
                            key={num}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              playerMarkedNumbers.has(num) ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          >
                            {num}
                          </div>
                        ))}
                    </div>
                    {currentRoom.drawn_numbers.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-2">Nenhum número sorteado ainda</p>
                    )}
                  </div>
              </div>
            </div>
            
            {/* Verification Steps */}
            {!isVerifyingBingo ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Passo 1: Visualização</h4>
                  <p className="text-blue-700 text-sm">
                    Visualize a cartela do jogador acima. Use o botão para marcar automaticamente os números sorteados.
                  </p>
                </div>
                
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
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Passo 2: Verificação</h4>
                  <p className="text-yellow-700 text-sm">
                    Os números sorteados foram marcados. Verifique se há um bingo válido e confirme sua decisão.
                  </p>
                </div>
                
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
        description="Tem certeza que deseja voltar à sala de espera? O jogo será pausado e os jogadores poderão gerar novas cartelas."
        confirmText="Voltar à Sala"
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