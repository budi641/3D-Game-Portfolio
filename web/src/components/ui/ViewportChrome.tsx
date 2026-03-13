import { Square, Settings, Maximize, RefreshCw, Activity, Cpu, Volume2, VolumeX } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { motion } from 'framer-motion'

const ViewportChrome = () => {
  const { setMode, triggerRespawn, fps, soundEnabled, setSoundEnabled } = useAppStore()
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 min-h-12 sm:h-14 bg-slate-800/80 backdrop-blur-xl border border-sky-200/20 rounded-xl sm:rounded-2xl flex items-center justify-between px-2 sm:px-6 z-50 select-none shadow-[0_20px_50px_rgba(0,0,0,0.35)] gap-2 overflow-x-auto"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 via-transparent to-blue-300/10 rounded-2xl pointer-events-none" />

      {/* Left: Viewport Controls */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-3 group">
          <motion.div 
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            className="w-3 h-3 bg-sky-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.7)]"
          />
          <div className="flex flex-col">
            <span className="text-[10px] text-sky-300 font-black uppercase tracking-[0.2em] leading-none">Simulation</span>
            <span className="text-xs text-white font-bold tracking-tight">ACTIVE_STATE</span>
          </div>
        </div>
        
        <div className="hidden sm:block h-8 w-[1px] bg-white/10 mx-2"></div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode('normal')}
            className="flex items-center gap-1.5 px-2 sm:px-4 h-8 sm:h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 text-[10px] sm:text-xs font-bold"
          >
            <Square size={14} className="fill-current" />
            <span className="hidden sm:inline">TERMINATE</span>
          </button>

          <button 
            onClick={() => triggerRespawn()}
            className="flex items-center gap-1.5 px-2 sm:px-4 h-8 sm:h-9 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 text-[10px] sm:text-xs font-bold"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">REBOOT_ENTITY</span>
          </button>
        </div>
      </div>

      {/* Middle: Real-time Stats - hidden on mobile */}
      {!isMobile && (
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-emerald-500" />
          <span className="text-[10px] font-mono text-emerald-500/80">{fps} FPS</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-amber-500" />
          <span className="text-[10px] font-mono text-amber-500/80">LATENCY: 12ms</span>
        </div>
      </div>
      )}

      {/* Right: Settings */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors"
          title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-white/30" />}
        </button>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors">
            <Settings size={18} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-white/50 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors">
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default ViewportChrome
