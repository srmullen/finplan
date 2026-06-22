import { useState, useEffect, useCallback } from 'react'
import type { Scenario } from '../engine/types'
import { get, post, put, del } from '../api/client'

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])

  const refresh = useCallback(async () => {
    const data = await get<Scenario[]>('/api/scenarios')
    setScenarios(data)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function addScenario(scenario: Scenario) {
    await post('/api/scenarios', scenario)
    await refresh()
  }

  async function updateScenario(scenario: Scenario) {
    await put(`/api/scenarios/${scenario.id}`, scenario)
    await refresh()
  }

  async function deleteScenario(id: string) {
    await del(`/api/scenarios/${id}`)
    await refresh()
  }

  return { scenarios, addScenario, updateScenario, deleteScenario }
}
