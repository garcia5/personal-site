import React, { useEffect, useRef } from 'react'
import { Terminal as XTerminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  isVisible: boolean
}

const Terminal: React.FC<TerminalProps> = ({ isVisible }) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const hasReportedErrorRef = useRef(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const [shouldConnect, setShouldConnect] = React.useState(false)

  const isServerSleeping = (() => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    })
    const hour = parseInt(formatter.format(now), 10)
    // hour < 8 (0-7) or hour >= 20 (20-23)
    return hour < 8 || hour >= 20
  })()

  const initTerminal = () => {
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
    return { term, fitAddon }
  }

  const reportError = (term: XTerminal, msg?: string) => {
    if (hasReportedErrorRef.current) return
    hasReportedErrorRef.current = true

    term.writeln('')

    if (isServerSleeping) {
      term.writeln(
        '\x1b[1;34mℹ Status:\x1b[0m \x1b[90mThe backend server is currently sleeping.'
      )
      term.writeln('Active Hours: 8:00 AM - 8:00 PM (New York Time)')
      term.writeln('Please check back later!\x1b[0m')
    } else {
      term.writeln('\x1b[1;31m⚠ Connection Error\x1b[0m')
      term.writeln(
        '\x1b[33mUnable to connect to the interactive terminal backend.\x1b[0m'
      )
      if (msg) {
        term.writeln(`\x1b[2;37mDetails: ${msg}\x1b[0m`)
      }
      term.writeln('')
      term.writeln('Try refreshing the page in a few moments.\x1b[0m')
    }
    term.writeln('')
  }

  const getWsUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const defaultUrl =
      window.location.hostname === 'localhost'
        ? 'ws://localhost:3001'
        : `${protocol}//${host}/ws`
    return import.meta.env.VITE_WS_URL || defaultUrl
  }

  useEffect(() => {
    if (!terminalRef.current || !shouldConnect) return

    const { term, fitAddon } = initTerminal()
    term.open(terminalRef.current)
    fitAddon.fit()

    if (term.textarea) {
      term.textarea.onfocus = () => setIsFocused(true)
      term.textarea.onblur = () => setIsFocused(false)
    }

    xtermRef.current = term
    fitAddonRef.current = fitAddon
    hasReportedErrorRef.current = false // Reset error flag on new connection attempt

    term.onResize(({ cols, rows }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
      }
    })

    // WebSocket Connection
    const wsUrl = getWsUrl()
    console.log('Connecting to terminal backend:', wsUrl)
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      term.writeln('\x1b[1;32mConnected to interactive backend!\x1b[0m')
      hasReportedErrorRef.current = false // Connection successful, reset error flag

      setTimeout(() => {
        fitAddon.fit()
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
        const reader = new FileReader()
        reader.onload = () => {
          term.write(reader.result as string)
        }
        reader.readAsText(event.data)
      }
    }

    ws.onclose = (event) => {
      if (event.wasClean) {
        term.writeln('\r\n\x1b[1;32mSession ended normally.\x1b[0m')
      } else {
        reportError(term, `Closed unexpectedly (Code: ${event.code})`)
      }
    }

    ws.onerror = () => {
      reportError(term)
    }

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

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

  useEffect(() => {
    const checkSchedule = () => {
      if (!xtermRef.current) return

      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      })

      // Parse current NY time
      const parts = formatter.formatToParts(now)
      const hourStr = parts.find((p) => p.type === 'hour')?.value || '0'
      const minStr = parts.find((p) => p.type === 'minute')?.value || '0'
      const hour = parseInt(hourStr, 10)
      const minute = parseInt(minStr, 10)

      // Shutdown happens at 8:00 PM.
      // Warn at 7:55 PM
      if (hour === 19 && minute === 55) {
        xtermRef.current.writeln('')
        xtermRef.current.writeln(
          '\x1b[33m⚠ NOTICE: Server scheduled to sleep in 5 minutes.\x1b[0m'
        )
        xtermRef.current.writeln('')
      }

      // Warn at 7:59 PM
      if (hour === 19 && minute === 59) {
        xtermRef.current.writeln('')
        xtermRef.current.writeln(
          '\x1b[31m⚠ WARNING: Server sleeping in 1 minute. Session will close.\x1b[0m'
        )
        xtermRef.current.writeln('')
      }
    }

    // Check every 30 seconds to catch the specific minute
    const interval = setInterval(checkSchedule, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[600px] rounded-lg shadow-2xl shadow-ctp-mauve/30 overflow-hidden border border-[#45475a] bg-[#1e1e2e]">
      <div
        className={`w-full h-full p-2 transition-all duration-300 ${
          isFocused ? 'opacity-100 blur-0' : 'opacity-60 blur-[1px]'
        }`}
      >
        <div ref={terminalRef} className="w-full h-full overflow-hidden" />
      </div>
      {!isFocused && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={handleFocus}
        >
          <div className="flex items-center bg-ctp-base/80 px-4 py-2 rounded-lg text-ctp-text font-bold border border-ctp-surface1 shadow-lg hover:scale-105 transition-transform">
            {isServerSleeping && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 text-ctp-yellow"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
            {isServerSleeping ? 'Live Sandbox (Sleeping)' : 'Click to Activate'}
          </div>
        </div>
      )}
    </div>
  )
}

export default Terminal
