import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { supabase } from '~/lib/supabase/client'
import { BingoSheet } from './BingoSheet'
import { saveMarkedNumbersToStorage, getMarkedNumbersFromStorage } from '~/utils/playerStorage'
import type { Player, Room } from '~/types/game'

interface GamePlayerProps {
  room: Room
  currentPlayer: Player
}

export function GamePlayer({ room, currentPlayer }: GamePlayerProps) {
  const [currentRoom, setCurrentRoom] = useState(room)
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setCurrentRoom(room)
  }, [room])

  // Load marked numbers from localStorage on component mount
  useEffect(() => {
    if (room.code && currentPlayer.id) {
      const savedMarkedNumbers = getMarkedNumbersFromStorage(room.code, currentPlayer.id)
      console.log('Loading saved marked numbers for room', room.code, 'player', currentPlayer.id, ':', savedMarkedNumbers)
      setMarkedNumbers(new Set(savedMarkedNumbers))
      setIsInitialized(true)
    }
  }, [room.code, currentPlayer.id])

  // Save marked numbers to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (isInitialized && room.code && currentPlayer.id) {
      console.log('Saving marked numbers for room', room.code, 'player', currentPlayer.id, ':', Array.from(markedNumbers))
      saveMarkedNumbersToStorage(Array.from(markedNumbers), room.code, currentPlayer.id)
    }
  }, [markedNumbers, room.code, currentPlayer.id, isInitialized])

  useEffect(() => {
    // Listen to database changes in the room table
    const roomUpdateSubscription = supabase.channel(`game-player-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'room', filter: `id=eq.${room.id}` },
        (payload) => {
          const updatedRoom = payload.new as Room
          setCurrentRoom(updatedRoom)
          
          // Handle room status changes
          if (updatedRoom.status === 'waiting') {
            // Redirect to waiting room when admin goes back to waiting room
            window.location.href = `/room/${room.code}`
          } else if (updatedRoom.status === 'finished') {
            // Redirect to game over when game is finished
            window.location.href = `/room/${room.code}/game-over`
          }
          
          // Don't automatically mark numbers - let the user control their own marking
        }
      )
      .subscribe()
      
    return () => {
      roomUpdateSubscription.unsubscribe()
    }
  }, [room.id, room.code])

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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold">{room.name}</h1>
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
      
      {/* Main Content */}
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

      {/* Footer */}
      <footer className="p-4 bg-black/20">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Icon icon="material-symbols:casino" />
            <span className="font-medium">Jogo em andamento</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">Aguardando números</span>
          </div>
        </div>
      </footer>
    </div>
  )
} 