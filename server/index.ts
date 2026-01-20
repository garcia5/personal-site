import express from 'express'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import * as pty from 'node-pty'
import cors from 'cors'

const app = express()
app.use(cors())

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Pre-build the image name
const IMAGE_NAME = 'alexander-personal-site-term'

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
  })

  term.onExit(() => {
    console.log('Process exited')

    if (inactivityTimeout) clearTimeout(inactivityTimeout)

    ws.close()
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
