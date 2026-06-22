import { useState, type FormEvent } from 'react'
import type { ExternalParty } from '../engine/types'
import { generateId } from '../utils/id'

interface Props {
  initial?: ExternalParty
  onSave: (party: ExternalParty) => void
  onCancel: () => void
}

export default function ExternalPartyForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({ id: initial?.id ?? generateId(), name: name.trim() })
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label>Name</label>
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Employer, Electric Company"
          autoFocus
        />
      </div>
      <div style={styles.actions}>
        <button type="button" onClick={onCancel} style={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" style={styles.saveBtn}>
          {initial ? 'Save changes' : 'Add external party'}
        </button>
      </div>
    </form>
  )
}

const styles = {
  form: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
    padding: '0.75rem 1rem',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    gap: '0.25rem',
  },
  actions: { display: 'flex', gap: '0.5rem' },
  cancelBtn: {
    padding: '0.4rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  saveBtn: {
    padding: '0.4rem 0.75rem',
    border: 'none',
    borderRadius: '4px',
    background: '#1d4ed8',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
}
