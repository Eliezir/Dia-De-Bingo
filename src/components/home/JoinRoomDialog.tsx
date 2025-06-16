import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type JoinStep = 'code' | 'name'

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageTimestamp, setImageTimestamp] = useState(Date.now())
  const [currentStep, setCurrentStep] = useState<JoinStep>('code')
  const [roomName, setRoomName] = useState('')

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setRoomCode('')
      setUserName('')
      setCurrentStep('code')
      setRoomName('')
      setImageTimestamp(Date.now())
    }
  }

  const handleValidateCode = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement room validation logic
      setCurrentStep('name')
    } catch (error) {
      console.error('Error validating room:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement room joining logic with userName
      setOpen(false)
    } catch (error) {
      console.error('Error joining room:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogTrigger asChild>
        <Button className="w-full mb-4 hover:text-blue-500" variant="outline" size="lg">
          Entrar em uma Sala Existente
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] md:w-[800px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col md:flex-row items-center">
          <div className="hidden md:flex w-1/2 rounded-l-lg p-8 flex-col items-center justify-center relative overflow-hidden">
            <img 
              src={`/join-room.svg?t=${imageTimestamp}`}
              alt="Join Room Illustration" 
              className="w-full h-auto"
            />
          </div>

          <div className="flex-1 p-8 sm:w-1/2">
            <AnimatePresence mode="wait">
              {currentStep === 'code' ? (
                <motion.div
                  key="code"
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">
                      Entrar em uma Sala
                    </DialogTitle>
                    <DialogDescription className="text-pretty">
                      Digite o código da sala para entrar em uma partida existente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="code">Código da Sala</Label>
                      <Input
                        id="code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Digite o código da sala"
                        maxLength={6}
                        autoFocus={false}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Como Funciona</Label>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-200 rounded-full" />
                          <span>Peça o código da sala para o anfitrião</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-200 rounded-full" />
                          <span>Digite o código de 6 dígitos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-200 rounded-full" />
                          <span>Entre e comece a jogar!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="submit"
                      onClick={handleValidateCode}
                      disabled={isLoading || roomCode.trim().length < 6}
                      className="w-full"
                    >
                      {isLoading ? 'Verificando...' : 'Verificar Código'}
                    </Button>
                  </DialogFooter>
                </motion.div>
              ) : (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">
                      Como devemos te chamar?
                    </DialogTitle>
                    <DialogDescription className="text-pretty">
                      Você está entrando na sala "{roomName}". Digite seu nome para continuar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Seu Nome</Label>
                      <Input
                        id="name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Digite seu nome"
                        autoFocus={false}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="submit"
                      onClick={handleJoinRoom}
                      disabled={isLoading || !userName.trim()}
                      className="w-full"
                    >
                      {isLoading ? 'Entrando...' : 'Entrar na Sala'}
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 