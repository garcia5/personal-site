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

  useEffect(() => {
    if (!terminalRef.current) return

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

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const defaultUrl = `${protocol}//${host}/ws`

    // Use environment variable if set, otherwise fallback to local /ws path
    const wsUrl = import.meta.env.VITE_WS_URL || defaultUrl

    console.log('Connecting to terminal backend:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      term.writeln('\x1b[1;32mConnected to interactive backend!\x1b[0m')
      // Sync initial size
      fitAddon.fit()
      ws.send(
        JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows,
        })
      )
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
      term.write('\r\n\x1b[1;31mConnection Error\x1b[0m\r\n')
      term.write(
        '\x1b[1;33mUnable to connect to the interactive terminal backend.\x1b[0m\r\n'
      )
      if (msg) term.write(`Details: ${msg}\r\n`)
      term.write(
        '\x1b[1;30m(The server might be sleeping or offline to save resources)\x1b[0m\r\n'
      )
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

    // Handle resize
    const handleResize = () => {
      fitAddon.fit()
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows,
          })
        )
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      ws.close()
      term.dispose()
    }
  }, [])

  useEffect(() => {
    if (isVisible && xtermRef.current && fitAddonRef.current) {
      // Small timeout to allow transition/rendering to finish
      setTimeout(() => {
        fitAddonRef.current?.fit()
        xtermRef.current?.focus()
      }, 50)
    }
  }, [isVisible])

  return (
    <div className="relative w-full h-[600px] rounded-lg shadow-xl overflow-hidden border border-[#45475a] bg-[#1e1e2e]">
      <div
        ref={terminalRef}
        className={`w-full h-full transition-all duration-300 ${
          isFocused ? 'opacity-100 blur-0' : 'opacity-60 blur-[1px]'
        }`}
      />
      {!isFocused && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={() => xtermRef.current?.focus()}
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
