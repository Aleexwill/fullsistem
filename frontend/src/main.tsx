import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

// Limpiar localStorage corrupto - FORZAR LIMPIEZA ÚNICA
const CLEAN_VERSION = 'v23-form-fixes'
if (localStorage.getItem('sosc-clean-version') !== CLEAN_VERSION) {
  console.log('Limpiando datos corruptos...')
  localStorage.clear()
  localStorage.setItem('sosc-clean-version', CLEAN_VERSION)
  window.location.reload()
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 5, // 5 segundos - refresca datos más rápido
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
