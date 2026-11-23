/**
 * Model Usage Board — host half.
 *
 * Builds a durable, append-only usage ledger from the DSH session log, exposes
 * a small same-origin JSON/SSE API for the floating board, and keeps the
 * ledger current from the post-commit `session/event` feed.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { appendFile, copyFile, cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  UsageStore,
  DEFAULT_DATA_DIR,
  publicSettings,
} from './host/store.js'
import { widgetHtml } from './host/widget.js'

const VENDOR_DIR = new URL('./assets/vendor/', import.meta.url)
const SPACE_DIR = new URL('./assets/space/', import.meta.url)
const DESKTOP_TITLE = 'DSH-Model-Usage-Board'
const FLOATING_TITLE = 'DSH-Floating-Model-Usage'
const FLOATING_SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'host', 'floating-window.ps1')
const POWERSHELL = path.join(
  process.env.SystemRoot ?? 'C:\\Windows',
  'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe',
)

let windowApi = null
function loadWindowApi() {
  if (windowApi !== null) return windowApi
  const execDir = path.dirname(process.execPath)
  const candidates = [
    process.env.DSH_INSTALL_DIR,
    path.join(execDir, 'resources', 'app.asar', 'dsh'),
    path.join(execDir, 'dsh'),
    execDir,
    'D:\\deepseek_harness\\resources\\app.asar\\dsh',
  ].filter(candidate => typeof candidate === 'string' && path.isAbsolute(candidate))
  let koffi = null
  let lastError = null
  for (const dir of candidates) {
    try {
      const req = createRequire(path.join(dir, 'package.json'))
      koffi = req('koffi')
      break
    } catch (error) { lastError = error }
  }
  if (koffi === null) throw lastError ?? new Error('koffi is unavailable')
  const user32 = koffi.load('user32.dll')
  windowApi = {
    find: user32.func('intptr_t FindWindowW(const char16_t *cls, const char16_t *title)'),
    top: user32.func('bool SetWindowPos(intptr_t hWnd, intptr_t after, int X, int Y, int cx, int cy, uint32_t flags)'),
    close: user32.func('bool PostMessageW(intptr_t hWnd, uint32_t msg, uintptr_t wParam, intptr_t lParam)'),
  }
  return windowApi
}

async function closeWindowByTitle(title) {
  try {
    const api = loadWindowApi()
    for (let i = 0; i < 12; i++) {
      const hwnd = api.find(null, title)
      if (hwnd === 0) break
      api.close(hwnd, 0x0010, 0, 0)
      await new Promise(resolve => setTimeout(resolve, 120))
    }
  } catch { /* best effort */ }
}

async function closeDesktopWindow() {
  await closeWindowByTitle(DESKTOP_TITLE)
}

async function waitForWindow(title, timeoutMs = 8000) {
  try {
    const api = loadWindowApi()
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      const hwnd = api.find(null, title)
      if (hwnd !== 0) {
        api.top(hwnd, -1, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040)
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  } catch { /* best effort */ }
  return false
}

async function pruneDesktopProfiles(root) {
  try {
    const entries = await readdir(root, { withFileTypes: true })
    const dirs = []
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith('profile-')) continue
      const dir = path.join(root, entry.name)
      try { dirs.push({ dir, mtime: (await stat(dir)).mtimeMs }) } catch { /* ignore */ }
    }
    dirs.sort((a, b) => b.mtime - a.mtime)
    for (const item of dirs.slice(2)) {
      try { await rm(item.dir, { recursive: true, force: true }) } catch { /* locked */ }
    }
  } catch { /* best effort */ }
}

async function pinDesktopWindow() {
  try {
    const api = loadWindowApi()
    for (let i = 0; i < 40; i++) {
      const hwnd = api.find(null, DESKTOP_TITLE)
      if (hwnd !== 0) {
        api.top(hwnd, -1, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0040)
        return true
      }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  } catch { /* best effort */ }
  return false
}

function findBrowser() {
  const programFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)'
  const candidates = [
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ]
  return candidates.find(candidate => existsSync(candidate))
}

export const name = 'model-usage-board'
export const inject = ['webServer']

const API_PREFIX = '/dsh-usage/api'
const MAX_BODY_BYTES = 1024 * 1024

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(body)
}

