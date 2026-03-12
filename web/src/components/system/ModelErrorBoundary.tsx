import { Component, type ReactNode } from 'react'

type ModelErrorBoundaryProps = {
  fallback: ReactNode
  children: ReactNode
}

type ModelErrorBoundaryState = {
  hasError: boolean
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Model failed to load, rendering fallback mesh.', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export default ModelErrorBoundary
