import { memo } from 'react'

const Header = memo(function Header({ darkMode, onToggle }) {
  return (
    <header className="header">
      <h1>🌍 世界の国情報</h1>
      <button className="dark-btn" onClick={onToggle}>
        {darkMode ? '☀️ ライト' : '🌙 ダーク'}
      </button>
    </header>
  )
})

export default Header
