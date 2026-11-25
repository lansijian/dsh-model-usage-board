/**
 * Durable model-usage ledger, pricing, quotas, and period aggregation.
 *
 * The DSH session log is the source of truth. This module stores only a
 * derived, append-only copy of the `assistant/message` usage events so the
 * board can answer historical questions without re-reading every session on
 * every request. Raw usage is kept (not a precomputed price) so changing the
 * price table or exchange rate re-prices history immediately.
 */

import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

export const VERSION = 1
const LEGACY_DATA_DIR = 'E:\\DSH-Usage'
export const LEDGER_FILE = 'usage.v1.jsonl'
export const DEFAULT_DATA_DIR = (() => {
  if (process.env.DSH_USAGE_DIR) return process.env.DSH_USAGE_DIR
  // Existing installations keep their E: ledger; new installations use the
  // DSH profile directory so the published bundle is portable.
  if (existsSync(path.join(LEGACY_DATA_DIR, LEDGER_FILE))) return LEGACY_DATA_DIR
  if (process.env.DSH_PROFILE_DIR) return path.join(process.env.DSH_PROFILE_DIR, 'model-usage-board')
  return path.join(os.homedir(), '.dsh', 'model-usage-board')
})()
export const SETTINGS_FILE = 'settings.v1.json'

/** A price entry is USD per one million tokens. */
export const PRICE_FIELDS = ['input', 'output', 'cacheRead', 'cacheWrite']

/**
 * Fallback family prices, used only when the user has not configured an exact
 * model price. They are deliberately approximate and the UI labels them as a
 * reference estimate. Values are USD / 1M tokens.
 */
