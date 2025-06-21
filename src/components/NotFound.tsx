import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

export function NotFound() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
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

  const numberVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20
      }
    }
  }

  // Use stable positions to avoid hydration mismatch
  const particlePositions = [
    { left: '5%', top: '15%' },
    { left: '25%', top: '85%' },
    { left: '45%', top: '25%' },
    { left: '65%', top: '75%' },
    { left: '85%', top: '35%' },
    { left: '15%', top: '65%' },
    { left: '35%', top: '45%' },
    { left: '55%', top: '95%' },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#3c95f1] to-[#c3def9] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px)',
          backgroundPosition: 'center',
        }}
      />

      <div className="absolute inset-0 overflow-hidden">
        {particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-white rounded-full opacity-20"
            animate={{
              y: [0, -20, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              delay: i * 0.3,
            }}
            style={pos}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex items-center justify-center gap-4 mb-8" variants={itemVariants}>
          <motion.div
            className="text-8xl md:text-9xl font-bold text-white drop-shadow-lg"
            variants={numberVariants}
          >
            4
          </motion.div>
          <motion.div
            className="flex items-center justify-center"
            variants={numberVariants}
            transition={{ delay: 0.1 }}
          >
            <div className="overflow-hidden">
              <img
                src="/404.png"
                alt="404"
                className="w-24 h-24 md:w-32 md:h-32"
              />
            </div>
          </motion.div>
          <motion.div
            className="text-8xl md:text-9xl font-bold text-white drop-shadow-lg"
            variants={numberVariants}
            transition={{ delay: 0.2 }}
          >
            4
          </motion.div>
        </motion.div>

        <motion.div className="max-w-2xl mb-8" variants={itemVariants}>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Ops! Número não encontrado
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-6 leading-relaxed">
            Parece que este número não está na nossa cartela de bingo.
            Que tal tentarmos um número diferente?
          </p>
        </motion.div>

        <motion.div
          className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
          variants={itemVariants}
        >
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-8 h-8 md:w-12 md:h-12 bg-white/20 rounded-lg flex items-center justify-center text-sm md:text-base font-bold text-white"
                whileHover={{ scale: 1.1 }}
                transition={{ delay: i * 0.02 }}
              >
                {i === 12 ? (
                  <Icon icon="material-symbols:star" className="text-yellow-300" />
                ) : (
                  ((i % 5) * 15) + Math.floor(i / 5) + 1
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-white">
            Nossa cartela tem 25 números, mas este não é um deles!
          </p>
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
          <motion.button
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon="material-symbols:arrow-back" />
            Voltar
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/"
              className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-all duration-300 flex items-center gap-2"
            >
              <Icon icon="material-symbols:home" />
              Ir para o Início
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 max-w-md"
          variants={itemVariants}
        >
          <p className="text-sm text-white">
            <Icon icon="material-symbols:lightbulb" className="inline mr-2 text-yellow-300" />
            <strong>Sabia?</strong> O bingo foi inventado na Itália em 1530 e chegou ao Brasil em 1960!
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
