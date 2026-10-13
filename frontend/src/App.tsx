import React, { useState } from 'react'
import { Music, FileUp, Sparkles, BookOpen, Printer, Sliders } from 'lucide-react'

export const App: React.FC = () => {
  const [measuresPerSystem] = useState<number>(2)
  const [showNoteNames] = useState<boolean>(true)
  const [showAccidentals] = useState<boolean>(true)

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9] text-zinc-900 dark:bg-[#0c0c0e] dark:text-zinc-100 transition-colors">
      {/* Top Bar Zen */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight">Partituras02</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Edición Didáctica EZ-Play para Piano</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Modo Atril
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Exportar PDF A4
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-3xl p-10 flex flex-col items-center text-center transition bg-white/50 dark:bg-zinc-900/30 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-4">
            <FileUp className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-medium tracking-tight mb-2">Arrastra tu partitura aquí</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
            Admite archivos PDF multipágina, imágenes escaneadas (PNG/JPG) o archivos MusicXML directos.
          </p>

          <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition shadow-sm">
            Seleccionar archivo
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xml,.musicxml" />
          </label>
        </div>

        {/* Feature Badges / Specification Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-12">
          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 mb-1.5 text-zinc-900 dark:text-zinc-100 font-medium text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Cabezas con Solfeo
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cápsulas legibles con <span className="font-mono font-medium">do, re, mi</span> en blanco sobre negro para eliminar fatiga visual.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 mb-1.5 text-zinc-900 dark:text-zinc-100 font-medium text-sm">
              <Sliders className="w-4 h-4 text-emerald-500" />
              {measuresPerSystem} Compases por Sistema
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Espaciado horizontal amplio anti-apelotonamiento para lectura fluida en piano.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2 mb-1.5 text-zinc-900 dark:text-zinc-100 font-medium text-sm">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Controles Ortogonales
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Solfeo {showNoteNames ? 'Activado' : 'Desactivado'} • Alteraciones {showAccidentals ? 'Visibles' : 'Estándar'}.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
