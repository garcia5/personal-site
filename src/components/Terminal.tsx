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
    term.writeln('\x1b[1;31m⚠ Connection Error\x1b[0m')
    term.writeln(
      '\x1b[33mUnable to connect to the interactive terminal backend.\x1b[0m'
    )
    if (msg) {
      term.writeln(`\x1b[2;37mDetails: ${msg}\x1b[0m`)
    }
    term.writeln('')
    term.writeln('Try refreshing the page in a few moments.\x1b[0m')
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

    let isDisposed = false
    let retryTimeout: NodeJS.Timeout | undefined
    let attempt = 0
    const maxAttempts = 36 // ~3 minutes with 5s delay

    const wsUrl = getWsUrl()
    const wakeupUrl = import.meta.env.VITE_WAKEUP_URL

    const triggerWakeupAndConnect = async () => {
      if (isDisposed) return

      if (wakeupUrl) {
        term.writeln('\x1b[1;34mℹ Status:\x1b[0m Waking up sandbox server...')
        try {
          // Sending a post request to wake up the server (e.g. AWS Lambda Function URL)
          const res = await fetch(wakeupUrl, { method: 'POST' })
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          const data = await res.json()
          term.writeln(
            `\x1b[1;32m✓ Status:\x1b[0m Wake-up signal sent successfully (Current state: ${
              data.currentState || 'starting'
            }).`
          )
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          term.writeln(
            `\x1b[1;33m⚠ Warning:\x1b[0m Failed to trigger wake-up API (${errMsg}). Attempting direct connection...`
          )
        }
      } else {
        term.writeln('\x1b[1;34mℹ Status:\x1b[0m Waking up sandbox server...')
      }

      term.writeln(
        'Connecting to the backend. Please wait, this can take up to 60-90 seconds...'
      )

      const tryConnect = () => {
        if (isDisposed) return
        attempt++
        term.write(`[System] Connection attempt ${attempt}/${maxAttempts}... `)

        console.log(
          `Connecting to terminal backend (attempt ${attempt}):`,
          wsUrl
        )
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        let hasOpened = false

        ws.onopen = () => {
          hasOpened = true
          term.writeln('\x1b[1;32mConnected!\x1b[0m\r\n')
          hasReportedErrorRef.current = false // Connection successful, reset error flag

          setTimeout(() => {
            if (isDisposed) return
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

        ws.onerror = () => {
          // If we haven't opened yet, onclose will handle retry/reporting.
          if (hasOpened) {
            reportError(term, 'WebSocket error occurred')
          }
        }

        ws.onclose = (event) => {
          if (hasOpened) {
            if (event.wasClean) {
              term.writeln('\r\n\x1b[1;32mSession ended normally.\x1b[0m')
            } else {
              reportError(term, `Closed unexpectedly (Code: ${event.code})`)
            }
          } else {
            // Failed to connect initially (server starting up)
            term.writeln('\x1b[1;31mFailed.\x1b[0m')
            if (attempt < maxAttempts) {
              term.writeln(
                '[System] Server is still booting. Retrying in 5 seconds...'
              )
              retryTimeout = setTimeout(tryConnect, 5000)
            } else {
              reportError(
                term,
                'Server failed to start in time. Please try refreshing the page.'
              )
            }
          }
        }
      }

      tryConnect()
    }

    triggerWakeupAndConnect()

    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }))
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
      isDisposed = true
      if (retryTimeout) clearTimeout(retryTimeout)
      resizeObserver.disconnect()
      if (wsRef.current) wsRef.current.close()
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
              className="mr-2 text-ctp-green"
            >
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Click to Launch Sandbox
          </div>
        </div>
      )}
    </div>
  )
}

export default Terminal
