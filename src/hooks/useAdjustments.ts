import { useState, useEffect, useCallback } from 'react'
import type { Adjustment } from '../engine/types'
import { get, post, del } from '../api/client'

export function useAdjustments() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])

  const refresh = useCallback(async () => {
    const data = await get<Adjustment[]>('/api/adjustments')
    setAdjustments(data)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function addAdjustment(adjustment: Adjustment) {
    await post('/api/adjustments', adjustment)
    await refresh()
  }

  async function deleteAdjustment(id: string) {
    await del(`/api/adjustments/${id}`)
    await refresh()
  }

  return { adjustments, addAdjustment, deleteAdjustment }
}