function sendText(res, status, body, contentType = 'text/plain; charset=utf-8', extra = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  })
  res.end(body)
}

function requestUrl(req) {
  try {
    return new URL(req.url ?? '/', 'http://localhost')
  } catch {
    return null
  }
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error('request body is too large')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function isSameOriginPost(req) {
  if (req.method !== 'POST') return true
  if (req.headers['x-dsh-usage'] !== '1') return false
  const contentType = String(req.headers['content-type'] ?? '')
  if (!contentType.toLowerCase().startsWith('application/json')) return false
  const site = req.headers['sec-fetch-site']
  if (site !== undefined && site !== 'same-origin' && site !== 'none') return false
  const origin = req.headers.origin
  if (origin !== undefined) {
    try {
      if (new URL(origin).host !== req.headers.host) return false
    } catch {
      return false
    }
  }
  return true
}

function numberOrZero(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

function usageOf(data) {
  const usage = data
  if (usage === null || typeof usage !== 'object') return null
  const i = numberOrZero(usage.inputTokens)
  const o = numberOrZero(usage.outputTokens)
  const r = numberOrZero(usage.cacheReadTokens)
  const w = numberOrZero(usage.cacheWriteTokens)
  const rt = numberOrZero(usage.reasoningTokens)
  const total = numberOrZero(usage.totalTokens)
  if (i + o + r + w + total === 0) return null
  return { i, o, r, w, rt, total }
}

function modelSource(event, current, session) {
  const message = event?.data?.message
  const source = message?.source
  let provider = source?.provider
  let model = source?.model
  if (provider === undefined || model === undefined) {
    const header = event?.data?.header
    if (header?.config !== undefined) {
      provider ??= header.config.provider
      model ??= header.config.model
    }
  }
  if (provider === undefined || model === undefined) {
    provider ??= current?.provider
    model ??= current?.model
  }
  if (provider === undefined || model === undefined) {
    const latest = session?.requestHeader?.()
    provider ??= latest?.config?.provider
    model ??= latest?.config?.model
  }
  return {
    provider: typeof provider === 'string' && provider !== '' ? provider : 'unknown',
    model: typeof model === 'string' && model !== '' ? model : 'unknown',
  }
}

function makeRecord(sessionId, event, provider, model) {
  const usage = usageOf(event?.data?.usage)
  if (usage === null) return null
  const at = Number(event?.time)
  const seq = Number(event?.seq)
  if (!Number.isFinite(at) || at <= 0 || !Number.isFinite(seq) || seq < 0) return null
  return {
    v: 1,
    id: `${sessionId}:${seq}`,
    t: at,
    p: provider,
    m: model,
    s: sessionId,
    q: seq,
    u: usage,
    turn: Number(event?.data?.turn) || 0,
    step: Number(event?.data?.step) || 0,
  }
}

class SseHub {
  constructor() {
    this.clients = new Set()
  }

  attach(req, res, hello) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write('retry: 3000\n\n')
    this.write(res, 'hello', hello)
    this.clients.add(res)
    res.socket?.setNoDelay?.(true)
    const cleanup = () => {
      this.clients.delete(res)
      try { res.end() } catch { /* already gone */ }
    }
    req.on('close', cleanup)
    req.on('error', cleanup)
    res.on('error', cleanup)
  }

  write(res, event, data) {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      return true
    } catch {
      this.clients.delete(res)
      return false
    }
  }

  broadcast(event, data) {
    for (const res of this.clients) this.write(res, event, data)
  }

  ping() {
    for (const res of this.clients) {
      try { res.write(': ping\n\n') } catch { this.clients.delete(res) }
    }
  }

  close() {
    for (const res of this.clients) {
      try { res.end() } catch { /* already gone */ }
    }
    this.clients.clear()
  }
}

