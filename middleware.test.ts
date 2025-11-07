/**
 * @jest-environment node
 */
import type { NextRequest } from 'next/server'

type EnvShape = Partial<NodeJS.ProcessEnv>

const ORIGINAL_ENV = { ...process.env }

function createRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    headers: new Headers(headers),
  } as unknown as NextRequest
}

async function loadMiddleware(overrides: EnvShape = {}) {
  process.env = { ...ORIGINAL_ENV, ...overrides }
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key]
    }
  })
  jest.resetModules()
  return import('./middleware')
}

describe('middleware', () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).atob
    jest.resetModules()
    jest.restoreAllMocks()
  })

  it('returns 500 when basic auth secrets are missing', async () => {
    const { middleware } = await loadMiddleware({
      BASIC_AUTH_USERNAME: undefined,
      BASIC_AUTH_PASSWORD: undefined,
    })

    const response = middleware(createRequest())

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toContain('Authentication configuration missing')
  })

  it('allows requests with matching credentials via Buffer decoding', async () => {
    const encoded = Buffer.from('triage:platform').toString('base64')
    const { middleware } = await loadMiddleware({
      BASIC_AUTH_USERNAME: 'triage',
      BASIC_AUTH_PASSWORD: 'platform',
    })

    const response = middleware(
      createRequest({ authorization: `Basic ${encoded}` })
    )

    expect(response.status).toBe(200)
  })

  it('prompts for credentials when auth fails and uses atob when provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).atob = jest.fn(() => 'wrong:creds')

    const { middleware } = await loadMiddleware({
      BASIC_AUTH_USERNAME: 'triage',
      BASIC_AUTH_PASSWORD: 'platform',
    })

    const response = middleware(
      createRequest({ authorization: 'Basic ZmFrZS1iYXNl' })
    )

    const globalWithAtob = globalThis as unknown as { atob?: jest.Mock }
    expect(globalWithAtob.atob).toHaveBeenCalled()
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toContain('Tech Triage')
    await expect(response.text()).resolves.toContain('Authentication required')
  })
})
