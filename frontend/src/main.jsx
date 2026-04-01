import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: { background: '#111827', color: '#e2e8f0', border: '1px solid #1f2d40' },
        success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#111827' } }
      }}
    />
  </React.StrictMode>
)