export function apply(ctx) {
  const dataDir = DEFAULT_DATA_DIR
  const store = new UsageStore({ dataDir })
  const sse = new SseHub()
  const scanAbort = new AbortController()
  let scanPromise = null
  let changeTimer = null
  let disposed = false

  const scheduleChange = () => {
    if (disposed || changeTimer !== null) return
    changeTimer = setTimeout(() => {
      changeTimer = null
      sse.broadcast('change', { at: Date.now(), records: store.records.length })
    }, 300)
  }
  store.onChange = scheduleChange
  store.onProgress = (progress) => {
    if (!progress.running || progress.done === 0 || progress.done === progress.total || progress.done % 8 === 0) {
      sse.broadcast('scan', progress)
    }
  }

  const scanSessions = () => {
    if (scanPromise !== null) return scanPromise
    scanPromise = (async () => {
      const sessionQuery = ctx.get('sessionQuery')
      if (sessionQuery === undefined) {
        store.updateScan({
          running: false,
          total: 0,
          done: 0,
          added: 0,
          startedAt: Date.now(),
          finishedAt: Date.now(),
          error: 'session query service is unavailable',
        })
        return
      }
      store.updateScan({
        running: true,
        total: 0,
        done: 0,
        added: 0,
        startedAt: Date.now(),
        finishedAt: null,
        error: null,
      })
      let added = 0
      let done = 0
      try {
        const sessions = await sessionQuery.listSessions(scanAbort.signal)
        store.updateScan({ total: sessions.length })
        let next = 0
        const worker = async () => {
          while (!disposed) {
            const index = next
            next += 1
            if (index >= sessions.length) return
            const session = sessions[index]
            const sessionId = String(session?.header?.id ?? '')
            if (sessionId === '' || session?.formatStatus === 'migration-required') {
              done += 1
              store.updateScan({ done, added })
              continue
            }
            try {
              const snapshot = await sessionQuery.readSession(sessionId)
              const inherited = Number(snapshot?.inheritedEventCount ?? 0)
              let current = null
              for (const event of snapshot?.events ?? []) {
                if (event?.type === 'request/header') {
                  const config = event?.data?.header?.config
                  if (config !== undefined) current = { provider: config.provider, model: config.model }
                  continue
                }
                if (event?.type !== 'assistant/message') continue
                if (Number(event.seq) < inherited) continue
                const source = modelSource(event, current, undefined)
                const record = makeRecord(sessionId, event, source.provider, source.model)
                if (record !== null && store.ingest(record)) added += 1
              }
            } catch (error) {
              if (!scanAbort.signal.aborted) {
                console.warn(`[model-usage-board] could not scan session ${sessionId}:`, error?.message ?? error)
              }
            }
            done += 1
            store.updateScan({ done, added })
          }
        }
        await Promise.all([worker(), worker()])
        store.updateScan({ running: false, done, added, finishedAt: Date.now() })
        scheduleChange()
        console.info(`[model-usage-board] scan complete: ${done} sessions, ${added} new usage records, ${store.records.length} total`)
      } catch (error) {
        if (!scanAbort.signal.aborted) {
          console.warn('[model-usage-board] scan failed:', error?.message ?? error)
          store.updateScan({
            running: false,
            done,
            added,
            finishedAt: Date.now(),
            error: error instanceof Error ? error.message : String(error),
          })
        }
      } finally {
        scanPromise = null
      }
    })()
    return scanPromise
  }

  const onSessionEvent = (session, event) => {
    if (event?.type !== 'assistant/message') return
    const inherited = Number(session?.inheritedEventCount ?? 0)
    if (Number(event.seq) < inherited) return
    const source = modelSource(event, null, session)
    const record = makeRecord(String(session?.id ?? ''), event, source.provider, source.model)
    if (record !== null) store.ingest(record)
  }

  const ensureReady = async () => {
    await store.init()
    if (store.initError !== null) throw new Error(store.initError)
  }

  const handleApi = async (req, res) => {
    const url = requestUrl(req)
    if (url === null) {
      sendJson(res, 400, { ok: false, error: 'invalid request url' })
      return
    }
    if (req.method === 'OPTIONS') {
      sendJson(res, 405, { ok: false, error: 'method not allowed' })
      return
    }
    if (req.method === 'POST' && !isSameOriginPost(req)) {
      sendJson(res, 403, { ok: false, error: 'same-origin JSON POST required' })
      return
    }
    try {
      await ensureReady()
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      return
    }

    const pathname = url.pathname
    if (pathname.startsWith(`${API_PREFIX}/space/`) && req.method === 'GET') {
      const name = pathname.slice(`${API_PREFIX}/space/`.length).replace(/\.webp$/i, '')
      if (!/^[a-z0-9-]+$/.test(name)) {
        sendJson(res, 404, { ok: false, error: 'unknown space asset' })
        return
      }
      try {
        const image = await readFile(new URL(`${name}.webp`, SPACE_DIR))
        res.writeHead(200, {
          'Content-Type': 'image/webp',
          'Content-Length': String(image.length),
          'Cache-Control': 'public, max-age=86400',
          'X-Content-Type-Options': 'nosniff',
        })
        res.end(image)
      } catch {
        sendJson(res, 404, { ok: false, error: 'unknown space asset' })
      }
      return
    }

    if (pathname.startsWith(`${API_PREFIX}/vendor/`) && req.method === 'GET') {
      const name = pathname.slice(`${API_PREFIX}/vendor/`.length).replace(/\.svg$/i, '')
      if (!/^[a-z0-9-]+$/.test(name)) {
        sendJson(res, 404, { ok: false, error: 'unknown vendor icon' })
        return
      }
      try {
        const svg = await readFile(new URL(`${name}.svg`, VENDOR_DIR), 'utf8')
        sendText(res, 200, svg, 'image/svg+xml; charset=utf-8', {
          'Cache-Control': 'public, max-age=86400',
          'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        })
      } catch {
        sendJson(res, 404, { ok: false, error: 'unknown vendor icon' })
      }
      return
    }

    if (pathname === `${API_PREFIX}/electron-check` && req.method === 'GET') {
      const info = { processType: process.type ?? null, electron: process.versions.electron ?? null, importOk: false, requireOk: false, hasBrowserWindow: false, keys: [] }
      try {
        const electron = await import('electron')
        info.importOk = true
        info.hasBrowserWindow = typeof electron.BrowserWindow === 'function'
        info.keys = Object.keys(electron).slice(0, 20)
      } catch (error) { info.importError = error instanceof Error ? error.message : String(error) }
      try {
        const electron = createRequire(import.meta.url)('electron')
        info.requireOk = typeof electron === 'object'
        info.hasBrowserWindow = info.hasBrowserWindow || typeof electron?.BrowserWindow === 'function'
      } catch (error) { info.requireError = error instanceof Error ? error.message : String(error) }
      sendJson(res, 200, info)
      return
    }

    if (pathname === `${API_PREFIX}/floating-window` && req.method === 'POST') {
      let body = {}
      try { body = await readJsonBody(req) } catch { body = {} }
      const target = new URL(`${API_PREFIX}/widget`, ctx.webServer.getOrigin())
      target.searchParams.set('theme', body.theme === 'dark' ? 'dark' : 'light')
      target.searchParams.set('style', typeof body.style === 'string' ? body.style : 'auto')
      target.searchParams.set('period', typeof body.period === 'string' ? body.period : 'day')
      if (typeof body.anchor === 'string' && body.anchor !== '') target.searchParams.set('anchor', body.anchor)
      if (typeof body.from === 'string' && body.from !== '') target.searchParams.set('from', body.from)
      if (typeof body.to === 'string' && body.to !== '') target.searchParams.set('to', body.to)
      target.searchParams.set('native', '1')
      target.searchParams.set('windowTitle', FLOATING_TITLE)
      const connection = ctx.get('connection')
      const url = connection?.authenticatedUrl?.(target.toString()) ?? target.toString()
      const x = Number.isFinite(Number(body.x)) ? Math.round(Number(body.x)) : 1200
      const y = Number.isFinite(Number(body.y)) ? Math.round(Number(body.y)) : 100
      try {
        const profileDir = path.join(store.dataDir, 'floating-window-profile')
        const runtimeDir = path.join(store.dataDir, 'floating-window-runtime')
        const runtimeScript = path.join(runtimeDir, 'floating-window.ps1')
        await closeWindowByTitle(FLOATING_TITLE)
        await new Promise(resolve => setTimeout(resolve, 300))
        await mkdir(profileDir, { recursive: true })
        await mkdir(runtimeDir, { recursive: true })
        await copyFile(FLOATING_SCRIPT, runtimeScript)
        if (!existsSync(path.join(runtimeDir, 'webview2', 'Microsoft.Web.WebView2.Core.dll'))) {
          await cp(
            path.join(path.dirname(FLOATING_SCRIPT), 'webview2'),
            path.join(runtimeDir, 'webview2'),
            { recursive: true, force: true },
          )
        }
        const args = [
          '-NoProfile', '-NoLogo', '-STA', '-ExecutionPolicy', 'Bypass',
          '-File', runtimeScript,
          '-Title', FLOATING_TITLE,
          '-Profile', profileDir,
          '-X', String(x), '-Y', String(y),
          '-Width', '450', '-Height', '770',
          '-Url', url,
        ]
        const launchLog = path.join(store.dataDir, 'floating-launch.log')
        await appendFile(launchLog, `${new Date().toISOString()} spawn ${POWERSHELL} exists=${existsSync(POWERSHELL)} script=${runtimeScript} scriptExists=${existsSync(runtimeScript)}\n`)
        const child = spawn(POWERSHELL, args, { detached: false, stdio: 'ignore', windowsHide: true })
        child.on('error', (error) => { void appendFile(launchLog, `${new Date().toISOString()} spawn error ${error.message}\n`) })
        child.on('spawn', () => { void appendFile(launchLog, `${new Date().toISOString()} spawned pid=${child.pid}\n`) })
        child.unref()
        if (!await waitForWindow(FLOATING_TITLE, 8000)) {
          try { child.kill() } catch { /* ignore */ }
          sendJson(res, 500, { ok: false, error: 'floating window did not appear' })
          return
        }
        sendJson(res, 200, { ok: true, native: true })
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
      return
    }

    if (pathname === `${API_PREFIX}/desktop-window` && req.method === 'POST') {
      const browser = findBrowser()
      if (browser === undefined) {
        sendJson(res, 503, { ok: false, error: 'Edge or Chrome was not found' })
        return
      }
      let body = {}
      try { body = await readJsonBody(req) } catch { body = {} }
      const target = new URL(`${API_PREFIX}/widget`, ctx.webServer.getOrigin())
      target.searchParams.set('theme', body.theme === 'dark' ? 'dark' : 'light')
      target.searchParams.set('style', typeof body.style === 'string' ? body.style : 'glass')
      target.searchParams.set('period', typeof body.period === 'string' ? body.period : 'day')
      if (typeof body.anchor === 'string' && body.anchor !== '') target.searchParams.set('anchor', body.anchor)
      if (typeof body.from === 'string' && body.from !== '') target.searchParams.set('from', body.from)
      if (typeof body.to === 'string' && body.to !== '') target.searchParams.set('to', body.to)
      target.searchParams.set('windowTitle', DESKTOP_TITLE)
      const connection = ctx.get('connection')
      const url = connection?.authenticatedUrl?.(target.toString()) ?? target.toString()
      try {
        const profileDir = path.join(
          store.dataDir,
          'desktop-window-profiles',
          `profile-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        )
        await mkdir(profileDir, { recursive: true })
        const args = [
          `--app=${url}`,
          '--window-size=440,780',
          `--window-position=${Number.isFinite(Number(body.x)) ? Math.round(Number(body.x)) : 1200},${Number.isFinite(Number(body.y)) ? Math.round(Number(body.y)) : 80}`,
          `--user-data-dir=${profileDir}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-sync',
          '--no-service-autorun',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-session-crashed-bubble',
          '--disable-features=Translate,msEdgeFirstRunExperience,msEdgeSyncPromo,msEdgeWelcomePage',
        ]
        // Reuse of the dedicated profile would restore the old window position,
        // so close only our own titled window before opening the new one.
        await closeDesktopWindow()
        const edge = spawn(browser, args, { detached: true, stdio: 'ignore', windowsHide: false })
        edge.unref()
        await pinDesktopWindow()
        void pruneDesktopProfiles(path.join(store.dataDir, 'desktop-window-profiles'))
        sendJson(res, 200, { ok: true, browser: path.basename(browser) })
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
      return
    }

    if (pathname === `${API_PREFIX}/widget` && req.method === 'GET') {
      const theme = url.searchParams.get('theme') === 'dark' ? 'dark' : 'light'
      const requestedTitle = url.searchParams.get('windowTitle') ?? ''
      const title = /^[A-Za-z0-9 ._-]{1,80}$/.test(requestedTitle) ? requestedTitle : undefined
      sendText(res, 200, widgetHtml({ theme, ...(title === undefined ? {} : { title }) }), 'text/html; charset=utf-8', {
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'",
      })
      return
    }

    if (pathname === `${API_PREFIX}/open` && req.method === 'GET') {
      const site = req.headers['sec-fetch-site']
      if (site !== undefined && site !== 'same-origin' && site !== 'none') {
        sendJson(res, 403, { ok: false, error: 'same-origin navigation required' })
        return
      }
      const connection = ctx.get('connection')
      const origin = ctx.webServer.getOrigin()
      const target = new URL(`${API_PREFIX}/widget`, origin)
      for (const key of ['theme', 'style', 'period', 'anchor', 'from', 'to']) {
        const value = url.searchParams.get(key)
        if (value !== null) target.searchParams.set(key, value)
      }
      const location = connection?.authenticatedUrl?.(target.toString()) ?? target.toString()
      res.writeHead(302, {
        Location: location,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      res.end()
      return
    }

    if (pathname === `${API_PREFIX}/stream` && req.method === 'GET') {
      sse.attach(req, res, {
        records: store.records.length,
        scan: store.scan,
        settings: publicSettings(store.settings),
      })
      return
    }

    if (pathname === `${API_PREFIX}/summary` && req.method === 'GET') {
      const summary = store.summary({
        period: url.searchParams.get('period') ?? 'day',
        anchor: url.searchParams.get('anchor') ?? undefined,
        from: url.searchParams.get('from') ?? undefined,
        to: url.searchParams.get('to') ?? undefined,
        currency: url.searchParams.get('currency') ?? undefined,
        timeZone: url.searchParams.get('timezone') ?? undefined,
        modelKey: url.searchParams.get('model') ?? undefined,
      })
      sendJson(res, 200, { ok: true, ...summary })
      return
    }

    if (pathname === `${API_PREFIX}/settings` && req.method === 'GET') {
      sendJson(res, 200, { ok: true, ...store.settingsView() })
      return
    }

    if (pathname === `${API_PREFIX}/settings` && req.method === 'POST') {
      const patch = await readJsonBody(req)
      const settings = await store.saveSettings(patch)
      sse.broadcast('settings', settings)
      sendJson(res, 200, { ok: true, settings })
      return
    }

    if (pathname === `${API_PREFIX}/rescan` && req.method === 'POST') {
      void scanSessions()
      sendJson(res, 202, { ok: true, scan: { ...store.scan } })
      return
    }

    if (pathname === `${API_PREFIX}/export` && req.method === 'GET') {
      const csv = store.exportCsv({
        period: url.searchParams.get('period') ?? 'day',
        anchor: url.searchParams.get('anchor') ?? undefined,
        from: url.searchParams.get('from') ?? undefined,
        to: url.searchParams.get('to') ?? undefined,
      })
      sendText(res, 200, csv, 'text/csv; charset=utf-8', {
        'Content-Disposition': 'attachment; filename="dsh-model-usage.csv"',
      })
      return
    }

    if (pathname === `${API_PREFIX}/health` && req.method === 'GET') {
      sendJson(res, 200, { ok: true, data: store.stats() })
      return
    }

    sendJson(res, 404, { ok: false, error: 'not found' })
  }

  ctx.effect(() => {
    const offRoute = ctx.webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler: (req, res) => {
        void handleApi(req, res).catch((error) => {
          console.warn('[model-usage-board] request failed:', error?.message ?? error)
          try {
            if (!res.headersSent) sendJson(res, 500, { ok: false, error: 'internal error' })
            else res.end()
          } catch { /* socket already gone */ }
        })
      },
    })
    const offSession = ctx.on('session/event', onSessionEvent)
    const heartbeat = setInterval(() => sse.ping(), 25_000)
    heartbeat.unref?.()
    console.info(`[model-usage-board] data directory: ${dataDir}`)
    void store.init()
      .then(() => scanSessions())
      .catch((error) => {
        console.warn('[model-usage-board] initialization failed:', error?.message ?? error)
      })
    return () => {
      disposed = true
      scanAbort.abort()
      offSession()
      offRoute()
      clearInterval(heartbeat)
      if (changeTimer !== null) clearTimeout(changeTimer)
      sse.close()
      void store.flush()
    }
  }, 'model-usage-board: ledger, API, and live feed')
}
