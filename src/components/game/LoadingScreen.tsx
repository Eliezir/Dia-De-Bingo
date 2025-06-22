import { motion } from 'framer-motion'

export function LoadingScreen() {
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

  // Use stable positions to avoid hydration mismatch
  const particlePositions = [
    { left: '10%', top: '20%' },
    { left: '20%', top: '80%' },
    { left: '30%', top: '40%' },
    { left: '40%', top: '10%' },
    { left: '50%', top: '60%' },
    { left: '60%', top: '30%' },
    { left: '70%', top: '70%' },
    { left: '80%', top: '50%' },
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
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6">
            <motion.div
              className="w-full h-full border-4 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Carregando Sala...
          </h1>
          <p className="text-lg text-white/80 drop-shadow-md">
            Aguarde enquanto preparamos tudo para você
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
} 