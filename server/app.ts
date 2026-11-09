import express, { type NextFunction, type Request, type Response } from 'express'
import type { DatabaseSync } from 'node:sqlite'
import type { Role, UserRow } from './db.ts'
import { hashPassword, verifyPassword } from './passwords.ts'
import { RateLimiter } from './rateLimit.ts'
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  deleteSession,
  deleteUserSessions,
  resolveSession,
  type SessionUser,
} from './sessions.ts'
import { normalizeLogin, validateLogin, validatePassword } from './validation.ts'

export interface AppOptions {
  /** Ставить флаг Secure у cookie (включать за HTTPS). */
  secureCookies?: boolean
}

interface AuthedRequest extends Request {
  user?: SessionUser
  sessionToken?: string
}

const ROLES: Role[] = ['manager', 'guest']

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return undefined
}

const publicUser = (u: { id: number; login: string; role: Role }) => ({ id: u.id, login: u.login, role: u.role })

/** HTTP API авторизации и управления пользователями. */
export function createApp(db: DatabaseSync, options: AppOptions = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 'loopback')
  app.use(express.json({ limit: '10kb' }))

  const loginLimiter = new RateLimiter(5, 15 * 60 * 1000)
  const registerLimiter = new RateLimiter(10, 60 * 60 * 1000)
  // Хеш для выравнивания времени ответа, если логин не найден.
  const dummyHash = hashPassword('timing-equalizer-password-1')

  const setSessionCookie = (res: Response, token: string) =>
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !!options.secureCookies,
      maxAge: SESSION_TTL_MS,
      path: '/',
    })
  const clearSessionCookie = (res: Response) =>
    res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: !!options.secureCookies, path: '/' })

  // Защита от CSRF: изменяющие запросы принимаются только как JSON и только с того же origin.
  app.use('/api', (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next()
    const origin = req.headers.origin
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: 'Запрос с чужого источника отклонён.' })
      } catch {
        return res.status(403).json({ error: 'Некорректный заголовок Origin.' })
      }
    }
    if (req.method !== 'DELETE' && !req.is('application/json')) {
      return res.status(415).json({ error: 'Ожидается JSON.' })
    }
    next()
  })

  // Сессия: роль читается из БД на каждом запросе, поэтому смена роли действует сразу.
  app.use('/api', (req: AuthedRequest, _res, next) => {
    const token = readCookie(req, SESSION_COOKIE)
    const user = resolveSession(db, token)
    if (user && token) {
      req.user = user
      req.sessionToken = token
    }
    next()
  })

  const requireUser = (req: AuthedRequest, res: Response, next: NextFunction) =>
    req.user ? next() : res.status(401).json({ error: 'Требуется вход в систему.' })
  const requireRole = (role: Role) => (req: AuthedRequest, res: Response, next: NextFunction) =>
    req.user?.role === role ? next() : res.status(403).json({ error: 'Недостаточно прав.' })

  /* ───────── Авторизация ───────── */

  app.post('/api/auth/register', async (req: AuthedRequest, res) => {
    const ipKey = `reg|${req.ip}`
    const wait = registerLimiter.blockedFor(ipKey)
    if (wait) return res.status(429).json({ error: `Слишком много регистраций. Повторите через ${Math.ceil(wait / 60000)} мин.` })

    const login = normalizeLogin(req.body?.login)
    const loginError = validateLogin(login)
    if (loginError) return res.status(400).json({ error: loginError, field: 'login' })
    const passwordError = validatePassword(req.body?.password, login)
    if (passwordError) return res.status(400).json({ error: passwordError, field: 'password' })

    if (db.prepare('SELECT 1 FROM users WHERE login = ?').get(login)) {
      return res.status(409).json({ error: 'Этот логин уже занят.', field: 'login' })
    }
    registerLimiter.fail(ipKey)
    const hash = await hashPassword(req.body.password)
    const result = db.prepare("INSERT INTO users (login, role, password_hash) VALUES (?, 'guest', ?)").run(login, hash)
    const user = { id: Number(result.lastInsertRowid), login, role: 'guest' as Role }
    setSessionCookie(res, createSession(db, user.id))
    res.status(201).json({ user: publicUser(user) })
  })

  app.post('/api/auth/login', async (req: AuthedRequest, res) => {
    const login = normalizeLogin(req.body?.login)
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль.' })

    const key = `login|${req.ip}|${login}`
    const wait = loginLimiter.blockedFor(key)
    if (wait) return res.status(429).json({ error: `Слишком много неудачных попыток. Повторите через ${Math.ceil(wait / 60000)} мин.` })

    const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as unknown as UserRow | undefined
    const ok = await verifyPassword(password, row ? row.password_hash : await dummyHash)
    if (!row || !ok) {
      loginLimiter.fail(key)
      return res.status(401).json({ error: 'Неверный логин или пароль.' })
    }
    loginLimiter.reset(key)
    if (req.sessionToken) deleteSession(db, req.sessionToken)
    setSessionCookie(res, createSession(db, row.id))
    res.json({ user: publicUser(row) })
  })

  app.post('/api/auth/logout', (req: AuthedRequest, res) => {
    if (req.sessionToken) deleteSession(db, req.sessionToken)
    clearSessionCookie(res)
    res.status(204).end()
  })

  app.get('/api/auth/me', requireUser, (req: AuthedRequest, res) => {
    res.json({ user: publicUser(req.user!) })
  })

  app.post('/api/auth/password', requireUser, async (req: AuthedRequest, res) => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as unknown as UserRow
    if (!(await verifyPassword(String(req.body?.currentPassword ?? ''), row.password_hash))) {
      return res.status(400).json({ error: 'Текущий пароль указан неверно.', field: 'currentPassword' })
    }
    const error = validatePassword(req.body?.newPassword, row.login)
    if (error) return res.status(400).json({ error, field: 'newPassword' })
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(req.body.newPassword), row.id)
    // Остальные сессии пользователя завершаются, текущая продолжает работать.
    deleteUserSessions(db, row.id)
    setSessionCookie(res, createSession(db, row.id))
    res.status(204).end()
  })

  /* ───────── Пользователи (только руководитель) ───────── */

  app.get('/api/users', requireUser, requireRole('manager'), (_req, res) => {
    const rows = db.prepare('SELECT id, login, role, created_at FROM users ORDER BY created_at, id').all() as unknown as Omit<UserRow, 'password_hash'>[]
    res.json({ users: rows.map((r) => ({ id: r.id, login: r.login, role: r.role, createdAt: r.created_at })) })
  })

  const managersCount = () => (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'manager'").get() as unknown as { n: number }).n

  app.patch('/api/users/:id', requireUser, requireRole('manager'), (req: AuthedRequest, res) => {
    const id = Number(req.params.id)
    const role = req.body?.role as Role
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Неизвестная роль.' })
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow | undefined
    if (!target) return res.status(404).json({ error: 'Пользователь не найден.' })
    if (target.id === req.user!.id) return res.status(400).json({ error: 'Нельзя изменить собственную роль.' })
    if (target.role === 'manager' && role !== 'manager' && managersCount() <= 1) {
      return res.status(400).json({ error: 'В системе должен остаться хотя бы один руководитель.' })
    }
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
    res.json({ user: publicUser({ ...target, role }) })
  })

  app.delete('/api/users/:id', requireUser, requireRole('manager'), (req: AuthedRequest, res) => {
    const id = Number(req.params.id)
    if (id === req.user!.id) return res.status(400).json({ error: 'Нельзя удалить собственную учётную запись.' })
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow | undefined
    if (!target) return res.status(404).json({ error: 'Пользователь не найден.' })
    if (target.role === 'manager' && managersCount() <= 1) {
      return res.status(400).json({ error: 'В системе должен остаться хотя бы один руководитель.' })
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(id)
    res.status(204).end()
  })

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Метод API не найден.' }))

  // Некорректный JSON и прочие ошибки — без утечки внутренних подробностей.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err)
    const status = (err as { status?: number })?.status
    if (status === 400 || status === 413) return res.status(status).json({ error: 'Некорректный запрос.' })
    console.error(err)
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' })
  })

  return app
}
