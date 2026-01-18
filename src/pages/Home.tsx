import React, { useState, useEffect } from 'react'

const Typewriter = ({
  text,
  speed = 100,
  onComplete,
}: {
  text: string
  speed?: number
  onComplete?: () => void
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index))
        setIndex((prev) => prev + 1)
      }, speed)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [index, text, speed, onComplete])

  return (
    <span>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const Home: React.FC = () => {
  const [showSubtitle, setShowSubtitle] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-ctp-mauve h-20 md:h-24">
        <Typewriter
          text="Hello, I'm Alexander."
          onComplete={() => setShowSubtitle(true)}
        />
      </h1>

      <div
        className={`transition-opacity duration-1000 ease-in ${
          showSubtitle ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-xl md:text-2xl text-ctp-text mb-4">
          Senior Full Stack Engineer based in New York, NY.
        </p>
        <p className="text-ctp-subtext0 text-lg">Welcome to my website.</p>
      </div>
    </div>
  )
}

export default Home
