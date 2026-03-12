import { X, ExternalLink, Box, Globe, Code } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { motion, AnimatePresence } from 'framer-motion'

const ContentOverlay = () => {
  const { focusedSection, setFocusedSection } = useAppStore()

  if (!focusedSection) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex items-center justify-end p-6 md:p-12 pointer-events-none z-[60] bg-black/20 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ x: 100, opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="w-full max-w-xl h-[85vh] bg-[#0d1117]/90 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col overflow-hidden relative"
        >
          {/* Decorative Corner Gradients */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-600/20 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600/20 blur-[100px] rounded-full" />

          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center relative">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] leading-none">Modules_Explorer</span>
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-white">
                {focusedSection.toUpperCase()}
              </h2>
            </div>
            <button 
              onClick={() => setFocusedSection(null)}
              className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all hover:rotate-90"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative">
            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/5 rounded-3xl">
                <p className="text-white/80 leading-relaxed font-medium">
                  Detailed analysis of the <span className="text-blue-400">{focusedSection}</span> architecture. 
                  Leveraging cutting-edge technologies and creative design patterns.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
                  <Box size={18} className="text-blue-400" />
                  <span className="text-xs font-bold text-white/50 uppercase">Environment</span>
                  <span className="text-sm font-black text-white">VORTEX_CORE</span>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-2">
                  <Globe size={18} className="text-purple-400" />
                  <span className="text-xs font-bold text-white/50 uppercase">Network</span>
                  <span className="text-sm font-black text-white">RELIABLE_01</span>
                </div>
              </div>

              <h3 className="text-lg font-black text-white mt-8 flex items-center gap-2">
                <Code size={20} className="text-blue-500" />
                TECHNICAL_ENTRIES
              </h3>

              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                   <motion.div 
                    key={i} 
                    whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    className="p-6 bg-white/2 border border-white/5 rounded-3xl cursor-pointer group transition-all"
                   >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[10px] font-mono text-blue-500/60 uppercase tracking-widest">EN-ID#00{i}</div>
                        <ExternalLink size={14} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Core Strategy {i}</div>
                      <p className="text-sm text-white/40 mt-1 leading-snug">Performance-optimized logic for the current simulation state.</p>
                   </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-white/20 uppercase">System_Identifier</span>
              <span className="text-xs font-mono text-blue-400/60">{focusedSection?.toUpperCase()}_INFRASTRUCTURE</span>
            </div>
            <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ContentOverlay
