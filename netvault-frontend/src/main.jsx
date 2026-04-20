import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

// Theme-aware toast surface — sits INSIDE ThemeProvider
function ToastSurface() {
  const { theme } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          fontSize: '13px',
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: '12px',
        },
        success: { iconTheme: { primary: theme.accent, secondary: theme.surface } },
        error: { iconTheme: { primary: '#EF4444', secondary: theme.surface } },
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastSurface />
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)