import type { Account, ExternalParty, Schedule, Adjustment, Scenario } from '../engine/types'

export interface AppState {
  accounts: Account[]
  externalParties: ExternalParty[]
  schedules: Schedule[]
  adjustments: Adjustment[]
  scenarios: Scenario[]
}

const KEY = 'finplan_v1'

const EMPTY: AppState = {
  accounts: [],
  externalParties: [],
  schedules: [],
  adjustments: [],
  scenarios: [],
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...JSON.parse(raw) } as AppState
  } catch {
    return EMPTY
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}
