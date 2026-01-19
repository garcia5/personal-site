import React, { useEffect, useRef } from 'react'
import { Terminal as XTerminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface TerminalProps {
  isVisible: boolean
}

const Terminal: React.FC<TerminalProps> = ({ isVisible }) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [shouldConnect, setShouldConnect] = React.useState(false)

  useEffect(() => {
    if (!terminalRef.current || !shouldConnect) return

    // Initialize xterm
    const term = new XTerminal({
      cursorBlink: true,
      cursorStyle: 'block',
      cursorInactiveStyle: 'block',
      fontFamily: '"JetBrainsMono Nerd Font Mono", monospace',
      fontSize: 14,
      theme: {
        background: '#1e1e2e', // Catppuccin Base
        foreground: '#cdd6f4', // Catppuccin Text
        cursor: '#f5e0dc', // Catppuccin Rosewater
        black: '#45475a',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#f5c2e7',
        cyan: '#94e2d5',
        white: '#bac2de',
      },
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()

    // Handle Focus State
    // xterm.textarea is the hidden input that receives focus
    if (term.textarea) {
      term.textarea.onfocus = () => setIsFocused(true)
      term.textarea.onblur = () => setIsFocused(false)
    }

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Handle resize via term.onResize to sync with backend
    term.onResize(({ cols, rows }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
      }
    })

    // Connect to WebSocket
    // Default to localhost for development, but in production VITE_WS_URL should be set
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const defaultUrl =
      window.location.hostname === 'localhost'
        ? 'ws://localhost:3001'
        : `${protocol}//${host}/ws`

    // Use environment variable if set, otherwise fallback to dynamic default
    const wsUrl = import.meta.env.VITE_WS_URL || defaultUrl

    console.log('Connecting to terminal backend:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      term.writeln('\x1b[1;32mConnected to interactive backend!\x1b[0m')

      // Force a fit and sync size immediately on connection
      setTimeout(() => {
        fitAddon.fit()
        // Manually send resize once to ensure backend is synced even if onResize didn't fire
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows,
            })
          )
        }
      }, 100)
    }

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        term.write(event.data)
      } else {
        // Handle blobs if necessary
        const reader = new FileReader()
        reader.onload = () => {
          term.write(reader.result as string)
        }
        reader.readAsText(event.data)
      }
    }

    const reportError = (msg?: string) => {
      term.writeln('')
      term.writeln('\x1b[1;31m⚠ Connection Error\x1b[0m')
      term.writeln(
        '\x1b[33mUnable to connect to the interactive terminal backend.\x1b[0m'
      )
      if (msg) {
        term.writeln(`\x1b[2;37mDetails: ${msg}\x1b[0m`)
      }
      term.writeln('')
      term.writeln(
        '\x1b[1;34mℹ Tip:\x1b[0m \x1b[90mThe server might be sleeping or offline to save resources.'
      )
      term.writeln('Try refreshing the page in a few moments.\x1b[0m')
      term.writeln('')
    }

    ws.onclose = (event) => {
      if (event.wasClean) {
        term.writeln('\r\n\x1b[1;32mSession ended normally.\x1b[0m')
      } else {
        reportError(`Closed unexpectedly (Code: ${event.code})`)
      }
    }

    ws.onerror = () => {
      reportError()
    }

    // Client -> Server
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    // Handle resize with ResizeObserver for better reliability
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (terminalRef.current) {
          fitAddon.fit()
        }
      })
    })
    resizeObserver.observe(terminalRef.current)

    return () => {
      resizeObserver.disconnect()
      ws.close()
      term.dispose()
    }
  }, [shouldConnect])

  useEffect(() => {
    if (isVisible && xtermRef.current && fitAddonRef.current) {
      // Small timeout to allow transition/rendering to finish
      setTimeout(() => {
        fitAddonRef.current?.fit()
        xtermRef.current?.focus()
        xtermRef.current?.refresh(0, xtermRef.current.rows - 1)
      }, 150)
    }
  }, [isVisible, shouldConnect])

  const handleFocus = () => {
    xtermRef.current?.focus()
    if (!shouldConnect) {
      setShouldConnect(true)
    }
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg shadow-xl overflow-hidden border border-[#45475a] bg-[#1e1e2e]">
      <div
        ref={terminalRef}
        className={`w-full h-full p-2 transition-all duration-300 ${
          isFocused ? 'opacity-100 blur-0' : 'opacity-60 blur-[1px]'
        }`}
      />
      {!isFocused && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={handleFocus}
        >
          <div className="bg-ctp-base/80 px-4 py-2 rounded-lg text-ctp-text font-bold border border-ctp-surface1 shadow-lg hover:scale-105 transition-transform">
            Click to Activate
          </div>
        </div>
      )}
    </div>
  )
}

export default Terminal
