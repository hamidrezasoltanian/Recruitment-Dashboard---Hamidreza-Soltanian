import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { CandidatesProvider } from './contexts/CandidatesContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { TemplateProvider } from './contexts/TemplateContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <TemplateProvider>
              <CandidatesProvider>
                <App />
              </CandidatesProvider>
            </TemplateProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  </React.StrictMode>,
)
