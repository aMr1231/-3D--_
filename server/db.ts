import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { hashPassword } from './passwords.ts'

export type Role = 'manager' | 'guest'

export interface UserRow {
  id: number
  login: string
  role: Role
  password_hash: string
  created_at: string
}

/**
 * База SQLite (встроена в Node.js). Хранятся только логин, хеш пароля, роль и сессии —
 * без ФИО, e-mail и телефонов (минимизация персональных данных, 152-ФЗ).
 */
export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      login         TEXT NOT NULL UNIQUE,
      role          TEXT NOT NULL CHECK (role IN ('manager', 'guest')),
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL,
      expires_at  TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  `)
  return db
}

/** Демо-учётки для жюри создаются при первом запуске, если их ещё нет. */
export const SEED_USERS: { login: string; password: string; role: Role }[] = [
  { login: 'manager', password: 'demo', role: 'manager' },
  { login: 'guest', password: 'tour', role: 'guest' },
]

export async function seedUsers(db: DatabaseSync, users = SEED_USERS): Promise<void> {
  const exists = db.prepare('SELECT 1 FROM users WHERE login = ?')
  const insert = db.prepare('INSERT INTO users (login, role, password_hash) VALUES (?, ?, ?)')
  for (const u of users) {
    if (exists.get(u.login)) continue
    insert.run(u.login, u.role, await hashPassword(u.password))
  }
}
