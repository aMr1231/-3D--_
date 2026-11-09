#!/usr/bin/env node
/**
 * Запуск серверной части (Laravel) из корня проекта.
 *
 *   node scripts/backend.mjs setup   — composer install, .env, ключ приложения, база с демо-данными
 *   node scripts/backend.mjs serve   — сервер разработки на http://127.0.0.1:8000 (с автоподготовкой; порт — TWINLINE_API_PORT)
 *   node scripts/backend.mjs reverb  — WebSocket-сервер Laravel Reverb (реальное время, порт 8080)
 *   node scripts/backend.mjs live    — поток живой смены (php artisan twinline:live)
 *   node scripts/backend.mjs test    — тесты сервера (PHPUnit)
 *   node scripts/backend.mjs composer <...> — Composer в папке backend
 *   node scripts/backend.mjs <...>   — любая команда artisan
 *
 * PHP ищется так: переменная PHP_BINARY → php в PATH → установка winget в %LOCALAPPDATA%.
 */
import { spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
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

const autoload = join(backend, 'vendor', 'autoload.php')
const envFile = join(backend, '.env')

const lockMarker = join(backend, 'vendor', '.composer-lock-hash')
const lockHash = () => createHash('sha1').update(readFileSync(join(backend, 'composer.lock'))).digest('hex')

/** Зависимости устарели: composer.lock изменился после последней установки (например, после git pull). */
function vendorOutdated() {
  return !existsSync(autoload) || !existsSync(lockMarker) || readFileSync(lockMarker, 'utf8').trim() !== lockHash()
}

function installVendor() {
  composer('install', '--no-interaction')
  writeFileSync(lockMarker, lockHash())
}

/**
 * Настройки реального времени в .env: включает вещание через Reverb и создаёт ключ и секрет приложения.
 * Работает и для .env, созданного до появления реального времени. Заданные значения не меняются.
 */
function ensureRealtimeEnv() {
  let env = readFileSync(envFile, 'utf8')
  const before = env
  env = env.replace(/^BROADCAST_CONNECTION=log[ \t]*$/m, 'BROADCAST_CONNECTION=reverb')
  if (!/^REVERB_APP_KEY=/m.test(env)) env += `${env.endsWith('\n') ? '' : '\n'}\n# Реальное время (Laravel Reverb)\n`
  const defaults = {
    REVERB_APP_ID: 'twinline',
    REVERB_APP_KEY: randomBytes(10).toString('hex'),
    REVERB_APP_SECRET: randomBytes(20).toString('hex'),
    REVERB_HOST: '127.0.0.1',
    REVERB_PORT: '8080',
    REVERB_SCHEME: 'http',
    REVERB_SERVER_HOST: '127.0.0.1',
    REVERB_SERVER_PORT: '8080',
  }
  for (const [key, value] of Object.entries(defaults)) {
    const re = new RegExp(`^${key}=(.*)$`, 'm')
    const match = env.match(re)
    if (!match) env += `${key}=${value}\n`
    else if (match[1].trim() === '') env = env.replace(re, `${key}=${value}`)
  }
  if (env !== before) writeFileSync(envFile, env)
}

/** Подготовка при первом запуске: зависимости, .env, ключ, база. Повторный вызов ничего не ломает. */
function prepare() {
  if (vendorOutdated()) installVendor()
  if (!existsSync(envFile)) {
    copyFileSync(join(backend, '.env.example'), envFile)
    artisan('key:generate', '--force')
  }
  ensureRealtimeEnv()
  const db = join(backend, 'database', 'database.sqlite')
  if (!existsSync(db)) writeFileSync(db, '')
  artisan('migrate', '--force', '--seed')
}

function waitForPrepared() {
  const ready = () =>
    existsSync(autoload) && !vendorOutdated() && existsSync(envFile) && /^REVERB_APP_KEY=\S+/m.test(readFileSync(envFile, 'utf8'))
  const deadline = Date.now() + 180_000
  while (!ready()) {
    if (Date.now() > deadline) {
      console.error('Сервер не подготовлен. Выполните npm run setup.')
      process.exit(1)
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000)
  }
}

const [cmd = 'serve', ...rest] = process.argv.slice(2)
if (cmd === 'setup') {
  prepare()
} else if (cmd === 'serve') {
  prepare()
  artisan('serve', '--host=127.0.0.1', `--port=${process.env.TWINLINE_API_PORT ?? 8000}`, ...rest)
} else if (cmd === 'reverb' || cmd === 'live') {
  // Запускаются параллельно с serve: ждём, пока он подготовит зависимости и .env.
  waitForPrepared()
  if (cmd === 'reverb') artisan('reverb:start', ...rest)
  else artisan('twinline:live', ...rest)
} else if (cmd === 'composer') {
  composer(...rest)
} else if (cmd === 'test') {
  artisan('test', ...rest)
} else {
  artisan(cmd, ...rest)
}
