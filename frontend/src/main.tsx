import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext';
import { googleClientId } from './constants/app';
import { RealtimeProvider } from './realtime/RealtimeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
