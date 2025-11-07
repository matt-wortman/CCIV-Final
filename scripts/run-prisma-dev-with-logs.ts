import { spawn } from 'node:child_process'
import path from 'node:path'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'

const logDir = path.resolve(process.cwd(), 'logs')
await mkdir(logDir, { recursive: true })

const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const logPath = path.join(logDir, `prisma-dev-${timestamp}.log`)

console.log(`→ Logging Prisma dev output to ${path.relative(process.cwd(), logPath)}`)
console.log('   (live output will still stream below)')

const logStream = createWriteStream(logPath, { flags: 'a' })

const child = spawn(
  'npx',
  ['dotenv', '-e', '.env.prisma-dev', '--', 'prisma', 'dev'],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  }
)

const forward = (data: Buffer) => {
  process.stdout.write(data)
  logStream.write(data)
}

const forwardErr = (data: Buffer) => {
  process.stderr.write(data)
  logStream.write(data)
}

child.stdout?.on('data', forward)
child.stderr?.on('data', forwardErr)

const cleanUp = () => {
  logStream.end()
}

child.on('close', (code) => {
  cleanUp()
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  cleanUp()
  console.error('Failed to start Prisma dev server:', error)
  process.exit(1)
})

const handleSignal = (signal: NodeJS.Signals) => {
  child.kill(signal)
}

process.on('SIGINT', handleSignal)
process.on('SIGTERM', handleSignal)
