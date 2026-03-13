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
import { urlFor } from './lib/sanity'

function setOrCreateMeta(
  attr: 'name' | 'property',
  key: string,
  content: string
) {
  const selector = attr === 'name' ? `meta[name="${key}"]` : `meta[property="${key}"]`
  let el = document.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setOrCreateLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function App() {
  const mode = useAppStore((state) => state.mode)
  const { data } = usePortfolioData()

  useEffect(() => {
    const t = setTimeout(preloadGameModels, 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const site = data?.siteSettings
    const title = site?.title || 'Abdelrahman Ameen 3D Game Dev Portfolio'
    const description =
      site?.description || 'Game developer portfolio showcasing projects, experience, and contact. Abdelrahman Ameen.'
    const ogTitle = site?.ogTitle || title
    const ogDescription = site?.ogDescription || description
    const ogImage = site?.ogImage ? urlFor(site.ogImage).width(1200).height(630).fit('crop').auto('format').url() : ''
    const keywords = site?.keywords || ''
    const canonicalUrl = site?.canonicalUrl || ''

    document.title = title
    setOrCreateMeta('name', 'description', description)
    if (keywords) setOrCreateMeta('name', 'keywords', keywords)

    setOrCreateMeta('property', 'og:title', ogTitle)
    setOrCreateMeta('property', 'og:description', ogDescription)
    setOrCreateMeta('property', 'og:type', 'website')
    if (ogImage) setOrCreateMeta('property', 'og:image', ogImage)
    if (canonicalUrl) setOrCreateMeta('property', 'og:url', canonicalUrl)

    setOrCreateMeta('name', 'twitter:card', 'summary_large_image')
    setOrCreateMeta('name', 'twitter:title', ogTitle)
    setOrCreateMeta('name', 'twitter:description', ogDescription)
    if (ogImage) setOrCreateMeta('name', 'twitter:image', ogImage)

    if (canonicalUrl) setOrCreateLink('canonical', canonicalUrl)
  }, [data?.siteSettings])

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
