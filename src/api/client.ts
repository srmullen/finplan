const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''
const KEY = (import.meta.env.VITE_API_KEY as string | undefined) ?? ''

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${KEY}`,
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>('POST', path, body)
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>('PUT', path, body)
}

export function del(path: string): Promise<void> {
  return request<void>('DELETE', path)
}
