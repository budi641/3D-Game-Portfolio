import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Monitor, Gamepad2, MousePointer2 } from 'lucide-react'

const OnboardingModal = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasSeen = localStorage.getItem('portfolio-onboarding-seen')
    if (!hasSeen) {
      setShow(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('portfolio-onboarding-seen', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-engine-bg/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full engine-panel p-8 bg-engine-panel/90 shadow-2xl border-engine-accent"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-engine-accent tracking-tighter uppercase italic">
              Simulation Initialized
            </h2>
            <p className="text-xs text-engine-text-muted mt-2 uppercase tracking-widest font-mono">
              Welcome to the Interactive Portfolio v1.0
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-engine-bg border border-engine-border rounded-lg text-engine-accent">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Two Modes</h3>
                <p className="text-xs text-engine-text-muted">Explore the 3D level or switch to Normal Mode at any time for an accessible layout.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-engine-bg border border-engine-border rounded-lg text-engine-accent">
                <Gamepad2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">WASD to Move</h3>
                <p className="text-xs text-engine-text-muted">Use arrow keys or WASD to navigate. Shift to sprint, Space to jump.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-engine-bg border border-engine-border rounded-lg text-engine-accent">
                <MousePointer2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Interact</h3>
                <p className="text-xs text-engine-text-muted">Hold Left Click to orbit the camera. Left Click statues to view project details.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="w-full engine-button engine-button-primary py-3 rounded-lg font-bold shadow-lg shadow-engine-accent/20"
          >
            ENTER LEVEL
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default OnboardingModal
