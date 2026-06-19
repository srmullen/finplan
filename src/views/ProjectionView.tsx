import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { project } from '../engine/projection'
import { useApp } from '../storage/AppContext'

const PALETTE = [
  '#2563eb', '#16a34a', '#dc2626', '#9333ea',
  '#ca8a04', '#0891b2', '#c2410c', '#4f46e5',
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

// Sample one point per month (first entry of each month)
function sampleMonthly(series: { date: string; balance: number }[]) {
  const seen = new Set<string>()
  return series.filter(p => {
    const ym = p.date.slice(0, 7)
    if (seen.has(ym)) return false
    seen.add(ym)
    return true
  })
}

export default function ProjectionView() {
  const { state } = useApp()
  const [horizonMonths, setHorizonMonths] = useState(12)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDate = new Date(today.getFullYear(), today.getMonth() + horizonMonths, today.getDate())
    .toISOString()
    .slice(0, 10)

  const result = useMemo(
    () =>
      state.accounts.length === 0
        ? {}
        : project({
            accounts: state.accounts,
            externalParties: state.externalParties,
            schedules: state.schedules,
            adjustments: state.adjustments,
            startDate,
            endDate,
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, startDate, endDate],
  )

  const visibleAccounts = state.accounts.filter(a => !hiddenIds.has(a.id))

  // Build chart rows from the first account's sampled dates
  const refSeries =
    visibleAccounts.length > 0 ? sampleMonthly(result[visibleAccounts[0]!.id] ?? []) : []

  const chartData = refSeries.map(({ date }) => {
    const row: Record<string, string | number> = { date: date.slice(0, 7) }
    for (const account of visibleAccounts) {
      const point = (result[account.id] ?? []).find(p => p.date === date)
      row[account.id] = point ? Math.round(point.balance) : 0
    }
    return row
  })

  function toggleAccount(id: string) {
    setHiddenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div style={styles.header}>
        <h1>Projection</h1>
        <div style={styles.controls}>
          <label>
            Horizon:{' '}
            <select
              value={horizonMonths}
              onChange={e => setHorizonMonths(Number(e.target.value))}
              style={styles.select}
            >
              {[3, 6, 12, 24, 36, 60].map(m => (
                <option key={m} value={m}>
                  {m} months
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {state.accounts.length === 0 ? (
        <p style={styles.empty}>
          No accounts yet. Add accounts and schedules to see a projection.
        </p>
      ) : (
        <>
          <div style={styles.filter}>
            {state.accounts.map((a, i) => (
              <label key={a.id} style={styles.filterLabel}>
                <input
                  type="checkbox"
                  checked={!hiddenIds.has(a.id)}
                  onChange={() => toggleAccount(a.id)}
                />
                <span style={{ color: PALETTE[i % PALETTE.length] }}>{a.name}</span>
              </label>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={420}>
            <LineChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={v => formatCurrency(Number(v))}
                tick={{ fontSize: 11 }}
                width={90}
              />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
              {visibleAccounts.map((a, i) => (
                <Line
                  key={a.id}
                  type="monotone"
                  dataKey={a.id}
                  name={a.name}
                  stroke={PALETTE[i % PALETTE.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  controls: { display: 'flex', gap: '1rem', alignItems: 'center' },
  select: { marginLeft: '0.25rem' },
  filter: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  empty: { color: '#9ca3af' },
}
