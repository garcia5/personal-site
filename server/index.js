const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const pty = require('node-pty')
const cors = require('cors')

const app = express()
app.use(cors())

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

// Pre-build the image name
const IMAGE_NAME = 'alexander-personal-site-term'

wss.on('connection', (ws) => {
  console.log('Client connected')

  // Spawn the docker container
  // We use --rm to clean up the container after exit
  // SECURITY: Resource limits to prevent abuse
  const shell = '/bin/bash'
  const args = [
    '-c',
    `/usr/bin/docker run -it --rm -e TERM=xterm-256color --memory=512m --cpus=1.0 --pids-limit=64 ${IMAGE_NAME}`,
  ]

  const term = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  })

  // Session timeout (15 minutes)

  const TIMEOUT_MS = 15 * 60 * 1000

  let inactivityTimeout

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

  term.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data)
    }
  })

  // Handle data from Client -> Docker

  ws.on('message', (msg) => {
    resetTimeout() // Reset timer on user activity

    try {
      const parsed = JSON.parse(msg)

      if (parsed.type === 'resize') {
        term.resize(parsed.cols, parsed.rows)
      } else if (parsed.type === 'input') {
        term.write(parsed.data)
      } else {
        // Fallback or other message types

        term.write(msg)
      }
    } catch (e) {
      // If message is not JSON, assume raw input (backward compatibility/safety)

      term.write(msg)
    }
  })

  // Cleanup on close

  ws.on('close', () => {
    console.log('Client disconnected')

    if (inactivityTimeout) clearTimeout(inactivityTimeout)

    term.kill()
  })

  term.on('exit', () => {
    console.log('Process exited')

    if (inactivityTimeout) clearTimeout(inactivityTimeout)

    ws.close()
  })
})

const PORT = 3001
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
