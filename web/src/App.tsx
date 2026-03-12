import { useAppStore } from './store/appStore'
import GameMode from './components/modes/GameMode'
import NormalMode from './components/modes/NormalMode'
import ViewportChrome from './components/ui/ViewportChrome'
import OnboardingModal from './components/ui/OnboardingModal'
import LoadingScreen from './components/ui/LoadingScreen'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { usePortfolioData } from './hooks/usePortfolioData'
import { preloadGameModels } from './lib/preloadModels'

function App() {
  const mode = useAppStore((state) => state.mode)
  const { data } = usePortfolioData()

  useEffect(() => {
    const t = setTimeout(preloadGameModels, 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const title = data?.siteSettings?.title || '3D Game Portfolio'
    const description =
      data?.siteSettings?.description || 'Interactive game-style portfolio with playable media, projects, and contact.'

    document.title = title
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  }, [data?.siteSettings?.title, data?.siteSettings?.description])

  return (
    <div className="relative w-full h-screen overflow-hidden bg-engine-bg font-engine text-engine-text">
      <LoadingScreen />
      <OnboardingModal />
      
      <AnimatePresence mode="wait">
        {mode === 'game' ? (
          <motion.div
            key="game-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <ViewportChrome />
            <GameMode />
          </motion.div>
        ) : (
          <motion.div
            key="normal-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full overflow-y-auto"
          >
            <NormalMode />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
