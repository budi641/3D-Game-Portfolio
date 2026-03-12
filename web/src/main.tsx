import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
    // Apply minimal dark base so studio doesn't show white body/borders
    document.documentElement.style.backgroundColor = '#1a1a1a'
    document.body.style.backgroundColor = '#1a1a1a'
    document.body.style.margin = '0'
    document.body.style.minHeight = '100vh'

    try {
      const [{ Studio }, { default: config }] = await Promise.all([
        import('sanity'),
        import('./studio/config'),
      ])

      root.render(
        <StrictMode>
          <Studio config={config} />
        </StrictMode>
      )
    } catch (err) {
      console.error('Sanity Studio failed to load:', err)
      root.render(
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#ef4444' }}>
          <h1>Studio failed to load</h1>
          <pre>{String(err)}</pre>
        </div>
      )
    }
    return
  }

  await import('./index.css')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
