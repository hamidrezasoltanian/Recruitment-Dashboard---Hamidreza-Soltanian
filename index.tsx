import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CandidatesProvider } from './contexts/CandidatesContext';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { TemplateProvider } from './contexts/TemplateContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <TemplateProvider>
            <CandidatesProvider>
              <App />
            </CandidatesProvider>
          </TemplateProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);