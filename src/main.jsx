import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './AuthContext'; // Importăm Provider-ul

const savedTheme = window.localStorage.getItem('pylearn-theme');
const isDarkTheme = savedTheme !== 'light';
document.documentElement.classList.toggle('dark', isDarkTheme);
document.documentElement.dataset.theme = isDarkTheme ? 'dark' : 'light';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Îmbrăcăm aplicația aici */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
