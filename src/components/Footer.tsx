import React from 'react'

const technologies = [
  { name: 'React', url: 'https://react.dev/' },
  { name: 'TypeScript', url: 'https://www.typescriptlang.org/' },
  { name: 'Vite', url: 'https://vitejs.dev/' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com/' },
  { name: 'Catppuccin', url: 'https://github.com/catppuccin/tailwindcss' },
]

const Footer: React.FC = () => {
  return (
    <div className="footer py-4 bg-ctp-surface0">
      <div className="flex flex-row items-center justify-center w-full">
        <a
          href="https://github.com/garcia5"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-2"
        >
          <img className="h-8 w-8" src="/github.svg" alt="GitHub" />
        </a>
        <a
          href="https://www.linkedin.com/in/alexander-j-garcia"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-2"
        >
          <img className="h-8 w-8" src="/linkedin.svg" alt="LinkedIn" />
        </a>
      </div>
      <p className="text-center text-ctp-subtext0">
        agarcia1359 [at] gmail.com
      </p>
      <div className="py-4 text-sm text-center">
        <p>
          <span className="pr-1">This site was built using:</span>
          {technologies.map((tech, index) => (
            <span key={tech.name}>
              <a
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ctp-mauve hover:underline"
              >
                {tech.name}
              </a>
              {index < technologies.length - 1 && ' - '}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

export default Footer
