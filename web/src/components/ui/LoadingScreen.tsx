import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const LoadingScreen = () => {
  const { progress, active } = useProgress()
  const [shouldShow, setShouldShow] = useState(true)

  useEffect(() => {
    // Safety timeout: If it takes more than 5 seconds, hide it anyway
    const safetyTimer = setTimeout(() => {
      setShouldShow(false)
    }, 5000)

    if (progress === 100 && !active) {
      const timer = setTimeout(() => setShouldShow(false), 800)
      return () => {
        clearTimeout(timer)
        clearTimeout(safetyTimer)
      }
    }
    return () => clearTimeout(safetyTimer)
  }, [progress, active])

  if (!shouldShow) return null

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#111827]"
        >
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-sky-400/25 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-300/20 blur-[120px] rounded-full animate-pulse delay-700" />
          </div>

          <div className="relative flex flex-col items-center">
            {/* Logo/Icon placeholder */}
            <motion.div
              animate={{ 
                rotateY: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-20 h-20 border-2 border-blue-500 rounded-lg flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-sm" />
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-white font-black text-4xl tracking-tighter mb-2"
            >
              RECONFIGURING<span className="text-blue-500">_</span>WORLD
            </motion.h1>
            
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-400 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 font-mono text-xs text-blue-400/60 uppercase tracking-widest"
            >
              {progress.toFixed(0)}% Synchronized
            </motion.div>
          </div>

          {/* HUD Accents */}
          <div className="absolute top-10 left-10 border-l border-t border-blue-500/30 w-12 h-12" />
          <div className="absolute top-10 right-10 border-r border-t border-blue-500/30 w-12 h-12" />
          <div className="absolute bottom-10 left-10 border-l border-b border-blue-500/30 w-12 h-12" />
          <div className="absolute bottom-10 right-10 border-r border-b border-blue-500/30 w-12 h-12" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoadingScreen
