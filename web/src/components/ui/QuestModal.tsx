import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export default function QuestModal() {
  const { questDismissed, setQuestDismissed } = useAppStore()

  if (questDismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-md w-full rounded-2xl border-2 border-amber-400/60 bg-slate-900/95 shadow-[0_0_60px_rgba(245,158,11,0.2)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-400/40">
                <MapPin size={24} className="text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80">NEW QUEST</div>
                <h2 className="text-xl font-black text-white">Explore the Scene</h2>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Navigate the world and explore each statue. Click on statues to open their content. Discover all sections to unlock a special achievement!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setQuestDismissed(true)}
                className="flex-1 py-3 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Accept Quest
              </button>
              <button
                onClick={() => setQuestDismissed(true)}
                className="p-3 rounded-xl border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
