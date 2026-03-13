import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, MousePointer } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export default function PcTutorial() {
  const [isDesktop, setIsDesktop] = useState(false)
  const questDismissed = useAppStore((state) => state.questDismissed)
  const pcTutorialDismissed = useAppStore((state) => state.pcTutorialDismissed)
  const setPcTutorialDismissed = useAppStore((state) => state.setPcTutorialDismissed)

  useEffect(() => {
    setIsDesktop(!window.matchMedia('(pointer: coarse)').matches)
  }, [])

  if (!isDesktop || !questDismissed || pcTutorialDismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => setPcTutorialDismissed(true)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-sm w-full rounded-2xl border-2 border-sky-400/60 bg-slate-900/95 shadow-[0_0_40px_rgba(56,189,248,0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent" />
          <div className="relative p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-sky-400/80 mb-2">Keyboard & Mouse</div>
            <h2 className="text-lg font-black text-white mb-4">Controls</h2>
            <div className="space-y-4 text-sm text-white/80">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                  <Keyboard size={18} className="text-sky-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">WASD</div>
                  <div className="text-white/60">Move around</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                  <span className="text-sky-300 font-bold text-xs">SHIFT</span>
                </div>
                <div>
                  <div className="font-semibold text-white">Shift</div>
                  <div className="text-white/60">Sprint</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
                  <MousePointer size={18} className="text-sky-300" />
                </div>
                <div>
                  <div className="font-semibold text-white">Mouse</div>
                  <div className="text-white/60">Hold left click to look around · Click statues to open</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setPcTutorialDismissed(true)}
              className="mt-6 w-full py-3 rounded-xl font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
