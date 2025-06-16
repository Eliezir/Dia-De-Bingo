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
import { motion } from 'motion/react'

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleJoinRoom = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement room joining logic
      setOpen(false)
    } catch (error) {
      console.error('Error joining room:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full mb-4 hover:text-blue-500" variant="outline" size="lg">
          Entrar em uma Sala Existente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Entrar em uma Sala</DialogTitle>
          <DialogDescription>
            Digite o código da sala para entrar em uma partida existente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Código da Sala
            </Label>
            <Input
              id="code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="col-span-3"
              placeholder="Digite o código da sala"
              maxLength={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleJoinRoom}
            disabled={isLoading || !roomCode.trim()}
          >
            {isLoading ? 'Entrando...' : 'Entrar na Sala'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 