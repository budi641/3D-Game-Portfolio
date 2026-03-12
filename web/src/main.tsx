import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress known deprecation warnings from dependencies (Three.js Clock, Rapier init)
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  const msg = String(args[0] ?? '')
  if (
    msg.includes('THREE.Clock') && msg.includes('deprecated') ||
    msg.includes('deprecated parameters for the initialization function') ||
    msg.includes('React DevTools')
  ) return
  originalWarn.apply(console, args)
}

async function bootstrap() {
  const root = createRoot(document.getElementById('root')!)
  const isStudioRoute = window.location.pathname.startsWith('/studio')

  if (isStudioRoute) {
    const [{ Studio }, { default: config }] = await Promise.all([
      import('sanity'),
      import('./studio/config'),
    ])

    root.render(
      <StrictMode>
        <Studio config={config} />
      </StrictMode>
    )
    return
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
