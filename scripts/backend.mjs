#!/usr/bin/env node
/**
 * Запуск серверной части (Laravel) из корня проекта.
 *
 *   node scripts/backend.mjs setup   — composer install, .env, ключ приложения, база с демо-данными
 *   node scripts/backend.mjs serve   — сервер разработки на http://127.0.0.1:8000 (с автоподготовкой)
 *   node scripts/backend.mjs test    — тесты сервера (PHPUnit)
 *   node scripts/backend.mjs <...>   — любая команда artisan
 *
 * PHP ищется так: переменная PHP_BINARY → php в PATH → установка winget в %LOCALAPPDATA%.
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const backend = join(root, 'backend')

function works(cmd, args = ['-v']) {
  const r = spawnSync(cmd, args, { stdio: 'ignore', shell: process.platform === 'win32' })
  return r.status === 0
}

function findPhp() {
  if (process.env.PHP_BINARY && existsSync(process.env.PHP_BINARY)) return process.env.PHP_BINARY
  if (works('php')) return 'php'
  const pkgs = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages')
  if (existsSync(pkgs)) {
    const dirs = readdirSync(pkgs).filter((d) => /^PHP\.PHP\.\d/.test(d)).sort().reverse()
    for (const d of dirs) {
      const exe = join(pkgs, d, 'php.exe')
      if (existsSync(exe)) return exe
    }
  }
  console.error('PHP не найден. Установите PHP 8.3+ (например: winget install PHP.PHP.8.4) или задайте PHP_BINARY.')
  process.exit(1)
}

const php = findPhp()

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: backend, stdio: 'inherit', shell: false, ...opts })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

const artisan = (...args) => run(php, ['artisan', ...args])

function composer(...args) {
  if (works('composer', ['--version'])) return run('composer', args, { shell: process.platform === 'win32' })
  const phar = join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Composer', 'composer.phar')
  if (existsSync(phar)) return run(php, [phar, ...args])
  console.error('Composer не найден. Установите его: https://getcomposer.org/download/')
  process.exit(1)
}

/** Подготовка при первом запуске: зависимости, .env, ключ, база. Повторный вызов ничего не ломает. */
function prepare() {
  if (!existsSync(join(backend, 'vendor', 'autoload.php'))) composer('install', '--no-interaction')
  if (!existsSync(join(backend, '.env'))) {
    copyFileSync(join(backend, '.env.example'), join(backend, '.env'))
    artisan('key:generate', '--force')
  }
  const db = join(backend, 'database', 'database.sqlite')
  if (!existsSync(db)) writeFileSync(db, '')
  artisan('migrate', '--force', '--seed')
}

const [cmd = 'serve', ...rest] = process.argv.slice(2)
if (cmd === 'setup') {
  prepare()
} else if (cmd === 'serve') {
  prepare()
  artisan('serve', '--host=127.0.0.1', '--port=8000', ...rest)
} else if (cmd === 'test') {
  artisan('test', ...rest)
} else {
  artisan(cmd, ...rest)
}
