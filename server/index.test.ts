import { describe, it, expect, vi } from 'vitest'

vi.mock('bun:sqlite', () => ({
  Database: class {
    run() {}
    prepare() {
      return { run: () => {}, get: () => null, all: () => [] }
    }
  },
}))

vi.hoisted(() => {
  process.env.FINPLAN_API_KEY = 'test-key'
})

import server from './index'

const AUTH = 'Bearer test-key'

function put(path: string, body: unknown) {
  return server.fetch(
    new Request(`http://localhost${path}`, {
      method: 'PUT',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

describe('PUT /api/accounts/:id — ID mismatch guard', () => {
  const account = {
    id: 'acc-1',
    name: 'Checking',
    type: 'checking',
    owner: 'Sean',
    seedBalance: 1000,
    seedDate: '2024-01-01',
    rate: 0,
    amortizing: false,
  }

  it('returns 400 when body.id does not match URL :id', async () => {
    const res = await put('/api/accounts/acc-1', { ...account, id: 'wrong' })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('returns 200 when body.id matches URL :id', async () => {
    const res = await put('/api/accounts/acc-1', account)
    expect(res.status).toBe(200)
  })
})

describe('PUT /api/external-parties/:id — ID mismatch guard', () => {
  const party = { id: 'party-1', name: 'Employer' }

  it('returns 400 when body.id does not match URL :id', async () => {
    const res = await put('/api/external-parties/party-1', { ...party, id: 'wrong' })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('returns 200 when body.id matches URL :id', async () => {
    const res = await put('/api/external-parties/party-1', party)
    expect(res.status).toBe(200)
  })
})

describe('PUT /api/schedules/:id — ID mismatch guard', () => {
  const schedule = {
    id: 'sched-1',
    sourceId: 'party-1',
    destinationId: 'acc-1',
    amount: 500,
    estimated: false,
    frequency: 'monthly',
    startDate: '2024-01-01',
    terminateAtZero: false,
  }

  it('returns 400 when body.id does not match URL :id', async () => {
    const res = await put('/api/schedules/sched-1', { ...schedule, id: 'wrong' })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('returns 200 when body.id matches URL :id', async () => {
    const res = await put('/api/schedules/sched-1', schedule)
    expect(res.status).toBe(200)
  })
})

describe('PUT /api/scenarios/:id — ID mismatch guard', () => {
  const scenario = {
    id: 'scenario-1',
    name: 'Test Scenario',
    scheduleOverrides: [],
    additionalSchedules: [],
    additionalAccounts: [],
  }

  it('returns 400 when body.id does not match URL :id', async () => {
    const res = await put('/api/scenarios/scenario-1', { ...scenario, id: 'wrong' })
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.any(String) })
  })

  it('returns 200 when body.id matches URL :id', async () => {
    const res = await put('/api/scenarios/scenario-1', scenario)
    expect(res.status).toBe(200)
  })
})
