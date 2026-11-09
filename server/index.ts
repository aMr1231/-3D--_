import express from 'express'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createApp } from './app.ts'
import { openDatabase, seedUsers } from './db.ts'
import { purgeExpiredSessions } from './sessions.ts'

/**
 * Запуск сервера.
 *  TWINLINE_PORT, TWINLINE_HOST — адрес (по умолчанию 127.0.0.1:3001)
 *  TWINLINE_DB       — путь к файлу БД (по умолчанию server/data/twinline.db)
 *  TWINLINE_SEED_DEMO=0 — не создавать демо-учётки manager/guest
 *  COOKIE_SECURE=1   — cookie только по HTTPS (включать в эксплуатации)
 * Если есть сборка (npm run build), сервер также раздаёт фронтенд из dist/ — всё на одном порту.
 */
const root = resolve(import.meta.dirname, '..')
const port = Number(process.env.TWINLINE_PORT ?? 3001)
const host = process.env.TWINLINE_HOST ?? '127.0.0.1'
const db = openDatabase(process.env.TWINLINE_DB ?? join(root, 'server', 'data', 'twinline.db'))

if (process.env.TWINLINE_SEED_DEMO !== '0') await seedUsers(db)
purgeExpiredSessions(db)
setInterval(() => purgeExpiredSessions(db), 60 * 60 * 1000).unref()

const app = createApp(db, { secureCookies: process.env.COOKIE_SECURE === '1' })

const dist = join(root, 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(dist, 'index.html')))
}

app.listen(port, host, () => {
  console.log(`Twinline API: http://${host}:${port}`)
})
