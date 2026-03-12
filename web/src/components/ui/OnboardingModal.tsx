import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Gamepad2, MousePointer2, Play, LayoutTemplate } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

const OnboardingModal = () => {
  const isLoaded = useAppStore((state) => state.isLoaded)
  const mode = useAppStore((state) => state.mode)
  const setMode = useAppStore((state) => state.setMode)
  const [shownThisRun, setShownThisRun] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isLoaded && mode === 'normal' && !shownThisRun) {
      setShow(true)
      setShownThisRun(true)
    }
  }, [isLoaded, mode, shownThisRun])

  const handleClose = () => {
    setShow(false)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, y: 42, scale: 0.9, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          className="max-w-xl w-full engine-panel rounded-3xl p-6 sm:p-8 bg-engine-panel/90 shadow-2xl border-engine-accent overflow-hidden relative"
        >
          <motion.div
            className="absolute -top-16 -right-14 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"
            animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-16 -left-14 w-56 h-56 rounded-full bg-violet-400/20 blur-3xl pointer-events-none"
            animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-engine-accent tracking-tight uppercase italic">
              Quick Start
            </h2>
            <p className="text-[11px] text-engine-text-muted mt-2 uppercase tracking-[0.22em] font-mono">
              Pick a mode. Start in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-engine-bg border border-engine-border rounded-lg text-engine-accent shrink-0">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Two modes</h3>
                <p className="text-xs text-engine-text-muted">Play 3D or browse Normal.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-engine-bg border border-engine-border rounded-lg text-engine-accent shrink-0">
                <Gamepad2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Controls</h3>
                <p className="text-xs text-engine-text-muted">WASD + mouse + click statues.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-engine-bg border border-engine-border rounded-lg text-engine-accent shrink-0">
                <MousePointer2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Switch anytime</h3>
                <p className="text-xs text-engine-text-muted">Use top buttons to swap modes.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMode('normal')
                handleClose()
              }}
              className="w-full engine-button py-3 rounded-lg font-bold shadow-lg shadow-engine-accent/20 justify-center"
            >
              <LayoutTemplate size={16} />
              Normal Mode
            </button>
            <button
              onClick={() => {
                setMode('game')
                handleClose()
              }}
              className="w-full engine-button bg-emerald-500/25 border-emerald-300/50 hover:bg-emerald-400/30 py-3 rounded-lg font-bold shadow-lg shadow-emerald-500/20 justify-center"
            >
              <Play size={16} />
              Play Mode
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default OnboardingModal
