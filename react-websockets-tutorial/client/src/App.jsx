import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Home } from './Home'
import { Login } from './components/Login'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const [username, setUsername] = useState("")

  return username ? (
    <Home username={username} />
  ) : (
    <Login onSubmit={setUsername} />
  )
}

export default App
