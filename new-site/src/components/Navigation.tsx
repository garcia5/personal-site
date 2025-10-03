import React from 'react'
import { Link } from 'react-router-dom'

const Navigation: React.FC = () => {
  return (
    <nav className="flex justify-center">
      <Link className="nav-item px-4 py-2 text-lg" to="/">
        Home
      </Link>
      <Link className="nav-item px-4 py-2 text-lg" to="/about">
        About
      </Link>
      <Link className="nav-item px-4 py-2 text-lg" to="/dotfiles">
        Dotfiles
      </Link>
      <a
        className="nav-item px-4 py-2 text-lg"
        href="/Alexander Garcia Resume.pdf"
        target="_blank"
      >
        Resume
      </a>
    </nav>
  )
}

export default Navigation
