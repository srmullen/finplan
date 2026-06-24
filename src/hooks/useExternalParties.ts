import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { ExternalParty } from '../engine/types'
import { get, post, put, del } from '../api/client'

export function useExternalParties() {
  const [externalParties, setExternalParties] = useState<ExternalParty[]>([])
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await get<ExternalParty[]>('/api/external-parties')
      setExternalParties(data)
      setError(null)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to load external parties: ${e.message}`)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function addParty(party: ExternalParty) {
    try {
      await post('/api/external-parties', party)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to add external party: ${e.message}`)
      return
    }
    await refresh()
  }

  async function updateParty(party: ExternalParty) {
    try {
      await put(`/api/external-parties/${party.id}`, party)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to update external party: ${e.message}`)
      return
    }
    await refresh()
  }

  async function deleteParty(id: string) {
    try {
      await del(`/api/external-parties/${id}`)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to delete external party: ${e.message}`)
      return
    }
    await refresh()
  }

  return { externalParties, error, addParty, updateParty, deleteParty }
}
