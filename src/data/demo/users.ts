/**
 * Подсказки для экрана входа: демо-учётки, которые сервер создаёт при первом запуске
 * (server/db.ts → SEED_USERS). Проверка паролей выполняется только на сервере.
 * Отключить демо-учётки: переменная окружения TWINLINE_SEED_DEMO=0.
 */
import type { Role } from '@/domain/types'

export interface DemoAccountHint {
  login: string
  password: string
  role: Role
  title: string
}

export const DEMO_ACCOUNTS: DemoAccountHint[] = [
  { login: 'manager', password: 'demo', role: 'manager', title: 'Руководитель производства' },
  { login: 'guest', password: 'tour', role: 'guest', title: 'Гость экскурсии' },
]
