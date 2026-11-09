/**
 * Подсказки для экрана входа: демо-учётки, которые сервер создаёт при первом запуске
 * (backend/database/seeders/DatabaseSeeder.php). Проверка паролей выполняется только на сервере.
 * Отключить демо-учётки: TWINLINE_SEED_DEMO=false в backend/.env.
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
