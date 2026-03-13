import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star } from 'lucide-react'
import { useSounds } from '../../hooks/useSounds'

interface AchievementToastProps {
  message: string
  subtext?: string
  isBig?: boolean
  visible: boolean
  onComplete?: () => void
}

export default function AchievementToast({ message, subtext, isBig, visible, onComplete }: AchievementToastProps) {
  const { playAchievement } = useSounds()
  const prevVisible = useRef(false)

  useEffect(() => {
    if (visible && !prevVisible.current) {
      playAchievement(isBig)
    }
    prevVisible.current = visible
  }, [visible, isBig, playAchievement])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onAnimationComplete={() => onComplete?.()}
          className={`fixed left-1/2 -translate-x-1/2 z-[90] ${isBig ? 'top-1/4' : 'top-6'}`}
        >
          <motion.div
            className={`rounded-2xl border-2 shadow-2xl overflow-hidden ${
              isBig
                ? 'border-amber-400 bg-gradient-to-b from-amber-500/30 to-slate-900/95 shadow-amber-500/30 min-w-[320px]'
                : 'border-emerald-400/60 bg-slate-900/95 shadow-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <div
                className={`rounded-xl flex items-center justify-center shrink-0 ${
                  isBig ? 'w-14 h-14 bg-amber-500/30' : 'w-10 h-10 bg-emerald-500/30'
                }`}
              >
                {isBig ? (
                  <Star size={28} className="text-amber-400" fill="currentColor" />
                ) : (
                  <Trophy size={20} className="text-emerald-400" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/50">Achievement Unlocked</div>
                <div className={`font-black text-white ${isBig ? 'text-lg sm:text-xl' : 'text-sm'}`}>{message}</div>
                {subtext && <div className="text-xs text-white/60 mt-0.5">{subtext}</div>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
