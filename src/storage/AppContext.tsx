import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type Dispatch,
  type ReactNode,
} from 'react'
import { loadState, saveState, type AppState } from './store'
import type { Account, ExternalParty, Schedule, Adjustment, Scenario } from '../engine/types'

// --- Actions ---

type Action =
  | { type: 'ADD_ACCOUNT'; account: Account }
  | { type: 'UPDATE_ACCOUNT'; account: Account }
  | { type: 'DELETE_ACCOUNT'; id: string }
  | { type: 'ADD_PARTY'; party: ExternalParty }
  | { type: 'UPDATE_PARTY'; party: ExternalParty }
  | { type: 'DELETE_PARTY'; id: string }
  | { type: 'ADD_SCHEDULE'; schedule: Schedule }
  | { type: 'UPDATE_SCHEDULE'; schedule: Schedule }
  | { type: 'DELETE_SCHEDULE'; id: string }
  | { type: 'ADD_ADJUSTMENT'; adjustment: Adjustment }
  | { type: 'DELETE_ADJUSTMENT'; id: string }
  | { type: 'ADD_SCENARIO'; scenario: Scenario }
  | { type: 'UPDATE_SCENARIO'; scenario: Scenario }
  | { type: 'DELETE_SCENARIO'; id: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.account] }
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(a => (a.id === action.account.id ? action.account : a)),
      }
    case 'DELETE_ACCOUNT':
      return { ...state, accounts: state.accounts.filter(a => a.id !== action.id) }

    case 'ADD_PARTY':
      return { ...state, externalParties: [...state.externalParties, action.party] }
    case 'UPDATE_PARTY':
      return {
        ...state,
        externalParties: state.externalParties.map(p =>
          p.id === action.party.id ? action.party : p,
        ),
      }
    case 'DELETE_PARTY':
      return { ...state, externalParties: state.externalParties.filter(p => p.id !== action.id) }

    case 'ADD_SCHEDULE':
      return { ...state, schedules: [...state.schedules, action.schedule] }
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(s => (s.id === action.schedule.id ? action.schedule : s)),
      }
    case 'DELETE_SCHEDULE':
      return { ...state, schedules: state.schedules.filter(s => s.id !== action.id) }

    case 'ADD_ADJUSTMENT':
      return { ...state, adjustments: [...state.adjustments, action.adjustment] }
    case 'DELETE_ADJUSTMENT':
      return {
        ...state,
        adjustments: state.adjustments.filter(a => a.id !== action.id),
      }

    case 'ADD_SCENARIO':
      return { ...state, scenarios: [...state.scenarios, action.scenario] }
    case 'UPDATE_SCENARIO':
      return {
        ...state,
        scenarios: state.scenarios.map(s => (s.id === action.scenario.id ? action.scenario : s)),
      }
    case 'DELETE_SCENARIO':
      return { ...state, scenarios: state.scenarios.filter(s => s.id !== action.id) }
  }
}

// --- Context ---

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
