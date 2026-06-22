import { Database } from 'bun:sqlite'

const db = new Database(process.env.DB_PATH ?? 'finplan.db', { create: true })

db.run(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    owner TEXT NOT NULL,
    seed_balance REAL NOT NULL DEFAULT 0,
    seed_date TEXT NOT NULL,
    rate REAL NOT NULL DEFAULT 0,
    amortizing INTEGER NOT NULL DEFAULT 0
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS external_parties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    amount REAL NOT NULL,
    estimated INTEGER NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    terminate_at_zero INTEGER NOT NULL DEFAULT 0
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS adjustments (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    date TEXT NOT NULL,
    actual_balance REAL NOT NULL
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    schedule_overrides TEXT NOT NULL DEFAULT '[]',
    additional_schedules TEXT NOT NULL DEFAULT '[]',
    additional_accounts TEXT NOT NULL DEFAULT '[]'
  )
`)

export default db
