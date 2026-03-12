import { useGLTF } from '@react-three/drei'

const GAME_MODEL_URLS = [
  '/Models/Projects.glb',
  '/Models/education.glb',
  '/Models/Work.glb',
  '/Models/skill.glb',
  '/Models/Contact.glb',
  '/Models/About me.glb',
  '/Models/Blog.glb',
  '/Models/github.glb',
  '/Models/Linked In.glb',
  '/Models/Resume.glb',
]

export function preloadGameModels() {
  GAME_MODEL_URLS.forEach((url) => {
    try {
      useGLTF.preload(url)
    } catch {
      // Ignore preload errors (e.g. loader not ready)
    }
  })
}
