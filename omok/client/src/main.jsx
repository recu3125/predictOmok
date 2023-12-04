import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { useState } from 'react'
import { Home } from './components/Home'
import { Login } from './components/Login'

function App() {
  const [count, setCount] = useState(0)

  const [username, setUsername] = useState("")

  return username ? (
    <Home username={username} />
  ) : (
    <Login onSubmit={setUsername} />
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)