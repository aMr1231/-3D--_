import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app.ts'
import { openDatabase, seedUsers } from './db.ts'
import { hashPassword, verifyPassword } from './passwords.ts'
import { validatePassword } from './validation.ts'

let server: Server
let base = ''

beforeAll(async () => {
  const db = openDatabase(':memory:')
  await seedUsers(db)
  server = createApp(db).listen(0, '127.0.0.1')
  await new Promise<void>((r) => server.once('listening', () => r()))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(() => new Promise<void>((r) => server.close(() => r())))

/** Мини-клиент с хранением cookie, как у браузера. */
function client() {
  let cookie = ''
  return async (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const set = res.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null, setCookie: set }
  }
}

describe('пароли', () => {
  it('хеш не совпадает с паролем, проверка работает, соль уникальна', async () => {
    const a = await hashPassword('Secret123')
    const b = await hashPassword('Secret123')
    expect(a).not.toContain('Secret123')
    expect(a).not.toBe(b)
    expect(await verifyPassword('Secret123', a)).toBe(true)
    expect(await verifyPassword('secret123', a)).toBe(false)
  })

  it('политика паролей', () => {
    expect(validatePassword('short1', 'ivan')).toMatch(/не короче/)
    expect(validatePassword('onlyletters', 'ivan')).toMatch(/буквы и цифры/)
    expect(validatePassword('ivan2026pass', 'ivan')).toMatch(/логин/)
    expect(validatePassword('Plant2026', 'ivan')).toBeNull()
  })
})

describe('API авторизации', () => {
  it('без сессии /me отвечает 401', async () => {
    expect((await client()('GET', '/api/auth/me')).status).toBe(401)
  })

  it('вход демо-руководителя ставит httpOnly-cookie и открывает /me', async () => {
    const c = client()
    const r = await c('POST', '/api/auth/login', { login: 'Manager', password: 'demo' })
    expect(r.status).toBe(200)
    expect(r.body.user).toMatchObject({ login: 'manager', role: 'manager' })
    expect(r.setCookie).toMatch(/HttpOnly/i)
    expect(r.setCookie).toMatch(/SameSite=Lax/i)
    expect((await c('GET', '/api/auth/me')).body.user.role).toBe('manager')
  })

  it('неверный пароль — 401, после 5 неудач — блокировка 429', async () => {
    const c = client()
    for (let i = 0; i < 5; i++) expect((await c('POST', '/api/auth/login', { login: 'guest', password: 'wrong' })).status).toBe(401)
    expect((await c('POST', '/api/auth/login', { login: 'guest', password: 'tour' })).status).toBe(429)
  })

  it('регистрация: новый пользователь получает роль «гость» и сразу входит', async () => {
    const c = client()
    const r = await c('POST', '/api/auth/register', { login: 'student01', password: 'Factory2026' })
    expect(r.status).toBe(201)
    expect(r.body.user.role).toBe('guest')
    expect((await c('GET', '/api/auth/me')).body.user.login).toBe('student01')
    expect((await client()('POST', '/api/auth/register', { login: 'student01', password: 'Factory2026' })).status).toBe(409)
  })

  it('регистрация проверяет логин и пароль', async () => {
    const c = client()
    expect((await c('POST', '/api/auth/register', { login: 'я', password: 'Factory2026' })).body.field).toBe('login')
    expect((await c('POST', '/api/auth/register', { login: 'student02', password: '123' })).body.field).toBe('password')
  })

  it('выход завершает сессию на сервере', async () => {
    const c = client()
    await c('POST', '/api/auth/login', { login: 'manager', password: 'demo' })
    expect((await c('POST', '/api/auth/logout', {})).status).toBe(204)
    expect((await c('GET', '/api/auth/me')).status).toBe(401)
  })

  it('запрос с чужого Origin отклоняется (CSRF)', async () => {
    const r = await client()('POST', '/api/auth/login', { login: 'manager', password: 'demo' }, { origin: 'https://evil.example' })
    expect(r.status).toBe(403)
  })
})

describe('управление пользователями', () => {
  it('гость не видит список пользователей, руководитель видит и повышает роль', async () => {
    const g = client()
    await g('POST', '/api/auth/register', { login: 'tech01', password: 'Machining5' })
    expect((await g('GET', '/api/users')).status).toBe(403)

    const m = client()
    await m('POST', '/api/auth/login', { login: 'manager', password: 'demo' })
    const list = await m('GET', '/api/users')
    expect(list.status).toBe(200)
    const tech = list.body.users.find((u: { login: string }) => u.login === 'tech01')
    expect(JSON.stringify(list.body)).not.toContain('password')

    expect((await m('PATCH', `/api/users/${tech.id}`, { role: 'manager' })).status).toBe(200)
    // Новая роль действует сразу, без повторного входа.
    expect((await g('GET', '/api/auth/me')).body.user.role).toBe('manager')
    expect((await g('GET', '/api/users')).status).toBe(200)
  })

  it('нельзя менять свою роль и удалять себя', async () => {
    const m = client()
    const me = (await m('POST', '/api/auth/login', { login: 'manager', password: 'demo' })).body.user
    expect((await m('PATCH', `/api/users/${me.id}`, { role: 'guest' })).status).toBe(400)
    expect((await m('DELETE', `/api/users/${me.id}`)).status).toBe(400)
  })

  it('удаление пользователя завершает его сессии', async () => {
    const u = client()
    const victim = (await u('POST', '/api/auth/register', { login: 'temp01', password: 'Temporary9' })).body.user
    const m = client()
    await m('POST', '/api/auth/login', { login: 'manager', password: 'demo' })
    expect((await m('DELETE', `/api/users/${victim.id}`)).status).toBe(204)
    expect((await u('GET', '/api/auth/me')).status).toBe(401)
  })

  it('смена пароля: старый перестаёт работать', async () => {
    const c = client()
    await c('POST', '/api/auth/register', { login: 'pwd01', password: 'Initial123' })
    expect((await c('POST', '/api/auth/password', { currentPassword: 'wrong', newPassword: 'Changed456' })).status).toBe(400)
    expect((await c('POST', '/api/auth/password', { currentPassword: 'Initial123', newPassword: 'Changed456' })).status).toBe(204)
    expect((await client()('POST', '/api/auth/login', { login: 'pwd01', password: 'Initial123' })).status).toBe(401)
    expect((await client()('POST', '/api/auth/login', { login: 'pwd01', password: 'Changed456' })).status).toBe(200)
  })
})
