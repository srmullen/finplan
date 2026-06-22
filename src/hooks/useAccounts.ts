import { useState, useEffect, useCallback } from 'react'
import type { Account } from '../engine/types'
import { get, post, put, del } from '../api/client'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])

  const refresh = useCallback(async () => {
    const data = await get<Account[]>('/api/accounts')
    setAccounts(data)
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function addAccount(account: Account) {
    await post('/api/accounts', account)
    await refresh()
  }

  async function updateAccount(account: Account) {
    await put(`/api/accounts/${account.id}`, account)
    await refresh()
  }

  async function deleteAccount(id: string) {
    await del(`/api/accounts/${id}`)
    await refresh()
  }

  return { accounts, addAccount, updateAccount, deleteAccount, refresh }
}
