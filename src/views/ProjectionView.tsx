import { useMemo } from 'react'
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
import type { Account, ExternalParty, Schedule } from '../engine/types'

// Hardcoded dataset to prove the full vertical path
const ACCOUNTS: Account[] = [
  {
    id: 'checking',
    name: 'Checking',
    type: 'checking',
    owner: 'Sean',
    seedBalance: 3000,
    seedDate: '2025-01-01',
    rate: 0,
    amortizing: false,
  },
  {
    id: 'ira',
    name: 'IRA',
    type: 'investment',
    owner: 'Sean',
    seedBalance: 50000,
    seedDate: '2025-01-01',
    rate: 0.08,
    amortizing: false,
  },
  {
    id: 'car_loan',
    name: 'Car Loan',
    type: 'loan',
    owner: 'Sean',
    seedBalance: -8400,
    seedDate: '2025-01-01',
    rate: 0,
    amortizing: true,
  },
]

const EXTERNAL: ExternalParty[] = [{ id: 'employer', name: 'Employer' }]

const SCHEDULES: Schedule[] = [
  {
    id: 'paycheck',
    sourceId: 'employer',
    destinationId: 'checking',
    amount: 3500,
    estimated: false,
    frequency: 'semi-monthly',
    startDate: '2025-01-01',
    terminateAtZero: false,
  },
  {
    id: 'ira_contrib',
    sourceId: 'checking',
    destinationId: 'ira',
    amount: 500,
    estimated: false,
    frequency: 'monthly',
    startDate: '2025-01-15',
    terminateAtZero: false,
  },
  {
    id: 'car_payment',
    sourceId: 'checking',
    destinationId: 'car_loan',
    amount: 700,
    estimated: false,
    frequency: 'monthly',
    startDate: '2025-01-01',
    terminateAtZero: true,
  },
]

const COLORS: Record<string, string> = {
  checking: '#2563eb',
  ira: '#16a34a',
  car_loan: '#dc2626',
}

const ACCOUNT_NAMES: Record<string, string> = {
  checking: 'Checking',
  ira: 'IRA',
  car_loan: 'Car Loan',
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

// Sample monthly from a daily series
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
  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10)

  const result = useMemo(
    () =>
      project({
        accounts: ACCOUNTS,
        externalParties: EXTERNAL,
        schedules: SCHEDULES,
        adjustments: [],
        startDate,
        endDate,
      }),
    [startDate, endDate],
  )

  // Build chart data: one row per sampled date with each account's balance
  const checkingSampled = sampleMonthly(result['checking'] ?? [])
  const chartData = checkingSampled.map(({ date }) => {
    const row: Record<string, string | number> = { date: date.slice(0, 7) }
    for (const id of Object.keys(ACCOUNT_NAMES)) {
      const point = (result[id] ?? []).find(p => p.date === date)
      row[id] = point ? Math.round(point.balance) : 0
    }
    return row
  })

  return (
    <div>
      <h1>Projection — next 12 months</h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Hardcoded dataset · {startDate} → {endDate}
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={v => formatCurrency(Number(v))}
            tick={{ fontSize: 11 }}
            width={90}
          />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
          {Object.entries(ACCOUNT_NAMES).map(([id, name]) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              name={name}
              stroke={COLORS[id]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
