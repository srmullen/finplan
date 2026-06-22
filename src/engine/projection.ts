import type {
  ProjectionInput,
  ProjectionResult,
  Account,
  Schedule,
  Scenario,
  Adjustment,
} from './types'

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000)
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function daysInMonth(year: number, month: number): number {
  // month is 1-indexed; Date.UTC(year, month, 0) = last day of month
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function scheduleFiresOn(schedule: Schedule, date: Date): boolean {
  const start = parseDate(schedule.startDate)
  if (date < start) return false
  if (schedule.endDate && date > parseDate(schedule.endDate)) return false

  const elapsed = daysBetween(start, date)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const startDay = start.getUTCDate()
  const startMonth = start.getUTCMonth() + 1

  switch (schedule.frequency) {
    case 'once':
      return elapsed === 0

    case 'weekly':
      return elapsed % 7 === 0

    case 'biweekly':
      return elapsed % 14 === 0

    case 'semi-monthly': {
      // fires on startDay and startDay+15 (capped to month end) of each month
      const d1 = startDay
      const d2 = Math.min(startDay + 15, daysInMonth(year, month))
      return day === d1 || day === d2
    }

    case 'monthly': {
      const targetDay = Math.min(startDay, daysInMonth(year, month))
      return day === targetDay
    }

    case 'quarterly': {
      const monthOffset =
        (year - start.getUTCFullYear()) * 12 + (month - startMonth)
      if (monthOffset < 0 || monthOffset % 3 !== 0) return false
      const targetDay = Math.min(startDay, daysInMonth(year, month))
      return day === targetDay
    }

    case 'annually': {
      if (year < start.getUTCFullYear()) return false
      const targetDay = Math.min(startDay, daysInMonth(year, month))
      return month === startMonth && day === targetDay
    }
  }
}

function resolveSchedules(baseSchedules: Schedule[], scenario: Scenario | undefined): Schedule[] {
  if (!scenario) return baseSchedules

  const { scheduleOverrides, additionalSchedules } = scenario

  const resolved = baseSchedules
    .filter(s => {
      const ov = scheduleOverrides.find(o => o.scheduleId === s.id)
      return !ov?.paused
    })
    .map(s => {
      const ov = scheduleOverrides.find(o => o.scheduleId === s.id)
      if (!ov) return s
      return {
        ...s,
        ...(ov.amount !== undefined && { amount: ov.amount }),
        ...(ov.endDate !== undefined && { endDate: ov.endDate }),
        ...(ov.terminateAtZero !== undefined && { terminateAtZero: ov.terminateAtZero }),
      }
    })

  return [...resolved, ...additionalSchedules]
}

export function project(input: ProjectionInput): ProjectionResult {
  const { accounts, schedules, adjustments, scenario, startDate, endDate } = input

  const allAccounts: Account[] = scenario
    ? [...accounts, ...scenario.additionalAccounts]
    : accounts

  const resolvedSchedules = resolveSchedules(schedules, scenario)

  // Index adjustments by accountId → sorted by date
  const adjByAccount = new Map<string, Adjustment[]>()
  for (const adj of adjustments) {
    const list = adjByAccount.get(adj.accountId) ?? []
    list.push(adj)
    adjByAccount.set(adj.accountId, list)
  }

  const accountIdSet = new Set(allAccounts.map(a => a.id))
  const accountById = new Map(allAccounts.map(a => [a.id, a]))

  const balances = new Map<string, number>(
    allAccounts.map(a => {
      const adjs = adjByAccount.get(a.id) ?? []
      const latest = adjs
        .filter(adj => adj.date <= startDate)
        .sort((x, y) => y.date.localeCompare(x.date))[0]
      return [a.id, latest ? latest.actualBalance : a.seedBalance]
    }),
  )

  const result: ProjectionResult = Object.fromEntries(allAccounts.map(a => [a.id, []]))

  const start = parseDate(startDate)
  const end = parseDate(endDate)
  let current = start

  while (current <= end) {
    const dateStr = formatDate(current)
    const isFirstDay = current.getTime() === start.getTime()

    for (const account of allAccounts) {
      let balance = balances.get(account.id)!
      const adjs = adjByAccount.get(account.id) ?? []
      const adj = adjs.find(a => a.date === dateStr)

      if (adj) {
        balance = adj.actualBalance
      } else if (!isFirstDay && account.rate !== 0) {
        balance = balance * (1 + account.rate / 365)
      }

      balances.set(account.id, balance)
    }

    for (const schedule of resolvedSchedules) {
      if (!scheduleFiresOn(schedule, current)) continue

      const { sourceId, destinationId, amount, terminateAtZero } = schedule
      const destAccount = accountById.get(destinationId)

      if (terminateAtZero && destAccount?.amortizing) {
        const destBalance = balances.get(destinationId) ?? 0
        if (destBalance >= 0) continue
        // Cap transfer so balance doesn't exceed zero
        const actualAmount = Math.min(amount, -destBalance)
        if (accountIdSet.has(destinationId))
          balances.set(destinationId, destBalance + actualAmount)
        if (accountIdSet.has(sourceId))
          balances.set(sourceId, balances.get(sourceId)! - actualAmount)
      } else {
        if (accountIdSet.has(destinationId))
          balances.set(destinationId, balances.get(destinationId)! + amount)
        if (accountIdSet.has(sourceId))
          balances.set(sourceId, balances.get(sourceId)! - amount)
      }
    }

    for (const account of allAccounts) {
      result[account.id]!.push({ date: dateStr, balance: balances.get(account.id)! })
    }

    current = addDays(current, 1)
  }

  return result
}
