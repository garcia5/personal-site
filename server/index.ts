import express from 'express'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import * as pty from 'node-pty'
import cors from 'cors'
import { exec } from 'child_process'

const app = express()
app.use(cors())

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Pre-build the image name
const IMAGE_NAME = 'alexander-personal-site-term'

// Global inactivity timer: shutdown the server after 5 minutes of no active WebSocket clients
let globalInactivityTimeout: NodeJS.Timeout | undefined
const SHUTDOWN_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

function resetGlobalInactivityTimeout() {
  if (globalInactivityTimeout) {
    clearTimeout(globalInactivityTimeout)
    globalInactivityTimeout = undefined
  }

  // Only start the shutdown timer if there are no active clients
  if (wss.clients.size === 0) {
    console.log('No active connections. Scheduling shutdown in 5 minutes...')
    globalInactivityTimeout = setTimeout(() => {
      console.log('5 minutes of inactivity reached. Shutting down server...')
      shutdownInstance()
    }, SHUTDOWN_TIMEOUT_MS)
  }
}

function shutdownInstance() {
  if (
    process.env.DISABLE_SHUTDOWN === 'true' ||
    process.env.NODE_ENV === 'development' ||
    process.platform === 'darwin'
  ) {
    console.log('[Mock Shutdown] Server would shut down now in production.')
    return
  }

  exec('sudo shutdown -h now', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing shutdown command: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Shutdown stderr: ${stderr}`)
      return
    }
    console.log(`Shutdown stdout: ${stdout}`)
  })
}

interface ResizeMessage {
  type: 'resize'
  cols: number
  rows: number
}

interface InputMessage {
  type: 'input'
  data: string
}

type ClientMessage = ResizeMessage | InputMessage

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected')

  // Cancel any pending global shutdown timer
  if (globalInactivityTimeout) {
    clearTimeout(globalInactivityTimeout)
    globalInactivityTimeout = undefined
    console.log('Cancelled scheduled shutdown due to client connection')
  }

  // Spawn the docker container
  // We use --rm to clean up the container after exit
  // SECURITY: Resource limits to prevent abuse
  const shell = process.env.SHELL_PATH || '/bin/bash'
  const dockerPath = process.env.DOCKER_PATH || '/usr/bin/docker'

  const args = [
    '-c',
    `${dockerPath} run -it --net none --rm -e TERM=xterm-256color -w /home/dev/.dotfiles --memory=512m --cpus=1.0 --pids-limit=64 ${IMAGE_NAME}`,
  ]

  const term = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || undefined,
    env: process.env as Record<string, string>,
  })

  // Session timeout (15 minutes)
  const TIMEOUT_MS = 15 * 60 * 1000

  let inactivityTimeout: NodeJS.Timeout | undefined

  const resetTimeout = () => {
    if (inactivityTimeout) clearTimeout(inactivityTimeout)

    inactivityTimeout = setTimeout(() => {
      console.log('Session timed out due to inactivity')
      term.kill()
      ws.close()
    }, TIMEOUT_MS)
  }

  // Start the timer
  resetTimeout()

  // Handle data from Docker -> Client
  term.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data)
    }
  })

  // Handle data from Client -> Docker
  ws.on('message', (msg: Buffer | string) => {
    resetTimeout() // Reset timer on user activity

    try {
      const messageString = msg.toString()
      const parsed = JSON.parse(messageString) as ClientMessage

      if (parsed.type === 'resize') {
        term.resize(parsed.cols, parsed.rows)
      } else if (parsed.type === 'input') {
        term.write(parsed.data)
      } else {
        // Fallback or other message types
        console.warn('Unknown message type:', parsed)
      }
    } catch {
      // If message is not JSON, assume raw input (backward compatibility/safety)
      term.write(msg.toString())
    }
  })

  // Cleanup on close
  ws.on('close', () => {
    console.log('Client disconnected')

    if (inactivityTimeout) clearTimeout(inactivityTimeout)

    term.kill()

    // Reset global inactivity timeout if no clients are left
    resetGlobalInactivityTimeout()
  })

  term.onExit(() => {
    console.log('Process exited')

    if (inactivityTimeout) clearTimeout(inactivityTimeout)

    ws.close()

    // Reset global inactivity timeout if no clients are left
    resetGlobalInactivityTimeout()
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
  // Initialize inactivity timer on startup
  resetGlobalInactivityTimeout()
})
