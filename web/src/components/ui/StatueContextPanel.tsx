import { useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import { StatueContentRenderer } from '../../world/StatueContentRenderer'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSounds } from '../../hooks/useSounds'

function hexToRgba(hex: string, alpha: number) {
  const safe = (hex || '').trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(safe)) return `rgba(14,23,42,${alpha})`
  const r = parseInt(safe.slice(0, 2), 16)
  const g = parseInt(safe.slice(2, 4), 16)
  const b = parseInt(safe.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function StatueContextPanel({ data }: { data?: any }) {
  const focusedSection = useAppStore((state) => state.focusedSection)
  const focusedStatueMetadata = useAppStore((state) => state.focusedStatueMetadata)
  const setFocusedSection = useAppStore((state) => state.setFocusedSection)
  const setFocusedStatueMetadata = useAppStore((state) => state.setFocusedStatueMetadata)
  const { playPanelOpen, playPanelClose } = useSounds()

  useEffect(() => {
    if (focusedSection) playPanelOpen()
  }, [focusedSection, playPanelOpen])

  const handleClose = () => {
    playPanelClose()
    setFocusedSection(null)
    setFocusedStatueMetadata(null)
  }

  if (!focusedSection || !focusedStatueMetadata) return null

  const color = focusedStatueMetadata.color || '#3b82f6'
  const type = focusedStatueMetadata.type || 'projects'
  const name = focusedStatueMetadata.name || focusedSection

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-[min(96vw,560px)] max-h-[min(90vh,700px)] min-h-0 ui-context-shell rounded-2xl sm:rounded-[34px] flex flex-col overflow-hidden pointer-events-auto shrink-0"
          style={{
            borderColor: `${color}66`,
            boxShadow: `0 0 30px ${hexToRgba(color, 0.22)}, 0 0 85px rgba(0,0,0,0.85)`,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 ui-aurora pointer-events-none opacity-50" />
          {/* Header */}
          <div className="p-4 sm:p-7 border-b border-white/10 flex justify-between items-center relative shrink-0" style={{ backgroundColor: hexToRgba(color, 0.08) }}>
            <div className="absolute top-0 left-0 w-full h-1 opacity-20" style={{ backgroundColor: color }} />
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: color }} />
                <div className="text-[9px] font-mono tracking-[0.32em] uppercase opacity-50 text-white">Interactive Section Console</div>
              </div>
              <h2 className="text-xl sm:text-4xl font-black text-white tracking-tight uppercase tabular-nums truncate max-w-[60vw] sm:max-w-none">{name}</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/30 hover:text-white transition-all active:scale-95"
            >
              <X size={26} strokeWidth={3} />
            </button>
          </div>
          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7 space-y-6 custom-scrollbar scroll-smooth">
            <StatueContentRenderer type={type} data={data} color={color} />
          </div>
          {/* Footer */}
          <div className="p-3 sm:p-5 bg-black/50 border-t border-white/10 flex justify-between shrink-0">
            <div className="flex flex-col gap-0.5">
              <div className="text-[8px] font-mono text-white/25 tracking-widest uppercase">Link State: Active</div>
              <div className="text-[8px] font-mono text-white/15">Updated: {new Date().toISOString()}</div>
            </div>
            <div className="flex gap-2.5 items-center">
              <div className="text-[9px] font-mono text-white/45 uppercase">Ready</div>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }} />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
