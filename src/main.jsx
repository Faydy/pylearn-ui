import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './AuthContext'; // Importăm Provider-ul

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Îmbrăcăm aplicația aici */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)