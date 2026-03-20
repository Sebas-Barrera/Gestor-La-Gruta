import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { KeyboardProvider } from '@/contexts/KeyboardContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
     * KeyboardProvider debe ser el wrapper más externo (dentro de StrictMode)
     * para que el teclado virtual esté disponible en TODA la app, incluyendo
     * dentro de Dialogs, Drawers y cualquier portal de Radix UI.
     * El <OnScreenKeyboard> se renderiza aquí dentro (fixed al bottom de la pantalla).
     */}
    <KeyboardProvider>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </KeyboardProvider>
  </StrictMode>,
)
