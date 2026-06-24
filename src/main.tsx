import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import CreateAccount from './pages/CreateAccount.tsx'
import SignIn from './pages/SignIn.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Settings from './pages/Settings.tsx'
import Compare from './pages/Compare.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/compare" element={<Compare />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
