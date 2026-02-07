import React, { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Terminal from '../components/Terminal'
import GitLog from '../components/GitLog'

const configData = [
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/nvim/init.lua',
    display: 'Neovim',
    id: 'nvim',
    image: '/Nvim Showcase.png',
  },
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/tmux.conf',
    display: 'Ghostty + Tmux',
    id: 'ghosttytmux',
    image: '/Terminal Showcase.png',
  },
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/functions',
    display: 'FZF + ZSH',
    id: 'fzf',
    image: '/fzf-1.png',
  },
]

const Dotfiles: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const viewModeParam = searchParams.get('view')
  const viewMode = viewModeParam === 'terminal' ? 'terminal' : 'gallery'

  const setViewMode = useCallback(
    (mode: 'gallery' | 'terminal') => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev)
        newParams.set('view', mode)
        return newParams
      })
    },
    [setSearchParams]
  )

  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  React.useEffect(() => {
    if (isMobile) {
      setViewMode('gallery')
    }
  }, [isMobile, setViewMode])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="text-left max-w-4xl mx-auto mb-40 w-full px-4 relative">
      <h1 className="text-3xl font-bold text-center pb-4">Dotfiles</h1>

      {!isMobile ? (
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'gallery'
                ? 'bg-ctp-mauve text-ctp-base'
                : 'bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1'
            }`}
          >
            Gallery View
          </button>

          <button
            onClick={() => setViewMode('terminal')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'terminal'
                ? 'bg-ctp-mauve text-ctp-base'
                : 'bg-ctp-surface0 text-ctp-text hover:bg-ctp-surface1'
            }`}
          >
            Live Sandbox
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-ctp-subtext0 mb-8 italic">
          (Interactive sandbox available on desktop)
        </p>
      )}

      {/* Main Content */}
      <div className="w-full">
        {/* Terminal View */}
        <div
          className="w-full terminal-container"
          style={{
            display: viewMode === 'terminal' && !isMobile ? 'block' : 'none',
          }}
        >
          <div className="text-center mb-6">
            <p className="text-ctp-subtext0 max-w-2xl mx-auto">
              This is a real, ephemeral Linux container running my actual
              dotfiles. Try <code className="inline-code">ls</code>,
              <code className="inline-code">nvim</code>, or
              <code className="inline-code">fzf</code> to see how I work.
            </p>
          </div>
          <Terminal isVisible={viewMode === 'terminal' && !isMobile} />
        </div>

        {/* Gallery View */}
        <div style={{ display: viewMode === 'gallery' ? 'block' : 'none' }}>
          <p className="text-center">
            These are links to some of my personal configurations, updated
            relatively frequently
          </p>

          <ul className="my-4 space-y-8">
            {configData.map((config) => (
              <li key={config.id} className="flex flex-col items-center">
                <a
                  href={config.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl text-ctp-mauve hover:underline mb-2"
                >
                  {config.display}
                </a>
                {config.image && (
                  <div
                    className="bg-ctp-surface0 p-2 rounded-lg shadow-md max-w-xl w-full cursor-default [@media(pointer:fine)]:cursor-pointer"
                    onClick={() => {
                      if (window.matchMedia('(pointer: fine)').matches) {
                        setSelectedImage(config.image)
                      }
                    }}
                  >
                    <img
                      src={config.image}
                      alt={`${config.display} Showcase`}
                      className="w-full h-auto rounded-md transition-transform duration-300 ease-in-out transform [@media(pointer:fine)]:hover:scale-[1.02]"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sidebar - Mobile (In Flow) */}
      <div className="lg:hidden mt-12">
        <GitLog />
      </div>

      {/* Sidebar - Desktop (Fixed Right) */}
      <aside className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 w-80 max-h-[80vh] overflow-y-auto z-10">
        <GitLog />
      </aside>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Enlarged showcase"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default Dotfiles
