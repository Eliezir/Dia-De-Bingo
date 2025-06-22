import { motion } from 'framer-motion'
import { cn } from '~/lib/utils'

interface BingoSheetProps {
  numbers: number[][]
  markedNumbers?: number[]
  onNumberClick?: (number: number) => void
  readOnly?: boolean
  className?: string
  isAdminMode?: boolean
}

export const BingoSheet = ({
  numbers,
  markedNumbers = [],
  onNumberClick,
  readOnly = false,
  className,
  isAdminMode = false
}: BingoSheetProps) => {
  const headers = ['B', 'I', 'N', 'G', 'O']

  // Ensure numbers is always an array
  const safeNumbers = Array.isArray(numbers) ? numbers : []

  const handleCellClick = (number: number) => {
    if (!readOnly && onNumberClick) {
      onNumberClick(number)
    }
  }

  const isNumberMarked = (number: number) => {
    return markedNumbers.includes(number)
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Headers */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {headers.map((header, index) => (
          <motion.div
            key={header}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className={cn('text-lg font-bold text-primary bg-primary/10 rounded-lg py-2', {
              'bg-blue-300 text-white border-blue-300 shadow-lg': isAdminMode,
              'bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400': !isAdminMode,
              'bg-white/10 backdrop-blur-sm border-white/30 text-white hover:border-white/50': !isAdminMode
            })}>
              {header}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-2">
        {safeNumbers.map((row, rowIndex) =>
          row.map((number, colIndex) => {
            const isMarked = isNumberMarked(number)

            return (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: (rowIndex * 5 + colIndex) * 0.05,
                  type: 'spring',
                  stiffness: 200
                }}
                whileHover={!readOnly ? { scale: 1.05 } : {}}
                whileTap={!readOnly ? { scale: 0.95 } : {}}
                onClick={() => handleCellClick(number)}
                disabled={readOnly}
                className={cn(
                  'aspect-square rounded-lg border-2 font-bold text-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
                  {
                    'cursor-pointer': !readOnly,
                    'cursor-default': readOnly,
                    'bg-green-500 text-white border-green-400 shadow-lg': isMarked,
                    'bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-400': !isMarked && isAdminMode,
                    'bg-white/10 backdrop-blur-sm border-white/30 text-white hover:border-white/50': !isMarked && !isAdminMode
                  }
                )}
              >
                <span className="text-center select-none">{number}</span>
              </motion.button>
            )
          })
        )}
      </div>
    </div>
  )
} 