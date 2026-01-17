import React from 'react'
import { Link } from 'react-router-dom'

const NotFound: React.FC = () => {
  return (
    <div className="text-center max-w-xl mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">
        Oops! The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="text-blue-500 hover:text-blue-700 underline text-lg"
      >
        Go back home
      </Link>
    </div>
  )
}

export default NotFound
