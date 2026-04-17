// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import { BrowserRouter } from 'react-router-dom'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { Toaster } from 'react-hot-toast'
// import App from './App'
// import { AuthProvider } from './context/AuthContext'
// import './index.css'

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       staleTime: 5 * 60 * 1000,
//       refetchOnWindowFocus: false,
//     },
//   },
// })

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <QueryClientProvider client={queryClient}>
//         <AuthProvider>
//           <App />
//           <Toaster
//             position="top-right"
//             toastOptions={{
//               duration: 3500,
//               style: {
//                 background: '#1A1C1A',
//                 color: '#E8F0E5',
//                 border: '1px solid rgba(98,184,73,0.2)',
//                 fontFamily: "'DM Sans', sans-serif",
//                 fontSize: '13px',
//               },
//               success: { iconTheme: { primary: '#62B849', secondary: '#1A1C1A' } },
//               error:   { iconTheme: { primary: '#C94040', secondary: '#1A1C1A' } },
//             }}
//           />
//         </AuthProvider>
//       </QueryClientProvider>
//     </BrowserRouter>
//   </React.StrictMode>
// )



















import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1A1C1A',
                color: '#E8F0E5',
                border: '1px solid rgba(98,184,73,0.2)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#62B849', secondary: '#1A1C1A' } },
              error:   { iconTheme: { primary: '#C94040', secondary: '#1A1C1A' } },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
