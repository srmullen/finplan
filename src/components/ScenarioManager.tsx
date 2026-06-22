import { useState, type FormEvent } from 'react'
import type { Scenario, Schedule, Account, ScheduleOverride } from '../engine/types'
import { useApp } from '../storage/AppContext'
import { generateId } from '../storage/store'
import type { AppState } from '../storage/store'
import AccountForm from './AccountForm'
import ScheduleForm from './ScheduleForm'

interface Props {
  activeScenarioIds: Set<string>
  onToggleScenario: (id: string) => void
}

function ScenarioEditor({
  scenario,
  state,
  onClose,
}: {
  scenario: Scenario
  state: AppState
  onClose: () => void
}) {
  const { dispatch } = useApp()

  function togglePause(scheduleId: string) {
    const existing = scenario.scheduleOverrides.find(o => o.scheduleId === scheduleId)
    let newOverrides: ScheduleOverride[]
    if (existing) {
      if (existing.paused && Object.keys(existing).length === 2) {
        // Only paused flag left — remove the override entirely
        newOverrides = scenario.scheduleOverrides.filter(o => o.scheduleId !== scheduleId)
      } else {
        newOverrides = scenario.scheduleOverrides.map(o =>
          o.scheduleId === scheduleId ? { ...o, paused: !o.paused } : o,
        )
      }
    } else {
      newOverrides = [...scenario.scheduleOverrides, { scheduleId, paused: true }]
    }
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenario: { ...scenario, scheduleOverrides: newOverrides },
    })
  }

  function setAmountOverride(scheduleId: string, amount: string) {
    const val = parseFloat(amount)
    const existing = scenario.scheduleOverrides.find(o => o.scheduleId === scheduleId)
    let newOverrides: ScheduleOverride[]
    if (isNaN(val)) {
      // Remove amount override
      if (existing) {
        const updated = { ...existing }
        delete updated.amount
        if (Object.keys(updated).length === 1) {
          newOverrides = scenario.scheduleOverrides.filter(o => o.scheduleId !== scheduleId)
        } else {
          newOverrides = scenario.scheduleOverrides.map(o =>
            o.scheduleId === scheduleId ? updated : o,
          )
        }
      } else {
        newOverrides = scenario.scheduleOverrides
      }
    } else if (existing) {
      newOverrides = scenario.scheduleOverrides.map(o =>
        o.scheduleId === scheduleId ? { ...o, amount: val } : o,
      )
    } else {
      newOverrides = [...scenario.scheduleOverrides, { scheduleId, amount: val }]
    }
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenario: { ...scenario, scheduleOverrides: newOverrides },
    })
  }

  function addAccount(account: Account) {
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenario: { ...scenario, additionalAccounts: [...scenario.additionalAccounts, account] },
    })
    setAddingAccount(false)
  }

  function removeAdditionalAccount(id: string) {
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenario: {
        ...scenario,
        additionalAccounts: scenario.additionalAccounts.filter(a => a.id !== id),
      },
    })
  }

  function addSchedule(schedule: Schedule) {
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenario: { ...scenario, additionalSchedules: [...scenario.additionalSchedules, schedule] },
    })
    setAddingSchedule(false)
  }

  function removeAdditionalSchedule(id: string) {
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenario: {
        ...scenario,
        additionalSchedules: scenario.additionalSchedules.filter(s => s.id !== id),
      },
    })
  }

  const [addingAccount, setAddingAccount] = useState(false)
  const [addingSchedule, setAddingSchedule] = useState(false)

  const nodeLabel = (id: string) => {
    const a = state.accounts.find(x => x.id === id)
    if (a) return `${a.name} (${a.owner})`
    const p = state.externalParties.find(x => x.id === id)
    if (p) return p.name
    return id
  }

  const scenarioState: AppState = {
    ...state,
    accounts: [...state.accounts, ...scenario.additionalAccounts],
    schedules: [...state.schedules, ...scenario.additionalSchedules],
  }

  return (
    <div style={styles.editor}>
      <div style={styles.editorHeader}>
        <strong>Editing: {scenario.name}</strong>
        <button style={styles.closeBtn} onClick={onClose}>✕ Done</button>
      </div>

      {state.schedules.length > 0 && (
        <div style={styles.section}>
          <h2>Schedule overrides</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Baseline amount</th>
                <th>Override amount</th>
                <th>Paused</th>
              </tr>
            </thead>
            <tbody>
              {state.schedules.map(s => {
                const ov = scenario.scheduleOverrides.find(o => o.scheduleId === s.id)
                return (
                  <tr key={s.id} style={ov?.paused ? { opacity: 0.45 } : {}}>
                    <td>{nodeLabel(s.sourceId)}</td>
                    <td>{nodeLabel(s.destinationId)}</td>
                    <td>${s.amount.toLocaleString()} / {s.frequency}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={String(s.amount)}
                        value={ov?.amount ?? ''}
                        onChange={e => setAmountOverride(s.id, e.target.value)}
                        style={{ width: '90px' }}
                        disabled={ov?.paused}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={ov?.paused ?? false}
                        onChange={() => togglePause(s.id)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.section}>
        <h2>Additional accounts</h2>
        {scenario.additionalAccounts.map(a => (
          <div key={a.id} style={styles.chip}>
            {a.name} ({a.owner}) — {a.type}
            <button style={styles.removeBtn} onClick={() => removeAdditionalAccount(a.id)}>✕</button>
          </div>
        ))}
        {addingAccount ? (
          <AccountForm
            onSave={addAccount}
            onCancel={() => setAddingAccount(false)}
          />
        ) : (
          <button style={styles.addSmallBtn} onClick={() => setAddingAccount(true)}>
            + Add account
          </button>
        )}
      </div>

      <div style={styles.section}>
        <h2>Additional schedules</h2>
        {scenario.additionalSchedules.map(s => (
          <div key={s.id} style={styles.chip}>
            {nodeLabel(s.sourceId)} → ${s.amount} / {s.frequency} → {nodeLabel(s.destinationId)}
            <button style={styles.removeBtn} onClick={() => removeAdditionalSchedule(s.id)}>✕</button>
          </div>
        ))}
        {addingSchedule ? (
          <ScheduleForm
            state={scenarioState}
            onSave={addSchedule}
            onCancel={() => setAddingSchedule(false)}
          />
        ) : (
          <button style={styles.addSmallBtn} onClick={() => setAddingSchedule(true)}>
            + Add schedule
          </button>
        )}
      </div>
    </div>
  )
}

export default function ScenarioManager({ activeScenarioIds, onToggleScenario }: Props) {
  const { state, dispatch } = useApp()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function createScenario(e: FormEvent) {
    e.preventDefault()
    dispatch({
      type: 'ADD_SCENARIO',
      scenario: {
        id: generateId(),
        name: newName.trim(),
        scheduleOverrides: [],
        additionalSchedules: [],
        additionalAccounts: [],
      },
    })
    setNewName('')
  }

  function startRename(scenario: Scenario) {
    setRenamingId(scenario.id)
    setRenameValue(scenario.name)
  }

  function commitRename(scenario: Scenario, e: FormEvent) {
    e.preventDefault()
    dispatch({ type: 'UPDATE_SCENARIO', scenario: { ...scenario, name: renameValue.trim() } })
    setRenamingId(null)
  }

  function deleteScenario(id: string) {
    if (confirm('Delete this scenario?')) {
      dispatch({ type: 'DELETE_SCENARIO', id })
      if (editingId === id) setEditingId(null)
    }
  }

  const editingScenario = editingId ? state.scenarios.find(s => s.id === editingId) : null

  return (
    <div style={styles.manager}>
      <h2>Scenarios</h2>

      <form onSubmit={createScenario} style={styles.createForm}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New scenario name…"
          style={{ flex: 1 }}
        />
        <button type="submit" style={styles.createBtn} disabled={!newName.trim()}>
          Create
        </button>
      </form>

      {state.scenarios.length === 0 ? (
        <p style={styles.empty}>No scenarios yet.</p>
      ) : (
        <div style={styles.list}>
          {state.scenarios.map(s => (
            <div key={s.id} style={styles.row}>
              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={activeScenarioIds.has(s.id)}
                  onChange={() => onToggleScenario(s.id)}
                />
                {renamingId === s.id ? (
                  <form onSubmit={e => commitRename(s, e)} style={{ display: 'inline-flex', gap: '0.25rem' }}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      style={{ width: '140px' }}
                    />
                    <button type="submit" style={styles.tinyBtn}>Save</button>
                    <button type="button" style={styles.tinyBtn} onClick={() => setRenamingId(null)}>✕</button>
                  </form>
                ) : (
                  <span>{s.name}</span>
                )}
              </label>
              <div style={styles.scenarioActions}>
                <button style={styles.tinyBtn} onClick={() => setEditingId(editingId === s.id ? null : s.id)}>
                  {editingId === s.id ? 'Close' : 'Edit'}
                </button>
                <button style={styles.tinyBtn} onClick={() => startRename(s)}>Rename</button>
                <button style={{ ...styles.tinyBtn, color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => deleteScenario(s.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingScenario && (
        <ScenarioEditor
          scenario={editingScenario}
          state={state}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}

const styles = {
  manager: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
  },
  createForm: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' },
  createBtn: {
    padding: '0.4rem 0.75rem',
    border: 'none',
    borderRadius: '4px',
    background: '#1d4ed8',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  list: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', marginBottom: '0.75rem' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' },
  scenarioActions: { display: 'flex', gap: '0.25rem' },
  tinyBtn: {
    padding: '0.15rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '3px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  editor: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
  },
  editorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  closeBtn: {
    padding: '0.2rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '3px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  section: { marginBottom: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem', marginTop: '0.5rem' },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.2rem 0.5rem',
    background: '#e0e7ff',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginRight: '0.5rem',
    marginBottom: '0.25rem',
  },
  removeBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#4338ca',
    fontSize: '0.75rem',
    padding: '0 0.125rem',
  },
  addSmallBtn: {
    padding: '0.2rem 0.5rem',
    border: '1px dashed #9ca3af',
    borderRadius: '3px',
    background: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  empty: { color: '#9ca3af', fontSize: '0.85rem' },
}
