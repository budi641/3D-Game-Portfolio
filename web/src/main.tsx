import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
