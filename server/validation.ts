/** Правила для логина и пароля — общие для регистрации и тестов. */

export const LOGIN_RULE = /^[a-z0-9][a-z0-9._-]{2,31}$/
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128

export function normalizeLogin(login: unknown): string {
  return typeof login === 'string' ? login.trim().toLowerCase() : ''
}

export function validateLogin(login: string): string | null {
  if (!login) return 'Введите логин.'
  if (!LOGIN_RULE.test(login)) {
    return 'Логин: 3–32 символа, латинские буквы, цифры, точка, дефис или подчёркивание; начинается с буквы или цифры.'
  }
  return null
}

export function validatePassword(password: unknown, login: string): string | null {
  if (typeof password !== 'string' || !password) return 'Введите пароль.'
  if (password.length < PASSWORD_MIN) return `Пароль должен быть не короче ${PASSWORD_MIN} символов.`
  if (password.length > PASSWORD_MAX) return `Пароль должен быть не длиннее ${PASSWORD_MAX} символов.`
  if (!/[a-zA-Zа-яА-ЯёЁ]/.test(password) || !/\d/.test(password)) return 'Пароль должен содержать буквы и цифры.'
  if (password.toLowerCase().includes(login)) return 'Пароль не должен содержать логин.'
  return null
}
