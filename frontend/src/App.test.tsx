import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import i18n from './i18n/config'
import App from './App'

describe('App Component i18n and UI', () => {
  beforeEach(() => {
    i18n.changeLanguage('es')
  })

  it('renders application with Spanish text catalog by default', () => {
    render(<App />)
    expect(screen.getByText('Partituras02')).toBeInTheDocument()
    expect(screen.getByText('Edición Didáctica EZ-Play para Piano')).toBeInTheDocument()
    expect(screen.getByText('Arrastra tu partitura aquí')).toBeInTheDocument()
    expect(screen.getByText('Cabezas con Solfeo')).toBeInTheDocument()
    expect(screen.getByText('Modo Atril')).toBeInTheDocument()
  })

  it('switches seamlessly between Spanish and English using language button', () => {
    render(<App />)
    const langBtn = screen.getByTitle('Idioma')
    expect(langBtn).toHaveTextContent('ES')

    // Switch to English
    fireEvent.click(langBtn)
    expect(screen.getByText('Pedagogical EZ-Play Piano Edition')).toBeInTheDocument()
    expect(screen.getByText('Drop your sheet music here')).toBeInTheDocument()
    expect(screen.getByText('Solfege Noteheads')).toBeInTheDocument()
    expect(screen.getByText('Music Stand Mode')).toBeInTheDocument()
    expect(langBtn).toHaveTextContent('EN')

    // Switch back to Spanish
    fireEvent.click(langBtn)
    expect(screen.getByText('Edición Didáctica EZ-Play para Piano')).toBeInTheDocument()
    expect(langBtn).toHaveTextContent('ES')
  })
})
