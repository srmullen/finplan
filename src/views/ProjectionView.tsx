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
import AdjustmentPanel from '../components/AdjustmentPanel'
import ScenarioManager from '../components/ScenarioManager'

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

function sampleMonthly(series: { date: string; balance: number }[]) {
  const seen = new Set<string>()
  return series.filter(p => {
    const ym = p.date.slice(0, 7)
    if (seen.has(ym)) return false
    seen.add(ym)
    return true
  })
}

function findCrossings(
  series: { date: string; balance: number }[],
  threshold: number,
  direction: 'up' | 'down',
): string[] {
  const dates: string[] = []
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]!.balance
    const curr = series[i]!.balance
    if (direction === 'up' && prev < threshold && curr >= threshold) dates.push(series[i]!.date)
    if (direction === 'down' && prev >= threshold && curr < threshold) dates.push(series[i]!.date)
  }
  return dates
}

export default function ProjectionView() {
  const { state } = useApp()
  const [horizonMonths, setHorizonMonths] = useState(12)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [showAdjustments, setShowAdjustments] = useState(false)
  const [showScenarios, setShowScenarios] = useState(false)
  const [activeScenarioIds, setActiveScenarioIds] = useState<Set<string>>(new Set())

  const today = new Date()
  const startDate = today.toISOString().slice(0, 10)
  const endDate = new Date(today.getFullYear(), today.getMonth() + horizonMonths, today.getDate())
    .toISOString()
    .slice(0, 10)

  const baseInput = {
    accounts: state.accounts,
    externalParties: state.externalParties,
    schedules: state.schedules,
    adjustments: state.adjustments,
    startDate,
    endDate,
  }

  const result = useMemo(
    () => (state.accounts.length === 0 ? {} : project(baseInput)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- baseInput is an object literal rebuilt every render; listing it would cause an infinite loop
    [state, startDate, endDate],
  )

  const baselineNoAdj = useMemo(
    () =>
      state.accounts.length === 0
        ? {}
        : project({ ...baseInput, adjustments: [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- baseInput is an object literal rebuilt every render; listing it would cause an infinite loop
    [state.accounts, state.externalParties, state.schedules, startDate, endDate],
  )

  // Run each active scenario
  const scenarioResults = useMemo(() => {
    const out: Record<string, ReturnType<typeof project>> = {}
    for (const sc of state.scenarios) {
      if (!activeScenarioIds.has(sc.id)) continue
      out[sc.id] = project({ ...baseInput, scenario: sc })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps -- baseInput is an object literal rebuilt every render; listing it would cause an infinite loop
  }, [state, activeScenarioIds, startDate, endDate])

  const visibleAccounts = state.accounts.filter(a => !hiddenIds.has(a.id))

  const refSeries =
    visibleAccounts.length > 0 ? sampleMonthly(result[visibleAccounts[0]!.id] ?? []) : []

  const chartData = refSeries.map(({ date }) => {
    const row: Record<string, string | number> = { date: date.slice(0, 7) }
    for (const account of visibleAccounts) {
      const point = (result[account.id] ?? []).find(p => p.date === date)
      row[account.id] = point ? Math.round(point.balance) : 0
      // Scenario overlays per account
      for (const [scId, scResult] of Object.entries(scenarioResults)) {
        const scPoint = (scResult[account.id] ?? []).find(p => p.date === date)
        row[`${account.id}_${scId}`] = scPoint ? Math.round(scPoint.balance) : 0
      }
    }
    return row
  })

  const milestones: { date: string; label: string; color: string }[] = []
  for (const account of visibleAccounts) {
    const series = result[account.id] ?? []
    if (account.amortizing) {
      for (const date of findCrossings(series, 0, 'up')) {
        milestones.push({ date: date.slice(0, 7), label: `${account.name} paid off`, color: '#16a34a' })
      }
    }
    for (const date of findCrossings(series, 0, 'down')) {
      milestones.push({ date: date.slice(0, 7), label: `${account.name} negative`, color: '#dc2626' })
    }
  }

  function toggleAccount(id: string) {
    setHiddenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleScenario(id: string) {
    setActiveScenarioIds(prev => {
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
            <select value={horizonMonths} onChange={e => setHorizonMonths(Number(e.target.value))}>
              {[3, 6, 12, 24, 36, 60].map(m => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </label>
          <button style={styles.panelBtn} onClick={() => setShowScenarios(v => !v)}>
            Scenarios{activeScenarioIds.size > 0 ? ` (${activeScenarioIds.size})` : ''}
          </button>
          <button style={styles.panelBtn} onClick={() => setShowAdjustments(v => !v)}>
            Adjustments
          </button>
        </div>
      </div>

      {state.accounts.length === 0 ? (
        <p style={styles.empty}>No accounts yet. Add accounts and schedules to see a projection.</p>
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

          {milestones.length > 0 && (
            <div style={styles.milestones}>
              {milestones.map((m, i) => (
                <span key={i} style={{ ...styles.milestone, color: m.color }}>
                  ● {m.label} ({m.date})
                </span>
              ))}
            </div>
          )}

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
              {milestones.map((m, i) => (
                <ReferenceLine
                  key={i}
                  x={m.date}
                  stroke={m.color}
                  strokeDasharray="4 2"
                  strokeWidth={1}
                />
              ))}
              {/* Baseline lines */}
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
              {/* Scenario overlay lines (dashed) */}
              {state.scenarios
                .filter(sc => activeScenarioIds.has(sc.id))
                .flatMap(sc =>
                  visibleAccounts.map((a, i) => (
                    <Line
                      key={`${a.id}_${sc.id}`}
                      type="monotone"
                      dataKey={`${a.id}_${sc.id}`}
                      name={`${a.name} (${sc.name})`}
                      stroke={PALETTE[i % PALETTE.length]}
                      dot={false}
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                    />
                  )),
                )}
            </LineChart>
          </ResponsiveContainer>

          {showScenarios && (
            <ScenarioManager
              activeScenarioIds={activeScenarioIds}
              onToggleScenario={toggleScenario}
            />
          )}

          {showAdjustments && (
            <AdjustmentPanel
              accounts={state.accounts}
              adjustments={state.adjustments}
              baselineResult={baselineNoAdj}
            />
          )}
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
  controls: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  panelBtn: {
    padding: '0.35rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
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
  milestones: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginBottom: '0.75rem',
    fontSize: '0.8rem',
  },
  milestone: { fontWeight: 500 },
  empty: { color: '#9ca3af' },
}
