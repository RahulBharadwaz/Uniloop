import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Developer attribution & console easter egg
if (typeof window !== 'undefined') {
  console.log(
    '%c UniLoop %c Architected & Engineered by Rahul Bharadwaz %c https://uniloop.me ',
    'background:#181ED9;color:#fff;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold;font-family:sans-serif;',
    'background:#090A35;color:#fff;padding:4px 8px;font-weight:bold;font-family:sans-serif;',
    'background:#E6E6F1;color:#181ED9;padding:4px 8px;border-radius:0 4px 4px 0;font-family:sans-serif;'
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
