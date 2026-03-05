import { spawn } from 'node:child_process'

const api = spawn('npm run dev:api', { stdio: 'inherit', shell: true })
const web = spawn('npm run dev:web', { stdio: 'inherit', shell: true })

const shutdown = () => {
  if (!api.killed) api.kill('SIGTERM')
  if (!web.killed) web.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

api.on('exit', () => {
  if (!web.killed) web.kill('SIGTERM')
})

web.on('exit', () => {
  if (!api.killed) api.kill('SIGTERM')
})
