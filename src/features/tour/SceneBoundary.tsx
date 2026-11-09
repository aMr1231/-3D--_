import { Component, type ReactNode } from 'react'

/** Проверка поддержки WebGL до создания сцены. */
export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

interface Props {
  fallback: (error: Error) => ReactNode
  children: ReactNode
}

/** Граница ошибок 3D-сцены: при сбое WebGL тур продолжает работать на 2D-плане. */
export class SceneBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) console.error('3D-сцена:', error)
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children
  }
}
