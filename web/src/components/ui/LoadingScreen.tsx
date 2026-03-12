import { useProgress } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAppStore } from '../../store/appStore'

const LoadingScreen = () => {
  const { progress, active } = useProgress()
  const mode = useAppStore((state) => state.mode)
  const isLoaded = useAppStore((state) => state.isLoaded)
  const setIsLoaded = useAppStore((state) => state.setIsLoaded)
  const [shouldShow, setShouldShow] = useState(!isLoaded)
  const [bootStartedAt, setBootStartedAt] = useState(() => performance.now())
  const safeProgress = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : (active ? 0 : 100)))

  useEffect(() => {
    if (isLoaded) {
      setShouldShow(false)
      return
    }
    setBootStartedAt(performance.now())
    setShouldShow(true)
  }, [isLoaded, mode])

  useEffect(() => {
    if (isLoaded) return

    const isGameMode = mode === 'game'
    const elapsed = performance.now() - bootStartedAt
    const minVisibleMs = 1200
    const maxWaitMs = 8000
    const sceneReady = safeProgress >= 99 || !active
    const forcedReady = elapsed >= maxWaitMs
    const canComplete = isGameMode ? (sceneReady || forcedReady) : true
    if (!canComplete) return

    const waitMs = Math.max(0, minVisibleMs - elapsed)

    const timer = window.setTimeout(() => {
      setIsLoaded(true)
      setShouldShow(false)
    }, waitMs + 350)

    return () => window.clearTimeout(timer)
  }, [safeProgress, active, mode, isLoaded, setIsLoaded, bootStartedAt])

  if (!shouldShow) return null

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#040815]"
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-[15%] -left-[10%] w-[60%] h-[60%] bg-sky-400/25 blur-[120px] rounded-full"
            />
            <motion.div
              animate={{ x: [0, -45, 0], y: [0, 20, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-300/20 blur-[120px] rounded-full"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
          </div>

          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 7, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="relative w-28 h-28 mb-8"
            >
              <div className="absolute inset-0 rounded-full border border-sky-300/40 shadow-[0_0_30px_rgba(56,189,248,0.4)]" />
              <div className="absolute inset-3 rounded-full border border-violet-300/35" />
              <div className="absolute inset-6 rounded-full border border-cyan-200/45" />
              <div className="absolute inset-[38%] rounded-full bg-sky-300/85 shadow-[0_0_18px_rgba(125,211,252,0.9)]" />
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-white font-black text-3xl sm:text-4xl tracking-tighter mb-2"
            >
              CONSTRUCTING<span className="text-blue-500">_</span>SCENE
            </motion.h1>
            <p className="text-[11px] uppercase tracking-[0.25em] text-sky-200/70 font-mono mb-5">
              {mode === 'game' ? 'Loading assets, models, and shaders...' : 'Preparing interface...'}
            </p>
            
            <div className="w-72 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-300 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${mode === 'game' ? safeProgress : 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 font-mono text-xs text-blue-300/70 uppercase tracking-widest"
            >
              {(mode === 'game' ? safeProgress : 100).toFixed(0)}% synchronized
            </motion.div>
          </div>

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
