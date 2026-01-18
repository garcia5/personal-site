import React, { useState } from 'react'
import Terminal from '../components/Terminal'

const configData = [
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/nvim/init.lua',
    display: 'Neovim',
    id: 'nvim',
    image: '/Nvim Showcase.png',
  },
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/wezterm.lua',
    display: 'WezTerm',
    id: 'wez',
    image: '/Terminal Showcase.png',
  },
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/zshrc',
    display: 'Zsh',
    id: 'zsh',
  },
  {
    url: 'https://github.com/garcia5/dotfiles/blob/master/files/functions',
    display: '(Mostly) FZF Integration',
    id: 'fzf',
    image: '/fzf-1.png',
  },
]

const Dotfiles: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'gallery' | 'terminal'>('gallery')
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="text-left max-w-4xl mx-auto mb-40 w-full px-4">
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
            Interactive Terminal
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-ctp-subtext0 mb-8 italic">
          (Interactive terminal available on desktop)
        </p>
      )}

      {isMobile && viewMode === 'gallery' && (
        <p className="text-center text-sm text-ctp-subtext0 mb-4 italic">
          (Interactive terminal is available on desktop)
        </p>
      )}

      {/* Terminal View */}
      <div
        className="w-full"
        style={{
          display: viewMode === 'terminal' && !isMobile ? 'block' : 'none',
        }}
      >
        <p className="text-center mb-4 text-ctp-subtext0">
          Explore my configuration live! Try commands like{' '}
          <code className="bg-ctp-surface0 px-1 rounded">ls</code>,{' '}
          <code className="bg-ctp-surface0 px-1 rounded">cd</code>, or{' '}
          <code className="bg-ctp-surface0 px-1 rounded">nvim .zshrc</code>
        </p>
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
