import { useState, type FormEvent } from 'react'
import type { Account, AccountType, Owner } from '../engine/types'
import { generateId } from '../storage/store'

interface Props {
  initial?: Account
  onSave: (account: Account) => void
  onCancel: () => void
}

const ACCOUNT_TYPES: AccountType[] = [
  'checking',
  'savings',
  'investment',
  'credit_card',
  'loan',
  'other',
]

const OWNERS: Owner[] = ['Sean', 'Wife', 'Joint']

export default function AccountForm({ initial, onSave, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AccountType>(initial?.type ?? 'checking')
  const [owner, setOwner] = useState<Owner>(initial?.owner ?? 'Sean')
  const [seedBalance, setSeedBalance] = useState(String(initial?.seedBalance ?? '0'))
  const [seedDate, setSeedDate] = useState(initial?.seedDate ?? today)
  const [rate, setRate] = useState(String((initial?.rate ?? 0) * 100))
  const [amortizing, setAmortizing] = useState(initial?.amortizing ?? false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const account: Account = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      type,
      owner,
      seedBalance: parseFloat(seedBalance) || 0,
      seedDate,
      rate: parseFloat(rate) / 100 || 0,
      amortizing,
    }
    onSave(account)
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label>Name</label>
        <input
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Chase Checking"
        />
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label>Type</label>
          <select value={type} onChange={e => setType(e.target.value as AccountType)}>
            {ACCOUNT_TYPES.map(t => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label>Owner</label>
          <select value={owner} onChange={e => setOwner(e.target.value as Owner)}>
            {OWNERS.map(o => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label>Seed balance ($)</label>
          <input
            type="number"
            step="0.01"
            value={seedBalance}
            onChange={e => setSeedBalance(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>As of date</label>
          <input
            type="date"
            value={seedDate}
            onChange={e => setSeedDate(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label>Annual rate (%)</label>
          <input
            type="number"
            step="0.01"
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder="0"
          />
        </div>

        <div style={{ ...styles.field, justifyContent: 'flex-end', paddingTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={amortizing}
              onChange={e => setAmortizing(e.target.checked)}
            />
            Amortizing (balance terminates at zero)
          </label>
        </div>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={onCancel} style={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" style={styles.saveBtn}>
          {initial ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  )
}

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.875rem',
    padding: '1rem',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    marginBottom: '1.5rem',
  },
  row: { display: 'flex', gap: '1rem' },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    gap: '0.25rem',
  },
  actions: { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '0.4rem 0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '0.4rem 0.875rem',
    border: 'none',
    borderRadius: '4px',
    background: '#1d4ed8',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
}
