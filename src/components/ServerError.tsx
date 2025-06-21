import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Icon } from '@iconify/react'

export function ServerError() {
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
    { left: '10%' },
    { left: '20%' },
    { left: '30%' },
    { left: '40%' },
    { left: '50%' },
    { left: '60%' },
    { left: '70%' },
    { left: '80%' },
    { left: '90%' },
    { left: '15%' },
    { left: '25%' },
    { left: '35%' },
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
            className="absolute w-3 h-3 bg-white rounded-full opacity-30"
            animate={{
              y: [-50, 1000],
              x: [0, (i % 3 === 0 ? 20 : i % 3 === 1 ? -20 : 0)],
            }}
            transition={{
              duration: 4 + (i * 0.3),
              repeat: Infinity,
              delay: i * 0.4,
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
            5
          </motion.div>
          <motion.div
            className="flex items-center justify-center"
            variants={numberVariants}
            transition={{ delay: 0.1 }}
          >
            <img 
              src="/error-500/icon.png" 
              alt="0" 
              className="w-24 h-24 md:w-32 md:h-32 drop-shadow-lg"
            />
          </motion.div>
          <motion.div
            className="text-8xl md:text-9xl font-bold text-white drop-shadow-lg"
            variants={numberVariants}
            transition={{ delay: 0.2 }}
          >
            0
          </motion.div>
        </motion.div>

        <motion.div className="max-w-2xl mb-8" variants={itemVariants}>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Ops! Algo deu errado no servidor
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-6 leading-relaxed">
            Parece que o nosso gerador de números do bingo está com problemas técnicos. 
            Nossa equipe já foi notificada e está trabalhando para resolver!
          </p>
        </motion.div>

        <motion.div 
          className="mb-8 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
          variants={itemVariants}
        >
          <img 
            src="/error-500/image.svg" 
            alt="Ilustração de Erro do Servidor" 
            className="w-64 h-64 md:w-72 md:h-72 mx-auto"
          />
          <p className="mt-4 text-sm text-white">
            Estamos com um problema técnico, mas já estamos trabalhando nisso!
          </p>
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-4" variants={itemVariants}>
          <motion.button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon icon="material-symbols:refresh" />
            Tentar Novamente
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
            <Icon icon="material-symbols:engineering" className="inline mr-2 text-yellow-300" />
            <strong>Status:</strong> Nossa equipe técnica está trabalhando para resolver o problema o mais rápido possível!
          </p>
        </motion.div>

        <motion.div 
          className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 max-w-md"
          variants={itemVariants}
        >
          <p className="text-sm text-white">
            <Icon icon="material-symbols:support-agent" className="inline mr-2 text-green-300" />
            Se o problema persistir, entre em contato conosco
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
} 