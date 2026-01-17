import React from 'react'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-ctp-base text-ctp-text min-h-screen flex flex-col">
      <div id="app" className="container mx-auto flex-grow px-4">
        <Header />
        <Navigation />
        <main className="flex flex-col my-4 items-center">{children}</main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout
