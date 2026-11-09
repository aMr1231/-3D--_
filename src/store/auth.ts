import { create } from 'zustand'
import type { AppUser, Role } from '@/domain/types'
import { ApiError, api } from '@/lib/api'

export type AuthResult = { ok: true; user: AppUser } | { ok: false; error: string; field?: string }

interface AuthState {
  /** loading — идёт проверка сессии на сервере; ready — состояние известно. */
  status: 'loading' | 'ready'
  user: AppUser | null
  /** Ошибка связи с сервером при проверке сессии. */
  connectionError: string | null
  init: () => Promise<void>
  login: (login: string, password: string) => Promise<AuthResult>
  register: (login: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: true } | { ok: false; error: string; field?: string }>
}

const fail = (e: unknown) =>
  e instanceof ApiError ? { ok: false as const, error: e.message, field: e.field } : { ok: false as const, error: 'Неизвестная ошибка.' }

/**
 * Сессия хранится на сервере; браузер держит только httpOnly-cookie.
 * Состояние пользователя всегда берётся из ответа сервера, а не из localStorage.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,
  connectionError: null,
  init: async () => {
    try {
      const { user } = await api<{ user: AppUser }>('GET', '/api/auth/me')
      set({ user, status: 'ready', connectionError: null })
    } catch (e) {
      set({
        user: null,
        status: 'ready',
        connectionError: e instanceof ApiError && e.status !== 401 ? e.message : null,
      })
    }
  },
  login: async (login, password) => {
    try {
      const { user } = await api<{ user: AppUser }>('POST', '/api/auth/login', { login, password })
      set({ user, connectionError: null })
      return { ok: true, user }
    } catch (e) {
      return fail(e)
    }
  },
  register: async (login, password) => {
    try {
      const { user } = await api<{ user: AppUser }>('POST', '/api/auth/register', { login, password })
      set({ user, connectionError: null })
      return { ok: true, user }
    } catch (e) {
      return fail(e)
    }
  },
  logout: async () => {
    try {
      await api('POST', '/api/auth/logout', {})
    } finally {
      set({ user: null })
    }
  },
  changePassword: async (currentPassword, newPassword) => {
    try {
      await api('POST', '/api/auth/password', { currentPassword, newPassword })
      return { ok: true }
    } catch (e) {
      return fail(e)
    }
  },
}))

/** Перепроверка сессии при возврате на вкладку: роль могли изменить, учётку — удалить. */
export function watchSession() {
  const recheck = () => {
    if (document.visibilityState === 'visible' && useAuthStore.getState().user) void useAuthStore.getState().init()
  }
  document.addEventListener('visibilitychange', recheck)
  return () => document.removeEventListener('visibilitychange', recheck)
}

export function homePathFor(role: Role): string {
  return role === 'guest' ? '/tour' : '/'
}
