import { Icon } from '@iconify/react';
import { useAuth } from '~/lib/auth/auth-context'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { UserMenu } from '~/components/auth/UserMenu'


export function HomeHero() {
  const { user, loading } = useAuth()

  const underlineVariants = {
    rest: { height: "2px" },
    hover: { height: "100%", borderRadius: "2px" }
  };

  return (
    <div className="relative flex flex-col md:flex-row items-center justify-center h-screen bg-gradient-to-br from-[#3c95f1] to-[#c3def9] overflow-hidden">
      <nav className="absolute top-0 z-50 w-full">
        <div className="container mx-auto px-4 py-3 flex justify-end items-center">
          {!loading && (
            <div className="flex items-center space-x-4">
              {user ? (
                <UserMenu />
              ) : (
                <motion.div
                  className="relative inline-block group"
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                >
                  <Link to="/login" className="relative block text-white font-semibold py-2 px-4 z-10 group-hover:text-[#7bb6f6] transition-all duration-300">
                    Login
                  </Link>
                  <motion.div
                    variants={underlineVariants}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="absolute bottom-0 left-0 w-full bg-white"
                    style={{ zIndex: 0 }}
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </nav>

      <div
        className="pointer-events-none absolute right-0 bottom-0 md:top-1/2 md:left-1/2 w-full h-2/3 md:w-2/3 md:h-2/3 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent 32px)',
          backgroundPosition: 'center',
        }}
      />
      <div className='flex flex-col md:flex-row items-center justify-center max-w-9xl mx-auto'>
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 md:px-16 py-8 space-y-6">
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold text-white leading-tight text-shadow-sm text-balance text-center">
            Bem-vindo, hoje é dia de <br />
            <span className="font-bold text-shadow-lg text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-blue-500 block text-center mx-auto">
              BINGO!
            </span>
          </h1>
          <div className="flex flex-col justify-center items-center gap-4 mt-4 w-full [&>*]:w-1/3"></div>
        </div>
        <img
          src="/bingo.png"
          alt="Mascote do Bingo"
          className="w-96 md:w-128 drop-shadow-2xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <a
        href="#getting-started"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center group"
        aria-label="Scroll to getting started"
      >
        <span className="animate-bounce">
          <Icon icon="material-symbols:arrow-circle-down-rounded" className="w-10 h-10 text-white drop-shadow-lg transition" />
        </span>
        <span className="sr-only">Scroll down</span>
      </a>
    </div>
  );
} 