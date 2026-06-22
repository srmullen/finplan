import { useState } from 'react'
import type { Account, ExternalParty, Owner } from '../engine/types'
import { useAccounts } from '../hooks/useAccounts'
import { useExternalParties } from '../hooks/useExternalParties'
import AccountForm from '../components/AccountForm'
import ExternalPartyForm from '../components/ExternalPartyForm'

const OWNERS: Owner[] = ['Sean', 'Wife', 'Joint']

function formatBalance(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function AccountsView() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts()
  const { externalParties, addParty, updateParty, deleteParty } = useExternalParties()
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showPartyForm, setShowPartyForm] = useState(false)
  const [editingParty, setEditingParty] = useState<ExternalParty | null>(null)

  function saveAccount(account: Account) {
    if (editingAccount) {
      void updateAccount(account)
      setEditingAccount(null)
    } else {
      void addAccount(account)
      setShowAccountForm(false)
    }
  }

  function handleDeleteAccount(id: string) {
    if (confirm('Delete this account?')) {
      void deleteAccount(id)
    }
  }

  function saveParty(party: ExternalParty) {
    if (editingParty) {
      void updateParty(party)
      setEditingParty(null)
    } else {
      void addParty(party)
      setShowPartyForm(false)
    }
  }

  function handleDeleteParty(id: string) {
    if (confirm('Delete this external party?')) {
      void deleteParty(id)
    }
  }

  const accountsByOwner = OWNERS.map(owner => ({
    owner,
    accounts: accounts.filter(a => a.owner === owner),
  })).filter(g => g.accounts.length > 0)

  return (
    <div>
      <h1>Accounts</h1>

      {(showAccountForm || editingAccount) && (
        <AccountForm
          initial={editingAccount ?? undefined}
          onSave={saveAccount}
          onCancel={() => {
            setShowAccountForm(false)
            setEditingAccount(null)
          }}
        />
      )}

      {!showAccountForm && !editingAccount && (
        <button style={styles.addBtn} onClick={() => setShowAccountForm(true)}>
          + Add account
        </button>
      )}

      {accounts.length === 0 ? (
        <p style={styles.empty}>No accounts yet. Add one above.</p>
      ) : (
        accountsByOwner.map(({ owner, accounts: ownerAccounts }) => (
          <div key={owner} style={styles.group}>
            <h2>{owner}</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>As of</th>
                  <th>Rate</th>
                  <th>Kind</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ownerAccounts.map(a => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.type.replace('_', ' ')}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ color: a.seedBalance < 0 ? '#dc2626' : undefined }}>
                        {formatBalance(a.seedBalance)}
                      </span>
                    </td>
                    <td>{a.seedDate}</td>
                    <td>
                      {a.rate !== 0
                        ? `${(a.rate * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td>{a.amortizing ? 'amortizing' : 'revolving'}</td>
                    <td style={styles.actions}>
                      <button
                        style={styles.editBtn}
                        onClick={() => {
                          setShowAccountForm(false)
                          setEditingAccount(a)
                        }}
                      >
                        Edit
                      </button>
                      <button style={styles.deleteBtn} onClick={() => handleDeleteAccount(a.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      <hr style={styles.divider} />

      <h1>External Parties</h1>

      {(showPartyForm || editingParty) && (
        <ExternalPartyForm
          initial={editingParty ?? undefined}
          onSave={saveParty}
          onCancel={() => {
            setShowPartyForm(false)
            setEditingParty(null)
          }}
        />
      )}

      {!showPartyForm && !editingParty && (
        <button style={styles.addBtn} onClick={() => setShowPartyForm(true)}>
          + Add external party
        </button>
      )}

      {externalParties.length === 0 ? (
        <p style={styles.empty}>No external parties yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {externalParties.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td style={styles.actions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => {
                      setShowPartyForm(false)
                      setEditingParty(p)
                    }}
                  >
                    Edit
                  </button>
                  <button style={styles.deleteBtn} onClick={() => handleDeleteParty(p.id)}>
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
  group: { marginBottom: '1.5rem' },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
  },
  actions: { textAlign: 'right' as const, display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' },
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
  empty: { color: '#9ca3af', marginBottom: '1.5rem' },
  divider: { margin: '2rem 0', borderColor: '#e5e7eb' },
}
