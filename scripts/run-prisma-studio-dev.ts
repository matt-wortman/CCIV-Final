import { config } from 'dotenv'
import path from 'node:path'
import { spawn } from 'node:child_process'

const envPath = path.resolve(process.cwd(), '.env.prisma-dev')

const result = config({ path: envPath })

if (result.error) {
  console.error(`Failed to load .env.prisma-dev from ${envPath}:`, result.error)
  process.exit(1)
}

const { DATABASE_URL } = process.env

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.prisma-dev. Prisma Studio cannot start.')
  process.exit(1)
}

const child = spawn(
  'npx',
  ['prisma', 'studio', '--schema', 'prisma/schema.prisma'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL,
    },
  }
)

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error('Failed to launch Prisma Studio:', error)
  process.exit(1)
})
