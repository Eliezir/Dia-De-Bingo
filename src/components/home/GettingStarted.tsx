import { Button } from '~/components/ui/button'
import { Icon } from '@iconify/react'
import { motion } from 'motion/react'

export function GettingStarted() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        className="flex flex-col items-center"
      >
        <h2 className="text-2xl md:text-6xl font-bold mb-4 text-blue-500">É hora do BINGO!</h2>
        <p className="text-center text-blue-900 mb-8 text-lg">Escolha uma opção abaixo para começar a jogar</p>
      </motion.div>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl justify-center ">
        <motion.div
          className="flex-1 bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center"
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
        >
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Icon icon="mdi:plus" className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-blue-500">Criar Sala</h3>
          <p className="text-center text-gray-500 mb-4">
            Inicie um novo jogo de bingo e convide seus amigos para jogar juntos!
          </p>
          <Button className="w-full mb-4" size="lg">
            Criar Nova Sala
          </Button>
          <ul className="text-sm text-gray-400 text-left space-y-1 mt-2">
            <li>• Para os bingueiros de plantão</li>
            <li>• Defina as regras do jogo</li>
            <li>• Convide jogadores com um código de sala</li>
          </ul>
        </motion.div>
        <motion.div
          className="flex-1 bg-white rounded-xl border border-gray-200 p-8 flex flex-col items-center"
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
        >
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Icon icon="mdi:account-group-outline" className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-blue-500">Entrar em uma Sala</h3>
          <p className="text-center text-gray-500 mb-4">
            Digite o código da sala para entrar em uma partida existente
          </p>
          <Button className="w-full mb-4 !bg-blue-50 text-blue-500 hover:bg-blue-50 hover:text-blue-500" variant="ghost" size="lg">
            Entrar em uma Sala Existente
          </Button>
          <ul className="text-sm text-gray-400 text-left space-y-1 mt-2">
            <li>• Digite o código da sala</li>
            <li>• Jogue com seus amigos</li>
            <li>• Divirta-se!</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
} 