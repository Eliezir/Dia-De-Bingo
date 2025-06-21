import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useState } from 'react'
import { useAuth } from '~/lib/auth/auth-context'
import { useNavigate } from '@tanstack/react-router'

interface CreateRoomDialogProps {
  children: React.ReactNode
}

export function CreateRoomDialog({ children }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [imageTimestamp, setImageTimestamp] = useState(Date.now())

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setRoomName('')
      setImageTimestamp(Date.now())
    }
  }

  const DialogFormContent = () => {
    const { user } = useAuth()
    const navigate = useNavigate()

    const handleCreateRoom = async () => {
        if (!user) return
    
        setIsLoading(true)
        try {
          console.log('Creating room:', { name: roomName, userId: user.id })
          setOpen(false)
        } catch (error) {
          console.error('Error creating room:', error)
        } finally {
          setIsLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="flex-1 p-8 sm:w-1/2">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary">Acesso Restrito</DialogTitle>
                <DialogDescription className="text-pretty">
                  Para criar uma sala, você precisa estar conectado.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <p className="text-muted-foreground">
                  Faça login na sua conta para convidar seus amigos e começar a diversão!
                </p>
                <Button
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: '/login' });
                  }}
                  className="w-full"
                >
                  Ir para o Login
                </Button>
              </div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 sm:w-1/2">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-primary">Criar Nova Sala</DialogTitle>
                <DialogDescription className="text-pretty">
                    Inicie um novo jogo de bingo e convide seus amigos para jogar juntos!
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Sala</Label>
                    <Input
                        id="name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Digite o nome da sala"
                        autoFocus={false}
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Regras do Jogo</Label>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div  className="w-2 h-2 bg-blue-200 rounded-full" />
                            <span>Números de 1 a 90</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div  className="w-2 h-2 bg-blue-200 rounded-full" />
                            <span>Cartela com 25 números</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div  className="w-2 h-2 bg-blue-200 rounded-full" />
                            <span>Vitória em linha, coluna ou diagonal, você que decide!</span>
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter className="mt-6">
                <Button
                    type="submit"
                    onClick={handleCreateRoom}
                    disabled={isLoading || !roomName.trim()}
                    className="w-full"
                >
                    {isLoading ? 'Criando...' : 'Criar Sala'}
                </Button>
            </DialogFooter>
        </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      {children}
      <DialogContent className="w-[90%] md:w-[800px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex flex-col md:flex-row items-center">
          <div className="hidden md:flex w-1/2 rounded-l-lg p-8 flex-col items-center justify-center relative overflow-hidden">
            <img 
              src={`/create-room.svg?t=${imageTimestamp}`}
              alt="Create Room Illustration" 
              className="w-full h-auto"
            />
          </div>
          <DialogFormContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}