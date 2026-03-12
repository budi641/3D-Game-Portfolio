import { Square, Settings, Maximize, Ghost, Activity, Cpu } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const ViewportChrome = () => {
  const { setMode, setQuality, quality, triggerRespawn } = useAppStore()
  const [fps, setFps] = useState(60)

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(Math.random() * 5) + 55)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-4 left-4 right-4 h-14 bg-slate-800/80 backdrop-blur-xl border border-sky-200/20 rounded-2xl flex items-center justify-between px-6 z-50 select-none shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-400/10 via-transparent to-blue-300/10 rounded-2xl pointer-events-none" />

      {/* Left: Viewport Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 group">
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
        
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode('normal')}
            className="flex items-center gap-2 px-4 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-xl transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          >
            <Square size={14} className="fill-current" />
            <span>TERMINATE</span>
          </button>

          <button 
            onClick={() => triggerRespawn()}
            className="flex items-center gap-2 px-4 h-9 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all hover:scale-105 active:scale-95 text-xs font-bold"
          >
            <Ghost size={14} />
            <span>REBOOT_ENTITY</span>
          </button>
        </div>
      </div>

      {/* Middle: Real-time Stats */}
      <div className="hidden lg:flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-emerald-500" />
          <span className="text-[10px] font-mono text-emerald-500/80">{fps} FPS</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-amber-500" />
          <span className="text-[10px] font-mono text-amber-500/80">LATENCY: 12ms</span>
        </div>
      </div>

      {/* Right: Settings & Quality */}
      <div className="flex items-center gap-4">
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`px-3 py-1 text-[10px] uppercase font-black transition-all rounded-lg ${
                quality === q 
                  ? 'bg-sky-500 text-slate-950 shadow-[0_5px_15px_rgba(56,189,248,0.4)]' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

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
