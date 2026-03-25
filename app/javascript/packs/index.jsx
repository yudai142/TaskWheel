import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../components/App'
import '../stylesheets/tailwind.css'

document.addEventListener('DOMContentLoaded', () => {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(<App />)
})
