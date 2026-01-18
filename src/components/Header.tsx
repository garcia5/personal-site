import React from 'react'
import { useLocation } from 'react-router-dom'

const Header: React.FC = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'

  if (isHome) return <div className="my-4" />

  return (
    <div className="my-4 text-center">
      <p className="text-5xl text-ctp-mauve">Alexander Garcia</p>
    </div>
  )
}

export default Header
