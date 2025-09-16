import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import "~~/styles/globals.css";
import { EthAppWithProviders } from './App.js';
import 'buffer' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <EthAppWithProviders />
      </Suspense>
    </BrowserRouter>
  </StrictMode>
)