import { useState } from 'react'
import type { Schedule } from '../engine/types'
import { useApp } from '../storage/AppContext'
import ScheduleForm from '../components/ScheduleForm'

export default function SchedulesView() {
  const { state, dispatch } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)

  const nodeLabel = (id: string) => {
    const account = state.accounts.find(a => a.id === id)
    if (account) return `${account.name} (${account.owner})`
    const party = state.externalParties.find(p => p.id === id)
    if (party) return party.name
    return id
  }

  function saveSchedule(schedule: Schedule) {
    if (editing) {
      dispatch({ type: 'UPDATE_SCHEDULE', schedule })
      setEditing(null)
    } else {
      dispatch({ type: 'ADD_SCHEDULE', schedule })
      setShowForm(false)
    }
  }

  function deleteSchedule(id: string) {
    if (confirm('Delete this schedule?')) {
      dispatch({ type: 'DELETE_SCHEDULE', id })
    }
  }

  const noNodes = state.accounts.length + state.externalParties.length < 2

  return (
    <div>
      <h1>Schedules</h1>

      {(showForm || editing) && (
        <ScheduleForm
          initial={editing ?? undefined}
          state={state}
          onSave={saveSchedule}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}

      {!showForm && !editing && (
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(true)}
          disabled={noNodes}
          title={noNodes ? 'Add at least two accounts or external parties first' : undefined}
        >
          + Add schedule
        </button>
      )}

      {noNodes && (
        <p style={styles.hint}>
          You need at least two nodes (accounts or external parties) before creating a schedule.
        </p>
      )}

      {state.schedules.length === 0 ? (
        <p style={styles.empty}>No schedules yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>From</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>To</th>
              <th>Start</th>
              <th>End</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.schedules.map(s => (
              <tr key={s.id}>
                <td>{nodeLabel(s.sourceId)}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  ${s.amount.toLocaleString()}{s.estimated ? ' ~' : ''}
                </td>
                <td>{s.frequency}</td>
                <td>{nodeLabel(s.destinationId)}</td>
                <td>{s.startDate}</td>
                <td>{s.endDate ?? '—'}</td>
                <td style={styles.actions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => {
                      setShowForm(false)
                      setEditing(s)
                    }}
                  >
                    Edit
                  </button>
                  <button style={styles.deleteBtn} onClick={() => deleteSchedule(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

const styles = {
  addBtn: {
    padding: '0.4rem 0.875rem',
    border: '1px dashed #9ca3af',
    borderRadius: '4px',
    background: 'none',
    cursor: 'pointer',
    color: '#374151',
    marginBottom: '1rem',
    display: 'block',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
  },
  actions: {
    textAlign: 'right' as const,
    display: 'flex',
    gap: '0.25rem',
    justifyContent: 'flex-end',
  },
  editBtn: {
    padding: '0.2rem 0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '3px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  deleteBtn: {
    padding: '0.2rem 0.5rem',
    border: '1px solid #fca5a5',
    borderRadius: '3px',
    background: '#fff',
    cursor: 'pointer',
    color: '#dc2626',
    fontSize: '0.8rem',
  },
  empty: { color: '#9ca3af' },
  hint: { color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem' },
}
