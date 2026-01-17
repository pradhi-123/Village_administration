import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { MockDB } from './services/mockDatabase'
import './styles/base.css'

// Initialize Database & Run Auto-Generators
MockDB.init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
