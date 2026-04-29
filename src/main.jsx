import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from "./components/Toast/ToastProvider.jsx";
import { getAuthToken, getAuthUserId } from "./services/auth/authStorage.js";

console.log("🎟️ [Auth] Current Token:", getAuthToken());
console.log("🆔 [Auth] Seller ID:", getAuthUserId());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
