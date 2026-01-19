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

    ws.onclose = (event) => {
      if (event.wasClean) {
        term.writeln('\r\n\x1b[1;31mConnection closed.\x1b[0m')
      } else {
        term.writeln('\r\n\x1b[1;31mTerminal session terminated.\x1b[0m')
      }
    }

    ws.onerror = () => {
      term.writeln(
        '\r\n\x1b[1;31mError: Could not connect to the terminal backend.\x1b[0m'
      )
      term.writeln(
        '\x1b[1;33mThis might be because the terminal server is offline or your browser blocked the connection.\x1b[0m'
      )
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
    <div
      ref={terminalRef}
      className="w-full h-[600px] bg-[#1e1e2e] rounded-lg shadow-xl p-2 overflow-hidden border border-[#45475a]"
    />
  )
}

export default Terminal
