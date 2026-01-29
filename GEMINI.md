# Project: Personal Website
This is a full-stack personal website built using TypeScript, React, Vite, Tailwindcss, and Node.js.

## Architecture
- **Frontend:** Vite + React (SPA).
- **Backend:** Node.js + Express + WebSocket (`server/`).
- **Terminal:** Uses `xterm.js` on the client and `node-pty` + Docker on the server to provide a real, sandboxed terminal experience.

## General Instructions
Follow modern TypeScript and React best practices when adding any new code. While desktop usage is the priority, all features and layouts on the site should also fully support mobile devices.
- Do not use `any` type where possible, prefer `unknown`
- Use `npm run lint` after making changes to ensure no linting errors have been introduced
- Use `npm run build` to ensure the application can be deployed

## Running the Project
1. **Build Docker Image:** `docker build -t alexander-personal-site-term .`
2. **Start Backend:** `cd server && node index.js`
3. **Start Frontend:** `npm run dev`

## Contributing
When making any changes to the code, _especially changes to setup/deployment scripts_ be sure to update any relevant documentation. That includes updating this file, as well as [DEPLOYMENT.md](./.gemini/skills/server-debug/references/DEPLOYMENT.md)
