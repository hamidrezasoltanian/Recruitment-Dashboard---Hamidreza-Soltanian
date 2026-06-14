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
import SSOAuthGuard from './components/SSOAuthGuard'
import { handleSSORedirect } from './utils/sso'

// Handle SSO redirect on mount
handleSSORedirect()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SSOAuthGuard required={false}>
      <ToastProvider>
        <ThemeProvider>
          <SettingsProvider>
            <TemplateProvider>
              <AuthProvider>
                <CandidatesProvider>
                  <App />
                </CandidatesProvider>
              </AuthProvider>
            </TemplateProvider>
          </SettingsProvider>
        </ThemeProvider>
      </ToastProvider>
    </SSOAuthGuard>
  </React.StrictMode>,
)
