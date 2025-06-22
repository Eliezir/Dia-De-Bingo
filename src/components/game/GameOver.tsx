import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'

interface GameOverProps {
  roomName: string
  winner?: string
}

export function GameOver({ roomName, winner }: GameOverProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Icon icon="material-symbols:celebration" className="text-6xl text-yellow-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-white">Jogo Finalizado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-xl text-blue-100">Sala: {roomName}</p>
            {winner && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-lg font-semibold text-yellow-300">🏆 Vencedor: {winner}</p>
              </div>
            )}
            <p className="text-blue-100">
              {winner ? 'Parabéns ao vencedor!' : 'O jogo foi finalizado pelo administrador.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/">
                <Icon icon="material-symbols:home" className="mr-2" />
                Voltar ao Início
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/">
                <Icon icon="material-symbols:casino" className="mr-2" />
                Novo Jogo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 