const FAMILY_PRICES = [
  { id: 'deepseek', test: /deepseek/i, input: 0.28, output: 0.42, cacheRead: 0.028, cacheWrite: 0.28 },

  { id: 'claude-opus', test: /claude.*(opus|fable)/i, input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  { id: 'claude-sonnet', test: /claude.*sonnet/i, input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  { id: 'claude-haiku', test: /claude.*haiku/i, input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
  { id: 'gpt-5-mini', test: /gpt-5.*mini/i, input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0.25 },
  { id: 'gpt-5', test: /gpt-5/i, input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 1.25 },
  { id: 'gpt-4.1', test: /gpt-4\.1/i, input: 2, output: 8, cacheRead: 0.5, cacheWrite: 2 },
  { id: 'gemini-pro', test: /gemini.*pro/i, input: 1.25, output: 10, cacheRead: 0.31, cacheWrite: 1.25 },
  { id: 'gemini-flash', test: /gemini.*flash/i, input: 0.3, output: 2.5, cacheRead: 0.075, cacheWrite: 0.3 },
  { id: 'qwen', test: /qwen/i, input: 1.2, output: 6, cacheRead: 0.24, cacheWrite: 1.2 },
  { id: 'step', test: /step[-_]?\d/i, input: 0.5, output: 2, cacheRead: 0.05, cacheWrite: 0.5 },
  { id: 'moss', test: /moss/i, input: 0.2, output: 0.6, cacheRead: 0.02, cacheWrite: 0.2 },
]

/**
 * DeepSeek's official CNY list for the Flash family. Peak rates are shown; the
 * off-peak rate is exactly half. This is the one price source that is treated
 * as actual cash spend by default.
 */
const DEEPSEEK_PEAK_PRICES = {
  'deepseek-flash': { cacheHit: 0.04, cacheMiss: 2, output: 8 },
  'deepseek-v4-pro': { cacheHit: 0.30, cacheMiss: 9, output: 27 },
}
const DEEPSEEK_ALIASES = {
  'deepseek-v4-flash': 'deepseek-flash',
  'deepseek-v4-flash-vision-exp': 'deepseek-flash',
}
const DEEPSEEK_PEAK_WINDOWS = [[9 * 60, 12 * 60], [14 * 60, 18 * 60]]
const DEEPSEEK_HOLIDAYS = {
  2026: [
    '2026-01-01', '2026-01-02', '2026-01-03',
    '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
    '2026-04-04', '2026-04-05', '2026-04-06',
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
    '2026-06-19', '2026-06-20', '2026-06-21',
    '2026-09-25', '2026-09-26', '2026-09-27',
    '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07',
  ],
}

/**
 * Public list prices for reference mode. Values are per 1M tokens in the
 * declared currency; CNY entries are converted at the configured rate.
 * They are not cash spend for subscription and credit routes.
 */
const BUILTIN_LIST_PRICES = {
  'claude-opus-5-5': { currency: 'USD', input: 4, output: 20, cacheRead: 0.4, cacheWrite: 5 },
  'claude-sonnet-5-5': { currency: 'USD', input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-fable-5-1': { currency: 'USD', input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-sonnet-4-5': { currency: 'USD', input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-opus-4-1': { currency: 'USD', input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  'gpt-5': { currency: 'USD', input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 1.25 },
  'gpt-5-mini': { currency: 'USD', input: 0.25, output: 2, cacheRead: 0.025, cacheWrite: 0.25 },
  'gemini-2.5-pro': { currency: 'USD', input: 1.25, output: 10, cacheRead: 0.31, cacheWrite: 1.25 },
  'gemini-2.5-flash': { currency: 'USD', input: 0.3, output: 2.5, cacheRead: 0.075, cacheWrite: 0.3 },
  'qwen4-max': { currency: 'CNY', input: 10, output: 30, cacheRead: 0.5, cacheWrite: 10 },
  'qwen4-max-preview': { currency: 'CNY', input: 10, output: 30, cacheRead: 0.5, cacheWrite: 10 },
  'step-5-preview': { currency: 'CNY', input: 7, output: 20, cacheRead: 0.7, cacheWrite: 7 },
  'step-3.7-flash': { currency: 'CNY', input: 1.35, output: 8.1, cacheRead: 0.27, cacheWrite: 1.35 },
  'step-3.5-flash': { currency: 'CNY', input: 0.7, output: 2.1, cacheRead: 0.14, cacheWrite: 0.7 },
  'MiMo-V2.6-Flash': { currency: 'CNY', input: 1, output: 2, cacheRead: 0.02, cacheWrite: 1 },
  'mimo-v2.6-flash': { currency: 'CNY', input: 1, output: 2, cacheRead: 0.02, cacheWrite: 1 },
  'mimo-v2.6-pro': { currency: 'CNY', input: 3, output: 6, cacheRead: 0.025, cacheWrite: 3 },
  'mimo-v2.6-pro-ultraspeed': { currency: 'CNY', input: 30, output: 60, cacheRead: 0.25, cacheWrite: 30 },
}

/**
 * A platform-bill calibration, not an official list price. The user's relay
 * reported $35.39 / ¥237.58 for Claude Sonnet 5.5 on 2026-11-22; preserving
 * Anthropic's official input/output/cache ratios gives a 3.393301× multiplier
 * and the rates below. It is reference-only and never cash spend.
 */
/**
 * NEX is metered by characters, not tokens: ¥1.20 per 10,000 characters.
 * Until the provider reports a character count, use the output-token count as
 * an explicitly estimated proxy; the UI marks it as a character reference.
 */
const NEX_CHAR_PRICE_CNY_PER_10K = 1.2

const CALIBRATED_PRICES = {
  'claude-sonnet-5-5': {
    input: 10.179903,
    output: 50.899515,
    cacheRead: 1.0179903,
    cacheWrite: 12.7248788,
    note: '平台账单 $35.39 / ¥237.58（2026-11-22，按当日 Sonnet token 结构反推）',
  },
}

const VISUAL_STYLES = new Set(['auto', 'glass', 'cyber', 'matrix', 'aurora', 'prism'])

const PAID_PLAN_PROVIDERS = new Set(['qianwen-token-plan', 'stepfun'])
const CREDIT_PROVIDERS = new Set(['openai-next'])
const UNPRICED_PROVIDERS = new Set(['mossnex'])

/** Classify how one provider route is billed. */
export function billingMode(provider) {
  const id = String(provider ?? '').toLowerCase()
  if (id.startsWith('deepseek')) return 'official'
  if (PAID_PLAN_PROVIDERS.has(id) || id.includes('token-plan')) return 'plan'
  if (CREDIT_PROVIDERS.has(id)) return 'credits'
  if (UNPRICED_PROVIDERS.has(id)) return 'unpriced'
  return 'payg'
}

function isDeepSeekProvider(provider) {
  return String(provider ?? '').toLowerCase().startsWith('deepseek')
}

function deepSeekCanonical(model) {
  return DEEPSEEK_ALIASES[model] ?? model
}

const peakCache = new Map()

function deepSeekPeak(at) {
  const parts = zonedParts(at, 'Asia/Shanghai')
  const date = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
  const minute = parts.hour * 60 + parts.minute
  const cacheKey = `${date}:${parts.hour}`
  const cached = peakCache.get(cacheKey)
  if (cached !== undefined) return cached
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
  const holiday = (DEEPSEEK_HOLIDAYS[parts.year] ?? []).includes(date)
  const peak = weekday !== 0 && weekday !== 6 && !holiday
    && DEEPSEEK_PEAK_WINDOWS.some(([start, end]) => minute >= start && minute < end)
  if (peakCache.size > 4096) peakCache.clear()
  peakCache.set(cacheKey, peak)
  return peak
}

function deepSeekPrice(model, settings, at) {
  const canonical = deepSeekCanonical(model)
  const peakPrices = DEEPSEEK_PEAK_PRICES[canonical]
  if (peakPrices === undefined) return null
  const peak = deepSeekPeak(at)
  const factor = peak ? 1 : 0.5
  const rate = settings.exchangeRate > 0 ? settings.exchangeRate : 7.1
  const cny = {
    input: peakPrices.cacheMiss * factor,
    output: peakPrices.output * factor,
    cacheRead: peakPrices.cacheHit * factor,
    cacheWrite: peakPrices.cacheMiss * factor,
  }
  return {
    input: cny.input / rate,
    output: cny.output / rate,
    cacheRead: cny.cacheRead / rate,
    cacheWrite: cny.cacheWrite / rate,
    source: 'deepseek-official',
    estimated: false,
    official: true,
    cashEligible: true,
    peak,
    canonical,
    cny,
    original: { currency: 'CNY', ...cny },
    key: `deepseek-official:${canonical}`,
  }
}

function builtinListPrice(model, settings) {
  const entry = BUILTIN_LIST_PRICES[model] ?? BUILTIN_LIST_PRICES[model.toLowerCase()]
  if (entry === undefined) return null
  const rate = settings.exchangeRate > 0 ? settings.exchangeRate : 7.1
  const factor = entry.currency === 'CNY' ? 1 / rate : 1
  return {
    input: entry.input * factor,
    output: entry.output * factor,
    cacheRead: entry.cacheRead * factor,
    cacheWrite: entry.cacheWrite * factor,
    source: 'list',
    estimated: true,
    official: false,
    cashEligible: false,
    currency: entry.currency,
    original: { ...entry },
    key: `list:${model}`,
  }
}

const DISPLAY_NAMES = new Map([
  ['deepseek-flash', 'DeepSeek Flash'],
  ['deepseek-chat', 'DeepSeek Chat'],
  ['deepseek-reasoner', 'DeepSeek Reasoner'],
  ['deepseek-v4-pro', 'DeepSeek V4 Pro'],
  ['deepseek-v4-flash', 'DeepSeek Flash'],
  ['claude-sonnet-5-5', 'Claude Sonnet 5.5'],
  ['claude-opus-5-5', 'Claude Opus 5.5'],
  ['claude-fable-5-1', 'Claude Fable 5.1'],
  ['claude-sonnet-4-5', 'Claude Sonnet 4.5'],
  ['claude-opus-4-1', 'Claude Opus 4.1'],
  ['gpt-5', 'GPT-5'],
  ['gpt-5-mini', 'GPT-5 mini'],
  ['gemini-2.5-pro', 'Gemini 2.5 Pro'],
  ['gemini-2.5-flash', 'Gemini 2.5 Flash'],
  ['qwen4-max', 'Qwen4 Max'],
  ['qwen4-max-preview', 'Qwen4 Max Preview'],
  ['step-5-preview', 'StepFun step-5-preview'],
  ['nex-n2.6', 'NEX N2.6'],
  ['Hy4-flash', 'Hunyuan 4 Flash'],
  ['hy4-flash', 'Hunyuan 4 Flash'],
  ['MiMo-V2.6-Flash', 'MiMo V2.6 Flash'],
  ['mimo-v2.6-flash', 'MiMo V2.6 Flash'],
  ['mimo-v2.6-pro', 'MiMo V2.6 Pro'],
  ['mimo-v2.6-pro-ultraspeed', 'MiMo V2.6 Pro UltraSpeed'],
  ['nex-n2.6-2026-11-05', 'NEX N2.6 (2026-11-05)'],
])

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_KEY = /^(\d{4})-(\d{2})$/
const MAX_SETTINGS_BYTES = 512 * 1024
const MAX_LEDGER_BYTES = 512 * 1024 * 1024

/** Public defaults. Prices and quotas start empty; family estimates apply. */
export function defaultSettings() {
  return {
    version: VERSION,
    currency: 'CNY',
    exchangeRate: 7.1,
    timezone: 'Asia/Shanghai',
    refreshSeconds: 5,
    costBasis: 'cash',
    visualStyle: 'auto',
    visible: true,
    position: null,
    prices: {},
    quotas: {},
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function finiteNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function nonNegative(value, fallback = 0) {
  const n = finiteNumber(value, fallback)
  return n < 0 ? 0 : n
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function safeKey(key) {
  return typeof key === 'string'
    && key.length > 0
    && key.length <= 240
    && key !== '__proto__'
    && key !== 'constructor'
    && key !== 'prototype'
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function deepMerge(base, patch) {
  if (!isRecord(base) || !isRecord(patch)) return clone(patch) ?? {}
  const out = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    out[key] = isRecord(value) && isRecord(out[key]) ? deepMerge(out[key], value) : clone(value)
  }
  return out
}

function validateTimezone(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return 'Asia/Shanghai'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
    return value
  } catch {
    return 'Asia/Shanghai'
  }
}

function validatePrice(value) {
  if (!isRecord(value)) return null
  const input = nonNegative(value.input)
  const output = nonNegative(value.output)
  const cacheRead = value.cacheRead === undefined ? input * 0.1 : nonNegative(value.cacheRead)
  const cacheWrite = value.cacheWrite === undefined ? input : nonNegative(value.cacheWrite)
  if (input > 100000 || output > 100000 || cacheRead > 100000 || cacheWrite > 100000) return null
  return { input, output, cacheRead, cacheWrite, configured: value.configured !== false }
}

function validateQuota(value) {
  if (!isRecord(value)) return null
  const dailyTokens = Math.floor(nonNegative(value.dailyTokens))
  const monthlyTokens = Math.floor(nonNegative(value.monthlyTokens))
  const monthlyUsd = nonNegative(value.monthlyUsd)
  if (dailyTokens === 0 && monthlyTokens === 0 && monthlyUsd === 0) return null
  return { dailyTokens, monthlyTokens, monthlyUsd }
}

function normalizeSettings(raw) {
  const defaults = defaultSettings()
  const source = isRecord(raw) ? raw : {}
  const settings = {
    ...defaults,
    currency: source.currency === 'USD' ? 'USD' : 'CNY',
    exchangeRate: clamp(nonNegative(source.exchangeRate, defaults.exchangeRate) || defaults.exchangeRate, 0.01, 100),
    timezone: validateTimezone(source.timezone),
    refreshSeconds: Math.round(clamp(nonNegative(source.refreshSeconds, defaults.refreshSeconds) || defaults.refreshSeconds, 2, 60)),
    costBasis: source.costBasis === 'list' ? 'list' : 'cash',
    visualStyle: VISUAL_STYLES.has(source.visualStyle) ? source.visualStyle : defaults.visualStyle,
    visible: source.visible !== false,
    position: null,
    prices: Object.create(null),
    quotas: Object.create(null),
  }
  if (isRecord(source.position)) {
    const x = Number(source.position.x)
    const y = Number(source.position.y)
    if (Number.isFinite(x) && Number.isFinite(y)) {
      settings.position = {
        x: clamp(x, -20000, 20000),
        y: clamp(y, -20000, 20000),
        collapsed: source.position.collapsed === true,
      }
    }
  }
  if (isRecord(source.prices)) {
    for (const [key, value] of Object.entries(source.prices)) {
      if (!safeKey(key)) continue
      const price = validatePrice(value)
      if (price !== null) settings.prices[key] = price
    }
  }
  if (isRecord(source.quotas)) {
    for (const [key, value] of Object.entries(source.quotas)) {
      if (!safeKey(key)) continue
      const quota = validateQuota(value)
      if (quota !== null) settings.quotas[key] = quota
    }
  }
  return settings
}

/** Public settings snapshot (safe to send to the browser). */
export function publicSettings(settings) {
  return {
    version: settings.version,
    currency: settings.currency,
    exchangeRate: settings.exchangeRate,
    timezone: settings.timezone,
    refreshSeconds: settings.refreshSeconds,
    costBasis: settings.costBasis,
    visualStyle: settings.visualStyle,
    visible: settings.visible,
    position: settings.position,
    prices: clone(settings.prices),
    quotas: clone(settings.quotas),
  }
}

/**
 * Resolve the best price for one model.
 *
 * Order: user override, DeepSeek official peak/off-peak, public list price,
 * then a family estimate. Only user overrides and DeepSeek official prices are
 * treated as cash-eligible; list/family values are reference prices.
 */
export function resolvePrice(provider, model, settings, at = Date.now()) {
  const exactKeys = [`${provider}/${model}`, model]
  for (const key of exactKeys) {
    const entry = settings.prices?.[key]
    if (isRecord(entry) && entry.configured !== false) {
      return {
        ...entry,
        input: nonNegative(entry.input),
        output: nonNegative(entry.output),
        cacheRead: entry.cacheRead === undefined ? nonNegative(entry.input) * 0.1 : nonNegative(entry.cacheRead),
        cacheWrite: entry.cacheWrite === undefined ? nonNegative(entry.input) : nonNegative(entry.cacheWrite),
        source: key === model ? 'model' : 'route',
        estimated: false,
        official: false,
        cashEligible: true,
        original: {
          currency: 'USD',
          input: nonNegative(entry.input),
          output: nonNegative(entry.output),
          cacheRead: entry.cacheRead === undefined ? nonNegative(entry.input) * 0.1 : nonNegative(entry.cacheRead),
          cacheWrite: entry.cacheWrite === undefined ? nonNegative(entry.input) : nonNegative(entry.cacheWrite),
        },
        key,
      }
    }
  }
  const calibration = CALIBRATED_PRICES[model]
  if (calibration !== undefined && String(provider).toLowerCase() === 'openai-next') {
    return {
      input: calibration.input,
      output: calibration.output,
      cacheRead: calibration.cacheRead,
      cacheWrite: calibration.cacheWrite,
      source: 'calibrated',
      estimated: false,
      official: false,
      calibrated: true,
      cashEligible: false,
      note: calibration.note,
      original: {
        currency: 'USD',
        input: calibration.input,
        output: calibration.output,
        cacheRead: calibration.cacheRead,
        cacheWrite: calibration.cacheWrite,
      },
      key: `calibrated:${model}`,
    }
  }
  if (isDeepSeekProvider(provider)) {
    const official = deepSeekPrice(model, settings, at)
    if (official !== null) return official
  }
  const list = builtinListPrice(model, settings)
  if (list !== null) return list
  if (/^nex(?:[-_.]|$)/i.test(model)) {
    return {
      unit: 'cnyPer10kChars',
      per10kChars: NEX_CHAR_PRICE_CNY_PER_10K,
      cnyPerUsd: nonNegative(settings.exchangeRate) > 0 ? nonNegative(settings.exchangeRate) : 6.7132,
      source: 'nex-chars',
      estimated: true,
      official: false,
      cashEligible: false,
      original: { currency: 'CNY', per10kChars: NEX_CHAR_PRICE_CNY_PER_10K },
      key: 'nex-chars',
    }
  }
  const family = FAMILY_PRICES.find(entry => entry.test.test(model))
  if (family !== undefined) {
    const { id, test: _test, ...price } = family
    return {
      ...price,
      source: 'family',
      estimated: true,
      official: false,
      cashEligible: false,
      original: { currency: 'USD', ...price },
      key: `family:${id}`,
    }
  }
  return null
}

/** Resolve a quota: exact provider/model, then exact model. */
export function resolveQuota(provider, model, settings) {
  const entry = settings.quotas?.[`${provider}/${model}`] ?? settings.quotas?.[model]
  return isRecord(entry) ? entry : null
}

/** Total disjoint tokens in one usage value. */
export function usageTokens(usage) {
  const input = nonNegative(usage?.i)
  const output = nonNegative(usage?.o)
  const cacheRead = nonNegative(usage?.r)
  const cacheWrite = nonNegative(usage?.w)
  const reported = nonNegative(usage?.total)
  return Math.max(input + output + cacheRead + cacheWrite, reported)
}

/** USD cost for one usage value under a resolved price. */
export function usageCostUsd(usage, price) {
  if (price === null || price === undefined) return 0
  if (price.unit === 'cnyPer10kChars') {
    const characters = nonNegative(usage?.c) || nonNegative(usage?.chars) || nonNegative(usage?.o)
    const cny = (characters / 10_000) * nonNegative(price.per10kChars)
    return cny / (nonNegative(price.cnyPerUsd) > 0 ? nonNegative(price.cnyPerUsd) : 6.7132)
  }
  const input = nonNegative(usage?.i)
  const output = nonNegative(usage?.o)
  const cacheRead = nonNegative(usage?.r)
  const cacheWrite = nonNegative(usage?.w)
  return (
    input * price.input
    + output * price.output
    + cacheRead * price.cacheRead
    + cacheWrite * price.cacheWrite
  ) / 1_000_000
}

export function displayNameFor(model) {
  return DISPLAY_NAMES.get(model) ?? model
}

// ---------------------------------------------------------------------------
// Time-zone-aware civil dates
// ---------------------------------------------------------------------------

const formatterCache = new Map()

function zoneFormatter(timeZone) {
  let formatter = formatterCache.get(timeZone)
  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    formatterCache.set(timeZone, formatter)
  }
  return formatter
}

/** Civil date/time parts of one instant in a time zone. */
export function zonedParts(ms, timeZone) {
  const parts = zoneFormatter(timeZone).formatToParts(new Date(ms))
  const get = type => Number(parts.find(part => part.type === type)?.value ?? 0)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  }
}

/** Local date key (`YYYY-MM-DD`) of one instant. */
export function dateKeyOf(ms, timeZone) {
  const p = zonedParts(ms, timeZone)
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** UTC offset in milliseconds at one instant. */
function zoneOffsetMs(ms, timeZone) {
  const p = zonedParts(ms, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const wholeSecond = ms - ((ms % 1000) + 1000) % 1000
  return asUtc - wholeSecond
}

/** Convert a civil wall time in a zone to an epoch instant. */
export function wallToUtc(year, month, day, hour = 0, minute = 0, second = 0, timeZone = 'Asia/Shanghai') {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second)
  let offset = zoneOffsetMs(guess, timeZone)
  let result = guess - offset
  offset = zoneOffsetMs(result, timeZone)
  result = guess - offset
  return result
}

export function parseDateKey(key) {
  const match = DATE_KEY.exec(String(key ?? ''))
  if (match === null) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null
  return { year, month, day, key: `${match[1]}-${match[2]}-${match[3]}` }
}

export function todayKey(timeZone, now = Date.now()) {
  return dateKeyOf(now, timeZone)
}

export function addDaysKey(key, days) {
  const parsed = parseDateKey(key)
  if (parsed === null) return key
  const next = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days))
  return `${String(next.getUTCFullYear()).padStart(4, '0')}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`
}

export function addMonthsKey(key, months) {
  const parsed = parseDateKey(key)
  if (parsed === null) return key
  const target = new Date(Date.UTC(parsed.year, parsed.month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  const day = Math.min(parsed.day, lastDay)
  return `${String(target.getUTCFullYear()).padStart(4, '0')}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function startOfWeekKey(key) {
  const parsed = parseDateKey(key)
  if (parsed === null) return key
  const weekday = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)).getUTCDay()
  return addDaysKey(key, -((weekday + 6) % 7))
}

export function startOfMonthKey(key) {
  return `${key.slice(0, 7)}-01`
}

export function startOfQuarterKey(key) {
  const parsed = parseDateKey(key)
  if (parsed === null) return key
  const month = Math.floor((parsed.month - 1) / 3) * 3 + 1
  return `${String(parsed.year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`
}

export function startOfYearKey(key) {
  return `${key.slice(0, 4)}-01-01`
}

export function msAtStartOfKey(key, timeZone) {
  const parsed = parseDateKey(key)
  if (parsed === null) return Number.NaN
  return wallToUtc(parsed.year, parsed.month, parsed.day, 0, 0, 0, timeZone)
}

function monthKeyOf(dateKey) {
  return dateKey.slice(0, 7)
}

function startOfMonthFromMonthKey(key) {
  return `${key}-01`
}

function daysBetweenKeys(fromKey, toKey) {
  const from = msAtStartOfKey(fromKey, 'UTC')
  const to = msAtStartOfKey(toKey, 'UTC')
  return Math.round((to - from) / 86_400_000)
}

/** Build the inclusive/exclusive range and navigation anchors for one view. */
export function resolvePeriod({ period = 'day', anchor, from, to, timeZone = 'Asia/Shanghai', now = Date.now() } = {}) {
  const today = todayKey(timeZone, now)
  const anchorKey = parseDateKey(anchor)?.key ?? today
  let startKey
  let endKey
  let bucketUnit
  let prevAnchor
  let nextAnchor
  let isCurrent = false
  switch (period) {
    case 'week': {
      startKey = startOfWeekKey(anchorKey)
      endKey = addDaysKey(startKey, 7)
      bucketUnit = 'day'
      prevAnchor = addDaysKey(startKey, -7)
      nextAnchor = endKey
      isCurrent = startKey === startOfWeekKey(today)
      break
    }
    case 'month': {
      startKey = startOfMonthKey(anchorKey)
      endKey = addMonthsKey(startKey, 1)
      bucketUnit = 'day'
      prevAnchor = addMonthsKey(startKey, -1)
      nextAnchor = endKey
      isCurrent = startKey === startOfMonthKey(today)
      break
    }
    case 'quarter': {
      startKey = startOfQuarterKey(anchorKey)
      endKey = addMonthsKey(startKey, 3)
      bucketUnit = 'week'
      prevAnchor = addMonthsKey(startKey, -3)
      nextAnchor = endKey
      isCurrent = startKey === startOfQuarterKey(today)
      break
    }
    case 'year': {
      startKey = startOfYearKey(anchorKey)
      endKey = addMonthsKey(startKey, 12)
      bucketUnit = 'month'
      prevAnchor = addMonthsKey(startKey, -12)
      nextAnchor = endKey
      isCurrent = startKey === startOfYearKey(today)
      break
    }
    case 'custom': {
      const fromKey = parseDateKey(from)?.key ?? addDaysKey(today, -29)
      const toKey = parseDateKey(to)?.key ?? today
      const low = fromKey <= toKey ? fromKey : toKey
      const high = fromKey <= toKey ? toKey : fromKey
      startKey = low
      endKey = addDaysKey(high, 1)
      bucketUnit = daysBetweenKeys(low, endKey) > 400 ? 'month' : daysBetweenKeys(low, endKey) > 45 ? 'week' : 'day'
      prevAnchor = null
      nextAnchor = null
      isCurrent = low === today && high === today
      break
    }
    case 'day':
    default: {
      startKey = anchorKey
      endKey = addDaysKey(anchorKey, 1)
      bucketUnit = 'hour'
      prevAnchor = addDaysKey(startKey, -1)
      nextAnchor = endKey
      isCurrent = startKey === today
      break
    }
  }
  const start = msAtStartOfKey(startKey, timeZone)
  const end = msAtStartOfKey(endKey, timeZone)
  return {
    kind: period === 'custom' ? 'custom' : period,
    startKey,
    endKey,
    start,
    end,
    bucketUnit,
    prevAnchor,
    nextAnchor,
    isCurrent,
    todayKey: today,
  }
}

function bucketKeyFor(ms, unit, timeZone) {
  if (unit === 'hour') {
    const p = zonedParts(ms, timeZone)
    return `${dateKeyOf(ms, timeZone)}T${String(p.hour).padStart(2, '0')}`
  }
  if (unit === 'week') return startOfWeekKey(dateKeyOf(ms, timeZone))
  if (unit === 'month') return monthKeyOf(dateKeyOf(ms, timeZone))
  return dateKeyOf(ms, timeZone)
}

function bucketLabel(key, unit) {
  if (unit === 'hour') return `${key.slice(11, 13)}:00`
  if (unit === 'month') return String(Number(key.slice(5, 7)))
  const parsed = parseDateKey(key)
  return parsed === null ? key : `${parsed.month}/${parsed.day}`
}

function emptyBucket(key, label, start, end) {
  return { key, label, start, end, calls: 0, tokens: 0, costUsd: 0, cashCostUsd: 0, listCostUsd: 0 }
}

/** Build the empty bucket series for a resolved range. */
export function createBuckets(range, timeZone) {
  const buckets = []
  const unit = range.bucketUnit
  if (unit === 'hour') {
    const hours = Math.max(1, Math.round((range.end - range.start) / 3_600_000))
    for (let index = 0; index < hours; index += 1) {
      const start = range.start + index * 3_600_000
      const key = bucketKeyFor(start, unit, timeZone)
      buckets.push(emptyBucket(key, bucketLabel(key, unit), start, start + 3_600_000))
    }
    return buckets
  }
  if (unit === 'month') {
    const lastMonth = monthKeyOf(addDaysKey(range.endKey, -1))
    for (let key = monthKeyOf(range.startKey); key <= lastMonth; key = addMonthsKey(startOfMonthFromMonthKey(key), 1).slice(0, 7)) {
      const start = msAtStartOfKey(startOfMonthFromMonthKey(key), timeZone)
      const end = msAtStartOfKey(addMonthsKey(startOfMonthFromMonthKey(key), 1), timeZone)
      buckets.push(emptyBucket(key, bucketLabel(key, unit), start, end))
    }
    return buckets
  }
  if (unit === 'week') {
    let key = startOfWeekKey(range.startKey)
    const last = addDaysKey(range.endKey, -1)
    while (key <= last) {
      const start = msAtStartOfKey(key, timeZone)
      const end = msAtStartOfKey(addDaysKey(key, 7), timeZone)
      buckets.push(emptyBucket(key, bucketLabel(key, unit), start, end))
      key = addDaysKey(key, 7)
    }
    return buckets
  }
  let key = range.startKey
  while (key < range.endKey) {
    const start = msAtStartOfKey(key, timeZone)
    const end = msAtStartOfKey(addDaysKey(key, 1), timeZone)
    buckets.push(emptyBucket(key, bucketLabel(key, unit), start, end))
    key = addDaysKey(key, 1)
  }
  return buckets
}

// ---------------------------------------------------------------------------
// Ledger store
// ---------------------------------------------------------------------------

export class UsageStore {
  constructor({ dataDir = DEFAULT_DATA_DIR } = {}) {
    this.dataDir = path.resolve(dataDir)
    this.ledgerPath = path.join(this.dataDir, LEDGER_FILE)
    this.settingsPath = path.join(this.dataDir, SETTINGS_FILE)
    this.settings = defaultSettings()
    this.records = []
    this.seen = new Set()
    this.sessionIds = new Set()
    this.firstAt = null
    this.lastAt = null
    this.scan = {
      running: false,
      total: 0,
      done: 0,
      added: 0,
      startedAt: null,
      finishedAt: null,
      error: null,
    }
    this.ready = false
    this.initError = null
    this.writeChain = Promise.resolve()
    this.onProgress = null
    this.onChange = null
    this.lastChangeAt = 0
    this._initPromise = null
  }

  async init() {
    if (this._initPromise !== null) return this._initPromise
    this._initPromise = (async () => {
      await mkdir(this.dataDir, { recursive: true })
      await this.loadSettings()
      await this.loadLedger()
      this.ready = true
    })().catch((error) => {
      this.initError = error instanceof Error ? error.message : String(error)
      throw error
    })
    return this._initPromise
  }

  async loadSettings() {
    try {
      const text = await readFile(this.settingsPath, 'utf8')
      if (text.length > MAX_SETTINGS_BYTES) throw new Error('settings file is too large')
      this.settings = normalizeSettings(JSON.parse(text))
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.warn('[model-usage-board] settings could not be read; using defaults:', error?.message ?? error)
      }
      this.settings = defaultSettings()
    }
  }

  async loadLedger() {
    let text
    try {
      text = await readFile(this.ledgerPath, 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') return
      throw error
    }
    if (text.length > MAX_LEDGER_BYTES) {
      console.warn('[model-usage-board] ledger is larger than the in-memory limit; reading the newest records only')
      text = text.slice(-MAX_LEDGER_BYTES)
      const firstNewline = text.indexOf('\n')
      if (firstNewline >= 0) text = text.slice(firstNewline + 1)
    }
    let lineNumber = 0
    for (const line of text.split(/\r?\n/)) {
      lineNumber += 1
      if (line.trim() === '') continue
      let record
      try {
        record = JSON.parse(line)
      } catch {
        if (lineNumber > 1) console.warn(`[model-usage-board] skipped malformed ledger line ${lineNumber}`)
        continue
      }
      if (this.addToMemory(record)) continue
    }
    this.records.sort((a, b) => a.t - b.t)
  }

  addToMemory(record) {
    if (!isRecord(record)) return false
    if (typeof record.id !== 'string' || record.id.length === 0) return false
    if (this.seen.has(record.id)) return false
    const at = finiteNumber(record.t)
    const provider = typeof record.p === 'string' ? record.p : ''
    const model = typeof record.m === 'string' ? record.m : ''
    if (at <= 0 || provider === '' || model === '') return false
    const usage = isRecord(record.u) ? record.u : {}
    const normalized = {
      v: VERSION,
      id: record.id,
      t: at,
      p: provider,
      m: model,
      s: typeof record.s === 'string' ? record.s : '',
      q: Math.max(0, Math.floor(finiteNumber(record.q))),
      u: {
        i: Math.floor(nonNegative(usage.i)),
        o: Math.floor(nonNegative(usage.o)),
        r: Math.floor(nonNegative(usage.r)),
        w: Math.floor(nonNegative(usage.w)),
        rt: Math.floor(nonNegative(usage.rt)),
        total: Math.floor(nonNegative(usage.total)),
        ...(nonNegative(usage.c) > 0 ? { c: Math.floor(nonNegative(usage.c)) } : {}),
        ...(nonNegative(usage.chars) > 0 ? { chars: Math.floor(nonNegative(usage.chars)) } : {}),
      },
      turn: Math.max(0, Math.floor(finiteNumber(record.turn))),
      step: Math.max(0, Math.floor(finiteNumber(record.step))),
    }
    if (normalized.u.i + normalized.u.o + normalized.u.r + normalized.u.w + normalized.u.total === 0) return false
    this.seen.add(normalized.id)
    this.records.push(normalized)
    if (normalized.s !== '') this.sessionIds.add(normalized.s)
    if (this.firstAt === null || normalized.t < this.firstAt) this.firstAt = normalized.t
    if (this.lastAt === null || normalized.t > this.lastAt) this.lastAt = normalized.t
    return true
  }

  /** Add one record to memory and durably append it. Returns whether it was new. */
  ingest(record) {
    const added = this.addToMemory(record)
    if (!added) return false
    const line = JSON.stringify(this.records[this.records.length - 1]) + '\n'
    this.writeChain = this.writeChain
      .then(() => appendFile(this.ledgerPath, line, 'utf8'))
      .catch((error) => {
        console.warn('[model-usage-board] ledger append failed:', error?.message ?? error)
      })
    this.emitChange()
    return true
  }

  emitChange() {
    const now = Date.now()
    if (this.onChange !== null && now - this.lastChangeAt > 250) {
      this.lastChangeAt = now
      try { this.onChange() } catch { /* a subscriber must never break ingestion */ }
    }
  }

  async flush() {
    await this.writeChain
  }

  stats() {
    const firstAt = this.firstAt
    const lastAt = this.lastAt
    return {
      dir: this.dataDir,
      records: this.records.length,
      sessions: this.sessionIds.size,
      firstAt,
      lastAt,
      ready: this.ready,
      initError: this.initError,
      scan: { ...this.scan },
    }
  }

  updateScan(patch) {
    Object.assign(this.scan, patch)
    if (this.onProgress !== null) {
      try { this.onProgress({ ...this.scan }) } catch { /* ignore */ }
    }
  }

  /** Persist settings atomically and return the normalized result. */
  async saveSettings(patch) {
    const current = publicSettings(this.settings)
    const change = isRecord(patch) ? patch : {}
    const merged = { ...current }
    for (const key of ['currency', 'exchangeRate', 'timezone', 'refreshSeconds', 'costBasis', 'visualStyle', 'visible', 'position']) {
      if (Object.prototype.hasOwnProperty.call(change, key)) merged[key] = change[key]
    }
    // The settings page sends the complete price/quota tables, so an absent
    // entry means the user removed it. A patch without the table preserves it.
    if (Object.prototype.hasOwnProperty.call(change, 'prices')) {
      merged.prices = {}
      if (isRecord(change.prices)) {
        for (const [key, value] of Object.entries(change.prices)) {
          if (!safeKey(key)) continue
          const price = validatePrice(value)
          if (price !== null) merged.prices[key] = price
        }
      }
    }
    if (Object.prototype.hasOwnProperty.call(change, 'quotas')) {
      merged.quotas = {}
      if (isRecord(change.quotas)) {
        for (const [key, value] of Object.entries(change.quotas)) {
          if (!safeKey(key)) continue
          const quota = validateQuota(value)
          if (quota !== null) merged.quotas[key] = quota
        }
      }
    }
    const next = normalizeSettings(merged)
    const text = JSON.stringify(next, null, 2) + '\n'
    const tmp = `${this.settingsPath}.tmp-${process.pid}-${randomUUID()}`
    await writeFile(tmp, text, 'utf8')
    await rename(tmp, this.settingsPath)
    this.settings = next
    this.emitChange()
    return publicSettings(this.settings)
  }

  /** Settings plus the model catalog the settings page edits. */
  settingsView() {
    const byKey = new Map()
    const ensure = (provider, model) => {
      if (provider === '' || model === '') return null
      const key = `${provider}/${model}`
      let row = byKey.get(key)
      if (row === undefined) {
        row = {
          key,
          provider,
          model,
          displayName: displayNameFor(model),
          calls: 0,
          tokens: 0,
          costUsd: 0,
          lastAt: null,
          price: null,
          quota: null,
        }
        byKey.set(key, row)
      }
      return row
    }
    for (const record of this.records) {
      const row = ensure(record.p, record.m)
      if (row === null) continue
      const tokens = usageTokens(record.u)
      const price = resolvePrice(record.p, record.m, this.settings, record.t)
      row.calls += 1
      row.tokens += tokens
      row.costUsd += usageCostUsd(record.u, price)
      row.lastAt = Math.max(row.lastAt ?? 0, record.t)
    }
    for (const key of Object.keys(this.settings.prices)) {
      if (key.startsWith('family:')) continue
      const provider = key.includes('/') ? key.slice(0, key.indexOf('/')) : ''
      const model = key.includes('/') ? key.slice(key.indexOf('/') + 1) : key
      ensure(provider, model)
    }
    for (const key of Object.keys(this.settings.quotas)) {
      const provider = key.includes('/') ? key.slice(0, key.indexOf('/')) : ''
      const model = key.includes('/') ? key.slice(key.indexOf('/') + 1) : key
      ensure(provider, model)
    }
    const now = Date.now()
    const models = [...byKey.values()]
      .map((row) => {
        const price = resolvePrice(row.provider, row.model, this.settings, now)
        return {
          ...row,
          billing: billingMode(row.provider),
          price,
          official: price?.official === true,
          estimated: price?.estimated === true,
          calibrated: price?.calibrated === true,
          cashEligible: price?.cashEligible === true,
          quota: resolveQuota(row.provider, row.model, this.settings),
        }
      })
      .sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0) || a.model.localeCompare(b.model))
    return {
      settings: publicSettings(this.settings),
      models,
      data: this.stats(),
      generatedAt: Date.now(),
    }
  }

  /**
   * Aggregate one range. This is deliberately synchronous: the browser asks on
   * a few-second cadence and the in-memory ledger is the hot path.
   */
  summary({ period = 'day', anchor, from, to, currency, timeZone, modelKey, now = Date.now() } = {}) {
    const tz = validateTimezone(timeZone ?? this.settings.timezone)
    const range = resolvePeriod({ period, anchor, from, to, timeZone: tz, now })
    const currencyCode = currency === 'USD' ? 'USD' : this.settings.currency
    const rate = this.settings.exchangeRate
    const basis = this.settings.costBasis === 'list' ? 'list' : 'cash'
    const onlyModel = typeof modelKey === 'string' && modelKey !== '' ? modelKey : null
    const buckets = createBuckets(range, tz)
    const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]))
    const models = new Map()
    const quotaModels = new Map()
    const today = resolvePeriod({ period: 'day', anchor: range.todayKey, timeZone: tz, now })
    const month = resolvePeriod({ period: 'month', anchor: range.todayKey, timeZone: tz, now })
    const totals = {
      calls: 0,
      tokens: 0,
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
      reasoning: 0,
      costUsd: 0,
      cashCostUsd: 0,
      listCostUsd: 0,
      pricedCalls: 0,
      unpricedCalls: 0,
      estimatedCalls: 0,
      officialCalls: 0,
      planCalls: 0,
      creditCalls: 0,
      cacheSavedUsd: 0,
    }
    const todayTotals = { tokens: 0, costUsd: 0, cashCostUsd: 0, listCostUsd: 0, calls: 0 }
    const monthTotals = { tokens: 0, costUsd: 0, cashCostUsd: 0, listCostUsd: 0, calls: 0 }
    const recent = []

    for (const record of this.records) {
      if (onlyModel !== null && `${record.p}/${record.m}` !== onlyModel) continue
      const inRange = record.t >= range.start && record.t < range.end
      const inToday = record.t >= today.start && record.t < today.end
      const inMonth = record.t >= month.start && record.t < month.end
      if (!inRange && !inToday && !inMonth) continue
      const mode = billingMode(record.p)
      const price = resolvePrice(record.p, record.m, this.settings, record.t)
      const tokens = usageTokens(record.u)
      const listUsd = usageCostUsd(record.u, price)
      const cashEligible = mode === 'official' || (mode === 'payg' && price?.cashEligible === true)
      const cashUsd = cashEligible ? listUsd : 0
      const costUsd = basis === 'cash' ? cashUsd : listUsd
      if (inToday) {
        todayTotals.tokens += tokens
        todayTotals.costUsd += costUsd
        todayTotals.cashCostUsd += cashUsd
        todayTotals.listCostUsd += listUsd
        todayTotals.calls += 1
      }
      if (inMonth) {
        monthTotals.tokens += tokens
        monthTotals.costUsd += costUsd
        monthTotals.cashCostUsd += cashUsd
        monthTotals.listCostUsd += listUsd
        monthTotals.calls += 1
      }
      const modelKey = `${record.p}/${record.m}`
      if (inToday || inMonth) {
        let quotaRow = quotaModels.get(modelKey)
        if (quotaRow === undefined) {
          quotaRow = { key: modelKey, provider: record.p, model: record.m, todayTokens: 0, monthTokens: 0, monthCostUsd: 0 }
          quotaModels.set(modelKey, quotaRow)
        }
        if (inToday) quotaRow.todayTokens += tokens
        if (inMonth) {
          quotaRow.monthTokens += tokens
          quotaRow.monthCostUsd += costUsd
        }
      }
      if (!inRange) continue
      totals.calls += 1
      totals.tokens += tokens
      totals.input += record.u.i
      totals.output += record.u.o
      totals.cacheRead += record.u.r
      totals.cacheWrite += record.u.w
      totals.reasoning += record.u.rt
      totals.costUsd += costUsd
      totals.cashCostUsd += cashUsd
      totals.listCostUsd += listUsd
      if (mode === 'plan') totals.planCalls += 1
      if (mode === 'credits') totals.creditCalls += 1
      if (price === null) totals.unpricedCalls += 1
      else {
        totals.pricedCalls += 1
        if (price.estimated) totals.estimatedCalls += 1
        if (price.official) totals.officialCalls += 1
        if (cashEligible) totals.cacheSavedUsd += (record.u.r * Math.max(0, price.input - price.cacheRead)) / 1_000_000
      }
      let row = models.get(modelKey)
      if (row === undefined) {
        row = {
          key: modelKey,
          provider: record.p,
          model: record.m,
          displayName: displayNameFor(record.m),
          calls: 0,
          tokens: 0,
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          reasoning: 0,
          costUsd: 0,
          cashCostUsd: 0,
          listCostUsd: 0,
          pricedCalls: 0,
          unpricedCalls: 0,
          estimated: false,
          official: false,
          calibrated: false,
          planCalls: 0,
          creditCalls: 0,
          billing: mode,
          price,
          quota: resolveQuota(record.p, record.m, this.settings),
          todayTokens: 0,
          monthTokens: 0,
          monthCostUsd: 0,
          lastAt: 0,
        }
        models.set(modelKey, row)
      }
      row.calls += 1
      row.tokens += tokens
      row.input += record.u.i
      row.output += record.u.o
      row.cacheRead += record.u.r
      row.cacheWrite += record.u.w
      row.reasoning += record.u.rt
      row.costUsd += costUsd
      row.cashCostUsd += cashUsd
      row.listCostUsd += listUsd
      row.lastAt = Math.max(row.lastAt, record.t)
      if (inToday) row.todayTokens += tokens
      if (inMonth) {
        row.monthTokens += tokens
        row.monthCostUsd += costUsd
      }
      if (mode === 'plan') row.planCalls += 1
      if (mode === 'credits') row.creditCalls += 1
      if (price === null) row.unpricedCalls += 1
      else {
        row.pricedCalls += 1
        if (price.estimated) row.estimated = true
        if (price.official) row.official = true
        if (price.calibrated) row.calibrated = true
      }
      const bucket = bucketMap.get(bucketKeyFor(record.t, range.bucketUnit, tz))
      if (bucket !== undefined) {
        bucket.calls += 1
        bucket.tokens += tokens
        bucket.costUsd += costUsd
        bucket.cashCostUsd += cashUsd
        bucket.listCostUsd += listUsd
      }
      recent.push({ at: record.t, provider: record.p, model: record.m, tokens, costUsd, cashUsd, listUsd, billing: mode })
      if (recent.length > 4) recent.shift()
    }

    const priceCoverage = totals.calls === 0 ? 1 : totals.pricedCalls / totals.calls
    const durationMs = Math.max(1, range.end - range.start)
    const bucketList = buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      start: bucket.start,
      end: bucket.end,
      calls: bucket.calls,
      tokens: bucket.tokens,
      costUsd: bucket.costUsd,
      cashCostUsd: bucket.cashCostUsd,
      listCostUsd: bucket.listCostUsd,
      cost: currencyCode === 'CNY' ? bucket.costUsd * rate : bucket.costUsd,
      cashCost: currencyCode === 'CNY' ? bucket.cashCostUsd * rate : bucket.cashCostUsd,
      listCost: currencyCode === 'CNY' ? bucket.listCostUsd * rate : bucket.listCostUsd,
    }))
    const current = Date.now()
    const modelList = [...models.values()]
      .map((row) => {
        const currentPrice = resolvePrice(row.provider, row.model, this.settings, current)
        return {
          ...row,
          price: currentPrice,
          billing: billingMode(row.provider),
          cost: currencyCode === 'CNY' ? row.costUsd * rate : row.costUsd,
          cashCost: currencyCode === 'CNY' ? row.cashCostUsd * rate : row.cashCostUsd,
          listCost: currencyCode === 'CNY' ? row.listCostUsd * rate : row.listCostUsd,
          monthCost: currencyCode === 'CNY' ? row.monthCostUsd * rate : row.monthCostUsd,
        }
      })
      .sort((a, b) => b.costUsd - a.costUsd || b.tokens - a.tokens || a.model.localeCompare(b.model))
    const otherReferenceUsd = modelList.reduce(
      (sum, row) => row.cashCostUsd === 0 ? sum + row.listCostUsd : sum,
      0,
    )
    const totalSpendUsd = totals.cashCostUsd + otherReferenceUsd
    const quotaRows = [...quotaModels.values()]
      .map((row) => {
        const quota = resolveQuota(row.provider, row.model, this.settings)
        if (quota === null) return null
        return {
          ...row,
          displayName: displayNameFor(row.model),
          billing: billingMode(row.provider),
          quota,
          cashCostUsd: 0,
          listCostUsd: 0,
          cashCost: 0,
          listCost: 0,
          cost: currencyCode === 'CNY' ? row.monthCostUsd * rate : row.monthCostUsd,
          monthCost: currencyCode === 'CNY' ? row.monthCostUsd * rate : row.monthCostUsd,
          dailyRatio: quota.dailyTokens > 0 ? row.todayTokens / quota.dailyTokens : null,
          monthlyTokenRatio: quota.monthlyTokens > 0 ? row.monthTokens / quota.monthlyTokens : null,
          monthlyCostRatio: quota.monthlyUsd > 0 ? row.monthCostUsd / quota.monthlyUsd : null,
        }
      })
      .filter(row => row !== null)
      .sort((a, b) => (b.monthlyCostRatio ?? 0) - (a.monthlyCostRatio ?? 0) || b.monthTokens - a.monthTokens)

    return {
      generatedAt: Date.now(),
      version: VERSION,
      currency: currencyCode,
      exchangeRate: rate,
      timezone: tz,
      costBasis: basis,
      period: {
        kind: range.kind,
        startKey: range.startKey,
        endKey: range.endKey,
        start: range.start,
        end: range.end,
        bucketUnit: range.bucketUnit,
        prevAnchor: range.prevAnchor,
        nextAnchor: range.nextAnchor,
        isCurrent: range.isCurrent,
        todayKey: range.todayKey,
        durationMs,
      },
      totals: {
        ...totals,
        cost: currencyCode === 'CNY' ? totals.costUsd * rate : totals.costUsd,
        cashCost: currencyCode === 'CNY' ? totals.cashCostUsd * rate : totals.cashCostUsd,
        listCost: currencyCode === 'CNY' ? totals.listCostUsd * rate : totals.listCostUsd,
        otherCostUsd: otherReferenceUsd,
        otherCost: currencyCode === 'CNY' ? otherReferenceUsd * rate : otherReferenceUsd,
        totalSpendUsd,
        totalSpend: currencyCode === 'CNY' ? totalSpendUsd * rate : totalSpendUsd,
        cacheSaved: currencyCode === 'CNY' ? totals.cacheSavedUsd * rate : totals.cacheSavedUsd,
        priceCoverage,
      },
      buckets: bucketList,
      models: modelList,
      quotaRows,
      today: {
        startKey: today.startKey,
        tokens: todayTotals.tokens,
        calls: todayTotals.calls,
        costUsd: todayTotals.costUsd,
        cashCostUsd: todayTotals.cashCostUsd,
        listCostUsd: todayTotals.listCostUsd,
        cost: currencyCode === 'CNY' ? todayTotals.costUsd * rate : todayTotals.costUsd,
        cashCost: currencyCode === 'CNY' ? todayTotals.cashCostUsd * rate : todayTotals.cashCostUsd,
        listCost: currencyCode === 'CNY' ? todayTotals.listCostUsd * rate : todayTotals.listCostUsd,
      },
      month: {
        startKey: month.startKey,
        tokens: monthTotals.tokens,
        calls: monthTotals.calls,
        costUsd: monthTotals.costUsd,
        cashCostUsd: monthTotals.cashCostUsd,
        listCostUsd: monthTotals.listCostUsd,
        cost: currencyCode === 'CNY' ? monthTotals.costUsd * rate : monthTotals.costUsd,
        cashCost: currencyCode === 'CNY' ? monthTotals.cashCostUsd * rate : monthTotals.cashCostUsd,
        listCost: currencyCode === 'CNY' ? monthTotals.listCostUsd * rate : monthTotals.listCostUsd,
      },
      recent,
      scan: { ...this.scan },
      data: this.stats(),
    }
  }

  /** Export the current range as CSV text (one row per model plus one per bucket). */
  exportCsv(query) {
    const summary = this.summary(query)
    const lines = []
    lines.push('type,date,provider,model,tokens,input,output,cache_read,cache_write,calls,cost_usd,cost_display,cost_basis,cash_usd,list_usd')
    for (const bucket of summary.buckets) {
      lines.push([
        'bucket', bucket.key, '', '', bucket.tokens, '', '', '', '', bucket.calls,
        bucket.costUsd.toFixed(6), bucket.cost.toFixed(6), summary.costBasis,
        bucket.cashCostUsd.toFixed(6), bucket.listCostUsd.toFixed(6),
      ].map(csvCell).join(','))
    }
    for (const model of summary.models) {
      lines.push([
        'model', '', model.provider, model.model, model.tokens, model.input, model.output, model.cacheRead, model.cacheWrite,
        model.calls, model.costUsd.toFixed(6), model.cost.toFixed(6), summary.costBasis,
        model.cashCostUsd.toFixed(6), model.listCostUsd.toFixed(6),
      ].map(csvCell).join(','))
    }
    return lines.join('\r\n') + '\r\n'
  }
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export { deepMerge, normalizeSettings, validateTimezone, isRecord, safeKey }
