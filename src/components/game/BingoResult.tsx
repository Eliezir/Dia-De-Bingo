import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'
import Avatar from 'react-nice-avatar'

interface BingoResultProps {
  result: 'win' | 'lose'
  playerName: string
  avatarConfig?: any
  phrase: string
  onClose?: () => void
}

export function BingoResult({ result, playerName, avatarConfig, phrase, onClose }: BingoResultProps) {
  const isWin = result === 'win'
  const bgColor = isWin ? 'bg-green-500/95' : 'bg-red-500/95'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`fixed inset-0 ${bgColor} backdrop-blur-sm flex items-center justify-center z-[100]`}
      onClick={onClose}
    >
      <motion.div 
        className="text-center w-full h-full flex flex-col items-center justify-center p-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Avatar + Name */}
        <motion.div
          className="flex flex-col items-center gap-3 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {avatarConfig ? (
            <Avatar
              style={{ width: '80px', height: '80px' }}
              {...avatarConfig}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-3xl">
              {playerName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <p className="text-2xl md:text-3xl text-white font-semibold">
            {playerName}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isWin ? (
            <Icon icon="material-symbols:celebration" className="text-9xl md:text-[12rem] text-white mb-8 mx-auto" />
          ) : (
            <Icon icon="material-symbols:close" className="text-9xl md:text-[12rem] text-white mb-8 mx-auto" />
          )}
        </motion.div>
        <motion.h2 
          className="text-7xl md:text-9xl font-bold text-white mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {isWin ? 'BINGO!' : 'NÃO É BINGO'}
        </motion.h2>
        <motion.p 
          className="text-2xl md:text-4xl text-white mb-4 font-semibold max-w-3xl px-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {phrase}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

