import React from 'react'
import { useLocation } from 'react-router-dom'

const Header: React.FC = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div
      className={`transition-all duration-700 ease-in-out overflow-hidden flex justify-center items-center ${
        isHome
          ? 'max-h-0 opacity-0 -translate-y-10'
          : 'max-h-24 opacity-100 translate-y-0 my-4'
      }`}
    >
      <p className="text-5xl text-ctp-mauve">Alexander Garcia</p>
    </div>
  )
}

export default Header
