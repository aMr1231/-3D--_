import { createHash, randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { Role } from './db.ts'

export const SESSION_COOKIE = 'twinline_session'
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export interface SessionUser {
  id: number
  login: string
  role: Role
}

/** В базе хранится только SHA-256 от токена: утечка БД не даёт рабочих сессий. */
const digest = (token: string) => createHash('sha256').update(token).digest('hex')

export function createSession(db: DatabaseSync, userId: number, now = Date.now()): string {
  const token = randomBytes(32).toString('base64url')
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    digest(token),
    userId,
    new Date(now).toISOString(),
    new Date(now + SESSION_TTL_MS).toISOString(),
  )
  return token
}

export function resolveSession(db: DatabaseSync, token: string | undefined, now = Date.now()): SessionUser | null {
  if (!token) return null
  const row = db
    .prepare(
      `SELECT u.id AS id, u.login AS login, u.role AS role, s.expires_at AS expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    )
    .get(digest(token)) as unknown as (SessionUser & { expires_at: string }) | undefined
  if (!row) return null
  if (new Date(row.expires_at).getTime() <= now) {
    deleteSession(db, token)
    return null
  }
  return { id: row.id, login: row.login, role: row.role }
}

export function deleteSession(db: DatabaseSync, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token))
}

export function deleteUserSessions(db: DatabaseSync, userId: number): void {
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId)
}

export function purgeExpiredSessions(db: DatabaseSync, now = Date.now()): void {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date(now).toISOString())
}
