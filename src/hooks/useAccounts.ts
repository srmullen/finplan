import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { Account } from '../engine/types'
import { get, post, put, del } from '../api/client'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      const data = await get<Account[]>('/api/accounts')
      setAccounts(data)
      setError(null)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to load accounts: ${e.message}`)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function addAccount(account: Account) {
    try {
      await post('/api/accounts', account)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to add account: ${e.message}`)
      return
    }
    await refresh()
  }

  async function updateAccount(account: Account) {
    try {
      await put(`/api/accounts/${account.id}`, account)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to update account: ${e.message}`)
      return
    }
    await refresh()
  }

  async function deleteAccount(id: string) {
    try {
      await del(`/api/accounts/${id}`)
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      toast.error(`Failed to delete account: ${e.message}`)
      return
    }
    await refresh()
  }

  return { accounts, error, addAccount, updateAccount, deleteAccount, refresh }
}
