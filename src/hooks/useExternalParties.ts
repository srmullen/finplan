import { useState, useEffect, useCallback } from 'react'
import type { ExternalParty } from '../engine/types'
import { get, post, put, del } from '../api/client'

export function useExternalParties() {
  const [externalParties, setExternalParties] = useState<ExternalParty[]>([])

  const refresh = useCallback(async () => {
    const data = await get<ExternalParty[]>('/api/external-parties')
    setExternalParties(data)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function addParty(party: ExternalParty) {
    await post('/api/external-parties', party)
    await refresh()
  }

  async function updateParty(party: ExternalParty) {
    await put(`/api/external-parties/${party.id}`, party)
    await refresh()
  }

  async function deleteParty(id: string) {
    await del(`/api/external-parties/${id}`)
    await refresh()
  }

  return { externalParties, addParty, updateParty, deleteParty }
}
