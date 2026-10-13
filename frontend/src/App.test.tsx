import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders application branding and main dropzone', () => {
    render(<App />)
    expect(screen.getByText('Partituras02')).toBeInTheDocument()
    expect(screen.getByText('Edición Didáctica EZ-Play para Piano')).toBeInTheDocument()
    expect(screen.getByText('Arrastra tu partitura aquí')).toBeInTheDocument()
  })

  it('renders specification control indicators', () => {
    render(<App />)
    expect(screen.getByText('Cabezas con Solfeo')).toBeInTheDocument()
    expect(screen.getByText('2 Compases por Sistema')).toBeInTheDocument()
    expect(screen.getByText('Controles Ortogonales')).toBeInTheDocument()
  })
})
