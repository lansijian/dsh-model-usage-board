/**
 * Model Usage Board — browser half.
 *
 * A single `shell.overlay` entry: a draggable, collapsible panel with period
 * views, a token/cost trend, per-model quota bars, and an editable price/quota
 * table. Data arrives from the host half's same-origin JSON/SSE API.
 */

window.__ModuleLoader__.load({
  id: '@local/model-usage-board',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const {
      useCallback, useEffect, useMemo, useRef, useState,
    } = React

    const NS = 'modelUsageBoard'
    const API = '/dsh-usage/api'

    const zh = {
      title: '模型用量',
      subtitle: '实时 · 每个模型',
      live: '实时',
      newModel: '新',
      phaseDay: '白天',
      phaseAfternoon: '下午',
      phaseDusk: '傍晚',
      phaseNight: '晚上',
      phaseDawn: '朝霞',
      autoPhase: '自动时段',
      phaseHint: '按本地时间整块切换背景、文字、图表和边框颜色；到点自动更新。',
      offline: '离线',
      loading: '正在读取用量…',
      error: '读取失败',
      retry: '重试',
      today: '今天',
      'period.day': '日',
      'period.week': '周',
      'period.month': '月',
      'period.quarter': '季',
      'period.year': '年',
      'period.custom': '自定义',
      prev: '上一周期',
      next: '下一周期',
      refresh: '刷新',
      settings: '设置',
      collapse: '收起',
      expand: '展开',
      desktop: '桌面窗',
      desktopTitle: '在独立窗口打开（可拖到桌面）',
      totalCost: '总费用',
      actualCost: '实际支出',
      totalSpend: '总支出',
      otherCost: '套餐/积分参考',
      totalSpendHint: '实际支出 + 套餐、积分等非现金用量的按量参考',
      referenceCost: '按量参考价',
      costBasis: '计费口径',
      costBasisCash: '实际支出（仅按量）',
      costBasisList: '按量参考价（含套餐/积分折算）',
      cashHint: '套餐与积分模型不计现金；仅按量付费和官方价计入。',
      listHint: '按公开价或配置单价折算，不是实际账单。',
      officialPrice: '官方价',
      officialHint: 'DeepSeek 官方峰谷价已按每次调用时间逐次计算。',
      referenceEstimate: '按量参考价',
      includesFamilyEstimate: '含家族估算',
      priceOfficialPeak: '官方峰谷价',
      priceListReference: '官方按量参考',
      priceFamilyEstimate: '家族估算',
      priceNexChars: '按字符参考',
      nexCharsHint: 'NEX 按 ¥1.20 / 万字符估算；优先使用 usage.c，缺失时以输出 token 近似字符数，不是官方账单。',
      priceCustom: '自定义价',
      platformCalibrated: '平台校准',
      calibrationHint: '按平台账单反推的参考单价，不是官方牌价。',
      referenceHint: '按公开按量价折算，不是套餐账单。',
      actualShort: '实际',
      plan: '套餐内',
      credits: '积分',
      peak: '高峰',
      offPeak: '空闲',
      billing: '计费',
      planHint: 'Token Plan / Step Plan 等订阅套餐内调用，不计按次现金。',
      creditsHint: '网关积分或额度内调用，不计按次现金。',
      deepseekHint: 'DeepSeek Flash / V4 Pro 默认按官方峰谷价（北京时间，工作日 09:00–12:00、14:00–18:00 为高峰，其余及节假日为空闲半价）逐次计算。',
      tokens: 'Token',
      calls: '调用',
      cacheSaved: '缓存节省',
      estimated: '参考价',
      unpriced: '未定价',
      quota: '额度',
      used: '已用',
      remaining: '剩余',
      noQuota: '未设置额度',
      noData: '这个时间范围内还没有模型调用',
      noModels: '还没有可显示的模型',
      trend: '趋势',
      chartTokens: 'Token',
      chartCost: '费用',
      modelTable: '模型明细',
      modelDetail: '模型明细',
      backToBoard: '返回总览',
      avgPerCall: '平均每次',
      recentCalls: '最近调用',
      noCalls: '当前范围没有这个模型的调用',
      modelTrend: '该模型趋势',
      costLabel: '费用',
      model: '模型',
      provider: '提供商',
      input: '输入',
      output: '输出',
      cacheRead: '缓存读',
      cacheWrite: '缓存写',
      reasoning: '推理',
      price: '单价',
      priceUnit: '美元 / 百万 Token',
      perMillionShort: '/M',
      currentUnit: '当前',
      perDay: '日额度',
      perMonth: '月额度',
      monthlyBudget: '月预算',
      syncing: '同步中',
      synced: '已同步',
      records: '条记录',
      sessions: '个会话',
      updated: '更新于',
      dataDir: '数据目录',
      rescan: '重新扫描',
      rescanning: '正在扫描会话…',
      customFrom: '开始',
      customTo: '结束',
      apply: '应用',
      currency: '币种',
      rate: 'USD → CNY 汇率',
      refreshSec: '自动刷新间隔（秒）',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      saveFailed: '保存失败',
      resetPosition: '恢复默认位置',
      prices: '价格与额度',
      pricesHint: '价格单位为美元 / 百万 Token；留空使用参考价。额度 0 表示不限制。',
      restoreEstimate: '恢复参考价',
      clearQuota: '清除额度',
      data: '数据',
      dataHint: '账本只保存在本机，不写入 C 盘。看板汇总全部会话；单聊费用以聊天内徽标为准。',
      scanProgress: '扫描会话',
      scanDone: '扫描完成',
      warnings: '提示',
      unpricedHint: '有调用未命中价格表，费用按 0 计。',
      estimatedHint: '包含按模型家族估算的参考价，可在设置中精确配置。',
      desktopHint: '独立窗口可拖到桌面任意位置；数据仍由本机 Host 提供。',
      customHint: '选择起止日期，按本地时区统计。',
      toggleCurrency: '切换币种',
      modelCount: '个模型',
      quotaScopeDay: '今日额度',
      quotaScopeMonth: '本月额度',
      over: '已超额',
      settingsBack: '返回看板',
      settingsSubtitle: '价格、额度与数据',
      visualStyle: '界面风格',
      styleAuto: '跟随时间',
      styleGlass: '液态玻璃',
      styleCyber: '赛博霓虹',
      styleMatrix: '矩阵终端',
      styleAurora: '深空极光',
      stylePrism: '虹彩棱镜',
      styleHint: '跟随时间会按白天 / 下午 / 傍晚 / 晚上银河 / 朝霞五套整主题自动切换；其他风格保持固定。',
      showBoard: '显示悬浮看板',
      hideBoard: '隐藏悬浮看板',
      boardHidden: '看板已隐藏',
      launcher: '打开模型用量',
      power: '开关看板',
      unsavedChanges: '有未保存的修改',
      unsavedConfirm: '设置还有未保存的修改，确定离开吗？',
      liveFeed: '最新',
      dragHint: '拖动标题栏移动，方向键微调',
      settingsSaved: '设置已保存',
      settingsSaveFailed: '设置保存失败',
      requestFailed: '请求失败',
      scanFailed: '会话扫描失败',
      scanUnavailable: '会话查询服务不可用',
      exportCsv: '导出 CSV',
      justNow: '刚刚',
      secondsAgo: '秒前',
      minutesAgo: '分钟前',
      hoursAgo: '小时前',
      daysAgo: '天前',
      callUnit: '次',
      tokenShort: 'tok',
      unlimited: '不限额',
      noPrice: '未设置',
      'priceHint': '未配置的价格按 0 计，模型行会标记“未定价”。',
      'dataReload': '重新读取',
      'closeSettings': '返回',
      'scanningCount': '扫描中',
      'monthShort': '月',
      'dayShort': '日',
      'rangeTo': '至',
      'settingsQuotaHint': '按日 Token 或按月费用设置额度，达到 100% 时显示为超额。',
      'drag': '拖动',
      'desktopBlocked': '浏览器拦截了新窗口，请允许弹出窗口。',
      'desktopOpened': '原生浮窗已打开，拖顶部把手即可移动。',
      'desktopFailed': '原生浮窗启动失败，请确认 WebView2 运行时可用。',
      'filterAll': '全部',
    }

    const en = {
      title: 'Model usage',
      subtitle: 'Live · per model',
      live: 'Live',
      newModel: 'NEW',
      phaseDay: 'Day',
      phaseAfternoon: 'Afternoon',
      phaseDusk: 'Dusk',
      phaseNight: 'Night',
      phaseDawn: 'Dawn',
      autoPhase: 'Auto phase',
      phaseHint: 'The whole board switches its background, text, chart, and border palette with local time.',
      offline: 'Offline',
      loading: 'Loading usage…',
      error: 'Could not load',
      retry: 'Retry',
      today: 'Today',
      'period.day': 'Day',
      'period.week': 'Week',
      'period.month': 'Month',
      'period.quarter': 'Quarter',
      'period.year': 'Year',
      'period.custom': 'Custom',
      prev: 'Previous period',
      next: 'Next period',
      refresh: 'Refresh',
      settings: 'Settings',
      collapse: 'Collapse',
      expand: 'Expand',
      desktop: 'Desktop',
      desktopTitle: 'Open in a separate window you can drag anywhere',
      totalCost: 'Total cost',
      actualCost: 'Actual spend',
      totalSpend: 'Total spend',
      otherCost: 'Plan/credit reference',
      totalSpendHint: 'Actual cash plus the list reference for plan and credit usage',
      referenceCost: 'List reference',
      costBasis: 'Cost basis',
      costBasisCash: 'Actual (pay-as-you-go)',
      costBasisList: 'List reference (plans/credits included)',
      cashHint: 'Plan and credit routes add no cash; only pay-as-you-go and official prices count.',
      listHint: 'Converted from public or configured prices; not an invoice.',
      officialPrice: 'Official',
      officialHint: 'DeepSeek official peak/off-peak rates are applied per call.',
      referenceEstimate: 'List reference',
      includesFamilyEstimate: 'includes family estimate',
      priceOfficialPeak: 'Official peak/off-peak',
      priceListReference: 'Official list reference',
      priceFamilyEstimate: 'Family estimate',
      priceNexChars: 'Per-character reference',
      nexCharsHint: 'NEX is estimated at ¥1.20 per 10k characters; usage.c is preferred, otherwise output tokens are used as a proxy. Not an official invoice.',
      priceCustom: 'Custom price',
      platformCalibrated: 'Platform calibrated',
      calibrationHint: 'Reference rate inferred from a platform bill; not an official list price.',
      referenceHint: 'Converted from public list prices; not a plan invoice.',
      actualShort: 'Actual',
      plan: 'Plan',
      credits: 'Credits',
      peak: 'Peak',
      offPeak: 'Off-peak',
      billing: 'Billing',
      planHint: 'Included in a subscription plan (Token Plan / Step Plan); no per-call cash.',
      creditsHint: 'Covered by gateway credits; no per-call cash.',
      deepseekHint: 'DeepSeek Flash / V4 Pro use official CN peak rates (Beijing time, weekdays 09:00–12:00 and 14:00–18:00; off-peak is half, including weekends and holidays), applied per call.',
      tokens: 'Tokens',
      calls: 'Calls',
      cacheSaved: 'Cache savings',
      estimated: 'Estimate',
      unpriced: 'Unpriced',
      quota: 'Quota',
      used: 'used',
      remaining: 'left',
      noQuota: 'No quota set',
      noData: 'No model calls in this range yet',
      noModels: 'No models to show yet',
      trend: 'Trend',
      chartTokens: 'Tokens',
      chartCost: 'Cost',
      modelTable: 'Models',
      modelDetail: 'Model detail',
      backToBoard: 'Back to overview',
      avgPerCall: 'Per call',
      recentCalls: 'Recent calls',
      noCalls: 'No calls for this model in this range',
      modelTrend: 'This model trend',
      costLabel: 'Cost',
      model: 'Model',
      provider: 'Provider',
      input: 'Input',
      output: 'Output',
      cacheRead: 'Cache read',
      cacheWrite: 'Cache write',
      reasoning: 'Reasoning',
      price: 'Price',
      priceUnit: 'USD / 1M tokens',
      perMillionShort: '/M',
      currentUnit: 'Current',
      perDay: 'Daily quota',
      perMonth: 'Monthly quota',
      monthlyBudget: 'Monthly budget',
      syncing: 'Syncing',
      synced: 'Synced',
      records: 'records',
      sessions: 'sessions',
      updated: 'Updated',
      dataDir: 'Data directory',
      rescan: 'Rescan',
      rescanning: 'Scanning sessions…',
      customFrom: 'From',
      customTo: 'To',
      apply: 'Apply',
      currency: 'Currency',
      rate: 'USD → CNY rate',
      refreshSec: 'Auto refresh (seconds)',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      saveFailed: 'Save failed',
      resetPosition: 'Reset position',
      prices: 'Prices & quotas',
      pricesHint: 'Prices are USD per 1M tokens; leave blank to use the reference estimate. A quota of 0 means unlimited.',
      restoreEstimate: 'Use estimate',
      clearQuota: 'Clear quota',
      data: 'Data',
      dataHint: 'The ledger stays on this machine and is never written to the C: drive. The board aggregates all sessions; a single chat badge covers only that chat.',
      scanProgress: 'Scanning sessions',
      scanDone: 'Scan complete',
      warnings: 'Notes',
      unpricedHint: 'Some calls have no matching price; their cost counts as 0.',
      estimatedHint: 'Includes reference estimates by model family; set exact prices in Settings.',
      desktopHint: 'The separate window can sit anywhere on your desktop; data still comes from this local Host.',
      customHint: 'Pick start and end dates; totals use the local time zone.',
      toggleCurrency: 'Toggle currency',
      modelCount: 'models',
      quotaScopeDay: 'Daily quota',
      quotaScopeMonth: 'Monthly quota',
      over: 'over',
      settingsBack: 'Back to board',
      settingsSubtitle: 'Prices, quotas, and data',
      visualStyle: 'Visual style',
      styleAuto: 'Auto by time',
      styleGlass: 'Liquid glass',
      styleCyber: 'Cyber neon',
      styleMatrix: 'Matrix terminal',
      styleAurora: 'Deep aurora',
      stylePrism: 'Prism',
      styleHint: 'Auto switches five full palettes: day / afternoon / sunset / Milky Way night / dawn glow. Fixed styles stay fixed.',
      showBoard: 'Show floating board',
      hideBoard: 'Hide floating board',
      boardHidden: 'Board hidden',
      launcher: 'Open model usage',
      power: 'Toggle board',
      unsavedChanges: 'Unsaved changes',
      unsavedConfirm: 'Settings have unsaved changes. Leave anyway?',
      liveFeed: 'Latest',
      dragHint: 'Drag the title bar to move; arrow keys nudge',
      settingsSaved: 'Settings saved',
      settingsSaveFailed: 'Could not save settings',
      requestFailed: 'Request failed',
      scanFailed: 'Session scan failed',
      scanUnavailable: 'Session query service is unavailable',
      exportCsv: 'Export CSV',
      justNow: 'just now',
      secondsAgo: 's ago',
      minutesAgo: 'm ago',
      hoursAgo: 'h ago',
      daysAgo: 'd ago',
      callUnit: 'calls',
      tokenShort: 'tok',
      unlimited: 'unlimited',
      noPrice: 'not set',
      'priceHint': 'An unconfigured price counts as 0; the model row is marked “Unpriced”.',
      'dataReload': 'Reload',
      'closeSettings': 'Back',
      'scanningCount': 'scanning',
      'monthShort': 'mo',
      'dayShort': 'd',
      'rangeTo': 'to',
      'settingsQuotaHint': 'Set a daily token or monthly cost quota; 100% is shown as over quota.',
      'drag': 'Drag',
      'desktopBlocked': 'The browser blocked the new window; allow pop-ups for this page.',
      'desktopOpened': 'Native floating window opened; drag its top grip to move it.',
      'desktopFailed': 'The native floating window failed to start. Check that the WebView2 runtime is available.',
      'filterAll': 'All',
    }

    const CSS = `
      .mub-root { position: fixed; z-index: 30; pointer-events: auto; color: var(--dsw-alias-label-primary); font-family: inherit; font-size: 12px; line-height: 1.35; }
      .mub-panel { position: relative; width: 408px; max-width: calc(100vw - 24px); height: 640px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; border-radius: 18px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 20%, transparent); background: linear-gradient(160deg, color-mix(in srgb, var(--dsw-alias-bg-overlay) 80%, transparent), color-mix(in srgb, var(--dsw-alias-bg-overlay) 72%, transparent)); backdrop-filter: blur(34px) saturate(118%); box-shadow: 0 30px 80px color-mix(in srgb, var(--dsw-alias-label-primary) 28%, transparent), 0 3px 12px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.32), inset 0 -1px 0 rgba(0,0,0,.34), inset 0 0 0 1px rgba(255,255,255,.045); }
      .mub-panel::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; border-radius: inherit; background: linear-gradient(122deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,.025) 20%, transparent 42%, transparent 68%, rgba(255,255,255,.035) 86%, rgba(255,255,255,.07) 100%); }
      .mub-panel::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 3; border-radius: inherit; box-shadow: inset 0 1px 0 rgba(255,255,255,.34), inset 0 -1px 0 rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.04); }
      .mub-panel > * { position: relative; z-index: 1; }
      .mub-head { background: linear-gradient(180deg, rgba(255,255,255,.045), transparent); }
      .mub-head::after { content: ''; position: absolute; top: 0; left: 11%; right: 11%; height: 1px; border-radius: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent); opacity: .5; pointer-events: none; }
      .mub-drift { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; border-radius: inherit; }
      .mub-panel > .mub-drift { z-index: 0; }
      .mub-drift span { position: absolute; bottom: -18px; color: var(--mub-accent, var(--dsw-alias-brand-primary)); font-weight: 600; letter-spacing: .04em; opacity: 0; animation-name: mub-token-float; animation-timing-function: linear; animation-iteration-count: infinite; white-space: nowrap; }
      @keyframes mub-token-float { 0% { transform: translate3d(0, 0, 0) scale(.92); opacity: 0; } 12% { opacity: .28; } 70% { opacity: .14; } 100% { transform: translate3d(10px, -660px, 0) scale(1.05); opacity: 0; } }
      .mub-phase-morning { --mub-glow-1: rgba(255, 183, 112, .24); --mub-glow-2: rgba(120, 203, 255, .15); --mub-glow-3: rgba(184, 255, 220, .10); --mub-phase-accent: #ffd19a; }
      .mub-phase-noon { --mub-glow-1: rgba(74, 194, 255, .23); --mub-glow-2: rgba(90, 255, 218, .14); --mub-glow-3: rgba(255, 255, 255, .06); --mub-phase-accent: #8feaff; }
      .mub-phase-evening { --mub-glow-1: rgba(255, 111, 168, .25); --mub-glow-2: rgba(174, 96, 255, .17); --mub-glow-3: rgba(255, 174, 100, .11); --mub-phase-accent: #ffa8c7; }
      .mub-phase-night { --mub-glow-1: rgba(78, 116, 255, .21); --mub-glow-2: rgba(150, 102, 255, .15); --mub-glow-3: rgba(50, 200, 220, .08); --mub-phase-accent: #a8beff; }
      .mub-phase-layer { position: absolute; inset: 0; z-index: 0; pointer-events: none; border-radius: inherit; opacity: .85; background: radial-gradient(68% 46% at 10% 0%, var(--mub-glow-1, transparent), transparent 64%), radial-gradient(56% 46% at 100% 0%, var(--mub-glow-2, transparent), transparent 64%), radial-gradient(80% 48% at 50% 100%, var(--mub-glow-3, transparent), transparent 72%); }
      .mub-panel > .mub-phase-layer { z-index: 0; }
      .mub-style-glass .mub-phase-layer { opacity: .72; }
      .mub-style-cyber .mub-phase-layer { opacity: .55; }
      .mub-style-matrix .mub-phase-layer { opacity: .42; }
      .mub-style-aurora .mub-phase-layer { opacity: .78; }
      .mub-style-prism .mub-phase-layer { opacity: .7; }
      .mub-style-cyber { --mub-accent: #45f3ff; --dsw-alias-brand-primary: #45f3ff; --dsw-alias-label-primary: #e8f7ff; --dsw-alias-label-secondary: #8da8bb; --dsw-alias-border-l1: rgba(120,220,255,.16); --dsw-alias-bg-layer-2: rgba(69,243,255,.08); --dsw-alias-bg-overlay: rgba(8,18,32,.94); }
      .mub-style-cyber .mub-panel { background: linear-gradient(160deg, rgba(4, 9, 20, .88), rgba(5, 12, 26, .80)); border-color: rgba(69, 243, 255, .34); box-shadow: 0 30px 80px rgba(0,0,0,.62), 0 0 0 1px rgba(69,243,255,.08), inset 0 1px 0 rgba(255,255,255,.17), inset 0 -1px 0 rgba(0,0,0,.4); backdrop-filter: blur(26px) saturate(130%); }
      .mub-style-cyber .mub-panel::before { background-image: linear-gradient(rgba(69,243,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(69,243,255,.06) 1px, transparent 1px), linear-gradient(122deg, rgba(255,255,255,.09), transparent 34%); background-size: 22px 22px, 22px 22px, 100% 100%; }
      .mub-style-cyber .mub-head::after { background: linear-gradient(90deg, transparent, #45f3ff, #ff4fd8, transparent); opacity: .7; }
      .mub-style-cyber .mub-tab.mub-active { background: rgba(69,243,255,.13); color: #d8feff; border-color: rgba(69,243,255,.34); box-shadow: 0 0 16px rgba(69,243,255,.12); }
      .mub-style-cyber .mub-drift span { color: #45f3ff; text-shadow: 0 0 9px rgba(69,243,255,.4); }
      .mub-style-cyber .mub-pill, .mub-style-cyber .mub-launcher { background: linear-gradient(145deg, rgba(8,20,38,.94), rgba(3,8,18,.9)); border-color: rgba(69,243,255,.38); }
      .mub-style-matrix { --mub-accent: #46ff9f; --dsw-alias-brand-primary: #46ff9f; --dsw-alias-label-primary: #d8ffe8; --dsw-alias-label-secondary: #79b692; --dsw-alias-border-l1: rgba(70,255,159,.16); --dsw-alias-bg-layer-2: rgba(70,255,159,.08); --dsw-alias-bg-overlay: rgba(4,18,10,.95); }
      .mub-style-matrix .mub-panel { background: linear-gradient(160deg, rgba(3, 13, 8, .91), rgba(2, 8, 5, .84)); border-color: rgba(70, 255, 159, .30); box-shadow: 0 30px 80px rgba(0,0,0,.66), 0 0 0 1px rgba(70,255,159,.07), inset 0 1px 0 rgba(255,255,255,.13), inset 0 -1px 0 rgba(0,0,0,.45); font-family: "Cascadia Code", "Consolas", "Microsoft YaHei", monospace; }
      .mub-style-matrix .mub-panel::before { background-image: linear-gradient(rgba(70,255,159,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(70,255,159,.055) 1px, transparent 1px); background-size: 18px 18px; }
      .mub-style-matrix .mub-head::after { background: linear-gradient(90deg, transparent, #46ff9f, transparent); opacity: .7; }
      .mub-style-matrix .mub-tab.mub-active { background: rgba(70,255,159,.12); color: #c9ffe2; border-color: rgba(70,255,159,.32); }
      .mub-style-matrix .mub-drift span { color: #46ff9f; text-shadow: 0 0 8px rgba(70,255,159,.35); }
      .mub-style-matrix .mub-pill, .mub-style-matrix .mub-launcher { background: linear-gradient(145deg, rgba(5,24,13,.95), rgba(2,10,5,.92)); border-color: rgba(70,255,159,.34); }
      .mub-style-aurora { --mub-accent: #c7a6ff; --dsw-alias-brand-primary: #c7a6ff; --dsw-alias-label-primary: #f0eaff; --dsw-alias-label-secondary: #a99bc9; --dsw-alias-border-l1: rgba(199,166,255,.16); --dsw-alias-bg-layer-2: rgba(199,166,255,.09); --dsw-alias-bg-overlay: rgba(10,12,30,.94); }
      .mub-style-aurora .mub-panel { background: radial-gradient(80% 58% at 12% 0%, rgba(111, 70, 255, .28), transparent 62%), radial-gradient(62% 45% at 100% 8%, rgba(0, 220, 200, .17), transparent 62%), linear-gradient(160deg, rgba(8,10,25,.89), rgba(4,7,18,.82)); border-color: rgba(199,166,255,.28); box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(199,166,255,.06), inset 0 1px 0 rgba(255,255,255,.18); }
      .mub-style-aurora .mub-panel::before { background: radial-gradient(2px 2px at 18% 22%, rgba(255,255,255,.6), transparent 100%), radial-gradient(1.5px 1.5px at 72% 14%, rgba(255,255,255,.5), transparent 100%), radial-gradient(1.5px 1.5px at 44% 38%, rgba(255,255,255,.4), transparent 100%), linear-gradient(122deg, rgba(255,255,255,.10), transparent 38%); background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%; }
      .mub-style-aurora .mub-head::after { background: linear-gradient(90deg, transparent, #c7a6ff, #5ef1d4, transparent); opacity: .65; }
      .mub-style-aurora .mub-tab.mub-active { background: rgba(199,166,255,.14); color: #f0e8ff; border-color: rgba(199,166,255,.3); }
      .mub-style-aurora .mub-drift span { color: #c7a6ff; text-shadow: 0 0 9px rgba(199,166,255,.4); }
      .mub-style-aurora .mub-pill, .mub-style-aurora .mub-launcher { background: linear-gradient(145deg, rgba(15,12,34,.94), rgba(5,8,20,.9)); border-color: rgba(199,166,255,.32); }
      .mub-style-prism { --mub-accent: #ff9ad8; --mub-rainbow: linear-gradient(120deg, #ff5f9e, #ffb86b, #f9f871, #5ef1d4, #5aa9ff, #b388ff, #ff5f9e); --dsw-alias-brand-primary: #ff9ad8; --dsw-alias-label-primary: #f4efff; --dsw-alias-label-secondary: #b8a9cc; --dsw-alias-border-l1: rgba(255,255,255,.14); --dsw-alias-bg-layer-2: rgba(255,255,255,.06); --dsw-alias-bg-overlay: rgba(12,8,24,.95); }
      .mub-style-prism .mub-panel { background: linear-gradient(160deg, rgba(13,8,26,.91), rgba(5,6,18,.84)); border-color: transparent; box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06), inset 0 1px 0 rgba(255,255,255,.2); }
      .mub-style-prism .mub-panel::before { background: linear-gradient(120deg, rgba(255,95,158,.11), rgba(90,169,255,.10) 45%, rgba(94,241,212,.08)); }
      .mub-style-prism .mub-panel::after { content: ''; position: absolute; inset: 0; z-index: 3; border-radius: inherit; padding: 1px; background: var(--mub-rainbow); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; box-shadow: none; }
      .mub-style-prism .mub-head::after { background: var(--mub-rainbow); opacity: .7; }
      .mub-style-prism .mub-tab.mub-active { background: rgba(255,255,255,.10); color: #fff; border-color: rgba(255,255,255,.22); }
      .mub-style-prism .mub-drift span { color: #ffb3e6; text-shadow: 0 0 9px rgba(255,120,200,.35); }
      .mub-style-prism .mub-pill, .mub-style-prism .mub-launcher { background: linear-gradient(145deg, rgba(24,14,38,.94), rgba(7,8,20,.9)); border-color: rgba(255,255,255,.18); }
      .mub-panel * { box-sizing: border-box; }
      /* ---- Auto time-of-day themes ---- */
      .mub-phase-layer { display: none; }
      .mub-style-auto {
        --mub-accent: #2f7cf6;
        --dsw-alias-brand-primary: #2f7cf6;
        --dsw-alias-label-primary: #1b2a3a;
        --dsw-alias-label-secondary: #60758c;
        --dsw-alias-border-l1: rgba(35, 70, 105, .16);
        --dsw-alias-border-l2: rgba(35, 70, 105, .26);
        --dsw-alias-bg-layer-1: rgba(255, 255, 255, .54);
        --dsw-alias-bg-layer-2: rgba(43, 92, 145, .07);
        --dsw-alias-bg-overlay: rgba(255, 255, 255, .94);
        --dsw-alias-bg-base: #ffffff;
        --mub-auto-bg: linear-gradient(155deg, rgba(255, 253, 247, .97), rgba(235, 244, 255, .92));
        --mub-auto-border: rgba(47, 100, 160, .20);
        --mub-auto-shadow: 0 24px 60px rgba(30, 64, 110, .18), 0 2px 8px rgba(30, 64, 110, .10), inset 0 1px 0 rgba(255, 255, 255, .9);
        --mub-auto-texture: linear-gradient(118deg, rgba(255, 196, 120, .13), transparent 36%), radial-gradient(62% 46% at 100% 0%, rgba(100, 175, 255, .20), transparent 70%);
        --mub-auto-head: linear-gradient(180deg, rgba(255, 255, 255, .54), transparent);
        --mub-auto-rim: linear-gradient(90deg, transparent, rgba(255, 255, 255, .92), transparent);
        --mub-drift-color: rgba(47, 124, 246, .19);
        --mub-phase-accent: #2f7cf6;
      }
      .mub-style-auto.mub-phase-day {
        --mub-accent: #2f7cf6;
        --dsw-alias-brand-primary: #2f7cf6;
        --dsw-alias-label-primary: #1b2a3a;
        --dsw-alias-label-secondary: #60758c;
        --dsw-alias-border-l1: rgba(35, 70, 105, .16);
        --dsw-alias-border-l2: rgba(35, 70, 105, .26);
        --dsw-alias-bg-layer-1: rgba(255, 255, 255, .54);
        --dsw-alias-bg-layer-2: rgba(43, 92, 145, .07);
        --dsw-alias-bg-overlay: rgba(255, 255, 255, .94);
        --dsw-alias-bg-base: #ffffff;
        --mub-auto-bg: linear-gradient(155deg, rgba(255, 253, 247, .97), rgba(235, 244, 255, .92));
        --mub-auto-border: rgba(47, 100, 160, .20);
        --mub-auto-shadow: 0 24px 60px rgba(30, 64, 110, .18), 0 2px 8px rgba(30, 64, 110, .10), inset 0 1px 0 rgba(255, 255, 255, .9);
        --mub-auto-texture: linear-gradient(118deg, rgba(255, 196, 120, .13), transparent 36%), radial-gradient(62% 46% at 100% 0%, rgba(100, 175, 255, .20), transparent 70%);
        --mub-auto-head: linear-gradient(180deg, rgba(255, 255, 255, .54), transparent);
        --mub-auto-rim: linear-gradient(90deg, transparent, rgba(255, 255, 255, .92), transparent);
        --mub-drift-color: rgba(47, 124, 246, .19);
        --mub-phase-accent: #2f7cf6;
      }
      .mub-style-auto.mub-phase-afternoon {
        --mub-accent: #b06b24;
        --dsw-alias-brand-primary: #b06b24;
        --dsw-alias-label-primary: #2c2117;
        --dsw-alias-label-secondary: #7b6752;
        --dsw-alias-border-l1: rgba(120, 85, 45, .18);
        --dsw-alias-border-l2: rgba(120, 85, 45, .28);
        --dsw-alias-bg-layer-1: rgba(255, 255, 255, .50);
        --dsw-alias-bg-layer-2: rgba(160, 105, 40, .08);
        --dsw-alias-bg-overlay: rgba(255, 250, 242, .95);
        --dsw-alias-bg-base: #ffffff;
        --mub-auto-bg: linear-gradient(155deg, rgba(255, 250, 239, .97), rgba(255, 237, 212, .92));
        --mub-auto-border: rgba(150, 96, 38, .20);
        --mub-auto-shadow: 0 24px 60px rgba(90, 55, 10, .16), 0 2px 8px rgba(90, 55, 10, .08), inset 0 1px 0 rgba(255, 255, 255, .85);
        --mub-auto-texture: linear-gradient(118deg, rgba(255, 180, 90, .20), transparent 42%), radial-gradient(55% 42% at 100% 0%, rgba(255, 214, 150, .34), transparent 72%);
        --mub-auto-head: linear-gradient(180deg, rgba(255, 255, 255, .48), transparent);
        --mub-auto-rim: linear-gradient(90deg, transparent, rgba(255, 238, 206, .95), transparent);
        --mub-drift-color: rgba(176, 107, 36, .18);
        --mub-phase-accent: #b06b24;
      }
      .mub-style-auto.mub-phase-dusk {
        --mub-accent: #ff9d7a;
        --dsw-alias-brand-primary: #ff9d7a;
        --dsw-alias-label-primary: #fff3ef;
        --dsw-alias-label-secondary: #d6b6c2;
        --dsw-alias-border-l1: rgba(255, 170, 145, .20);
        --dsw-alias-border-l2: rgba(255, 170, 145, .30);
        --dsw-alias-bg-layer-1: rgba(255, 255, 255, .06);
        --dsw-alias-bg-layer-2: rgba(255, 170, 145, .09);
        --dsw-alias-bg-overlay: rgba(38, 18, 34, .96);
        --dsw-alias-bg-base: #1b0d16;
        --mub-auto-bg: radial-gradient(78% 58% at 92% 2%, rgba(255, 103, 118, .30), transparent 64%), radial-gradient(62% 52% at 4% 100%, rgba(107, 77, 218, .25), transparent 68%), linear-gradient(160deg, rgba(38, 18, 34, .96), rgba(18, 14, 34, .94));
        --mub-auto-border: rgba(255, 174, 150, .24);
        --mub-auto-shadow: 0 26px 64px rgba(20, 6, 24, .5), 0 2px 8px rgba(0, 0, 0, .30), inset 0 1px 0 rgba(255, 255, 255, .16);
        --mub-auto-texture: linear-gradient(180deg, rgba(255, 210, 160, .10), transparent 20%, transparent 82%, rgba(107, 77, 218, .08));
        --mub-auto-head: linear-gradient(180deg, rgba(255, 196, 170, .08), transparent);
        --mub-auto-rim: linear-gradient(90deg, transparent, rgba(255, 186, 150, .74), rgba(174, 146, 255, .48), transparent);
        --mub-drift-color: rgba(255, 170, 160, .22);
        --mub-phase-accent: #ffb49a;
      }
      .mub-style-auto.mub-phase-night {
        --mub-accent: #8ab4ff;
        --dsw-alias-brand-primary: #8ab4ff;
        --dsw-alias-label-primary: #eaf1ff;
        --dsw-alias-label-secondary: #9db1cc;
        --dsw-alias-border-l1: rgba(138, 180, 255, .16);
        --dsw-alias-border-l2: rgba(138, 180, 255, .25);
        --dsw-alias-bg-layer-1: rgba(255, 255, 255, .045);
        --dsw-alias-bg-layer-2: rgba(138, 180, 255, .08);
        --dsw-alias-bg-overlay: rgba(14, 23, 42, .96);
        --dsw-alias-bg-base: #07111f;
        --mub-auto-bg: radial-gradient(70% 52% at 100% 0%, rgba(104, 142, 255, .18), transparent 64%), linear-gradient(160deg, rgba(8, 16, 32, .97), rgba(3, 7, 15, .95));
        --mub-auto-border: rgba(138, 180, 255, .18);
        --mub-auto-shadow: 0 28px 66px rgba(0, 4, 14, .56), 0 2px 8px rgba(0, 0, 0, .3), inset 0 1px 0 rgba(255, 255, 255, .12);
        --mub-auto-texture: radial-gradient(1.2px 1.2px at 18% 22%, rgba(255, 255, 255, .48), transparent 100%), radial-gradient(1px 1px at 72% 16%, rgba(255, 255, 255, .32), transparent 100%), radial-gradient(1.4px 1.4px at 44% 32%, rgba(160, 196, 255, .38), transparent 100%), linear-gradient(180deg, rgba(138, 180, 255, .06), transparent 22%, transparent 86%, rgba(138, 180, 255, .05));
        --mub-auto-head: linear-gradient(180deg, rgba(138, 180, 255, .07), transparent);
        --mub-auto-rim: linear-gradient(90deg, transparent, rgba(170, 205, 255, .66), transparent);
        --mub-drift-color: rgba(150, 190, 255, .23);
        --mub-phase-accent: #a8c5ff;
      }
      .mub-style-auto.mub-phase-dawn {
        --mub-accent: #7de3d4;
        --dsw-alias-brand-primary: #7de3d4;
        --dsw-alias-label-primary: #e6fbf8;
        --dsw-alias-label-secondary: #8fa8ad;
        --dsw-alias-border-l1: rgba(125, 227, 212, .14);
        --dsw-alias-border-l2: rgba(125, 227, 212, .22);
        --dsw-alias-bg-layer-1: rgba(255, 255, 255, .035);
        --dsw-alias-bg-layer-2: rgba(125, 227, 212, .065);
        --dsw-alias-bg-overlay: rgba(8, 22, 28, .96);
        --dsw-alias-bg-base: #041014;
        --mub-auto-bg: radial-gradient(70% 46% at 0% 100%, rgba(56, 180, 172, .16), transparent 64%), radial-gradient(60% 44% at 100% 0%, rgba(72, 112, 190, .14), transparent 66%), linear-gradient(160deg, rgba(5, 17, 24, .97), rgba(2, 7, 11, .96));
        --mub-auto-border: rgba(125, 227, 212, .17);
        --mub-auto-shadow: 0 28px 66px rgba(0, 6, 10, .6), 0 2px 8px rgba(0, 0, 0, .32), inset 0 1px 0 rgba(255, 255, 255, .10);
        --mub-auto-texture: linear-gradient(180deg, rgba(125, 227, 212, .05), transparent 24%, transparent 78%, rgba(70, 180, 175, .09)), radial-gradient(1px 1px at 22% 18%, rgba(220, 255, 250, .35), transparent 100%), radial-gradient(1px 1px at 68% 28%, rgba(200, 240, 255, .25), transparent 100%);
        --mub-auto-head: linear-gradient(180deg, rgba(125, 227, 212, .055), transparent);
        --mub-auto-rim: linear-gradient(90deg, transparent, rgba(150, 245, 232, .58), transparent);
        --mub-drift-color: rgba(125, 227, 212, .20);
        --mub-phase-accent: #9af0e4;
      }
      .mub-style-auto .mub-panel { background: var(--mub-auto-bg); border-color: var(--mub-auto-border); box-shadow: var(--mub-auto-shadow); backdrop-filter: blur(30px) saturate(122%); }
      .mub-style-auto .mub-panel::before { background: var(--mub-auto-texture); opacity: 1; }
      .mub-style-auto .mub-panel::after { box-shadow: inset 0 1px 0 rgba(255,255,255,.4), inset 0 -1px 0 rgba(0,0,0,.12), inset 0 0 0 1px rgba(255,255,255,.05); }
      .mub-style-auto .mub-head { background: var(--mub-auto-head); }
      .mub-style-auto .mub-head::after { background: var(--mub-auto-rim); opacity: .8; }
      .mub-style-auto .mub-drift span { color: var(--mub-drift-color); text-shadow: none; }
      .mub-style-auto .mub-pill, .mub-style-auto .mub-launcher { background: var(--mub-auto-bg); border-color: var(--mub-auto-border); color: var(--dsw-alias-label-primary); box-shadow: var(--mub-auto-shadow); }
      .mub-style-auto .mub-tab.mub-active { background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent); border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent); box-shadow: none; }
      .mub-phase-word { color: var(--mub-phase-accent, var(--dsw-alias-brand-primary)); font-weight: 650; }
      .mub-scene { position: absolute; inset: 0; z-index: 0; overflow: hidden; border-radius: inherit; pointer-events: none; animation: mub-scene-in .9s ease; -webkit-mask-image: linear-gradient(#000 0%, #000 46%, transparent 68%); mask-image: linear-gradient(#000 0%, #000 46%, transparent 68%); }
      @keyframes mub-scene-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes mub-sun-breathe { from { transform: translate(-50%, -50%) scale(.985); } to { transform: translate(-49.5%, -50.8%) scale(1.025); } }
      @keyframes mub-moon-breathe { from { transform: translate(-50%, -50%) scale(.99); } to { transform: translate(-50.6%, -51.2%) scale(1.02); } }
      @keyframes mub-rays-turn { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes mub-light-shift { from { transform: translate3d(-1.2%, 0, 0) scale(1.01); } to { transform: translate3d(1.2%, .8%, 0) scale(1.03); } }
      @keyframes mub-haze-drift { from { transform: translate3d(-1.5%, 0, 0) scale(1.02); } to { transform: translate3d(1.5%, 1%, 0) scale(1.05); } }
      @keyframes mub-galaxy-drift { from { transform: rotate(-7deg) scale(1.02) translateX(-1.5%); } to { transform: rotate(-5deg) scale(1.05) translateX(1.5%); } }
      @keyframes mub-cloud-one { from { transform: translate3d(-3%, 0, 0) rotate(-10deg); } to { transform: translate3d(5%, 1%, 0) rotate(-7deg); } }
      @keyframes mub-cloud-two { from { transform: translate3d(3%, 0, 0) rotate(7deg); } to { transform: translate3d(-4%, 2%, 0) rotate(5deg); } }
      @keyframes mub-cloud-three { from { transform: translate3d(2%, 1%, 0) rotate(-5deg); } to { transform: translate3d(-3%, 0, 0) rotate(-3deg); } }
      @keyframes mub-cloud-four { from { transform: translate3d(-2%, 0, 0) rotate(6deg); } to { transform: translate3d(4%, 1%, 0) rotate(3deg); } }
      @keyframes mub-cloud-five { from { transform: translate3d(2%, 1%, 0) rotate(-6deg); } to { transform: translate3d(-4%, 0, 0) rotate(-4deg); } }
      @keyframes mub-meteor { 0%, 79% { opacity: 0; transform: translate3d(0, 0, 0) rotate(26deg); } 81% { opacity: var(--scene-meteor-opacity, .8); } 88% { opacity: calc(var(--scene-meteor-opacity, .8) * .35); transform: translate3d(-185px, 84px, 0) rotate(26deg); } 93%, 100% { opacity: 0; transform: translate3d(-235px, 108px, 0) rotate(26deg); } }
      @keyframes mub-cloud-texture-a { from { transform: translate3d(-1.5%, 0, 0) scale(1.01); } to { transform: translate3d(1.5%, 1%, 0) scale(1.04); } }
      @keyframes mub-cloud-texture-b { from { transform: translate3d(1%, .5%, 0) scale(1.02); } to { transform: translate3d(-1%, 0, 0) scale(1.05); } }
      @keyframes mub-grain-jitter { 0% { transform: translate3d(0, 0, 0); } 33% { transform: translate3d(-1.5%, 1%, 0); } 66% { transform: translate3d(1%, -1.5%, 0); } 100% { transform: translate3d(0, 0, 0); } }
      @keyframes mub-stars-breathe { from { filter: brightness(.82); } to { filter: brightness(1.18); } }
      @keyframes mub-horizon-breathe { from { opacity: calc(var(--scene-horizon-opacity, .5) * .82); } to { opacity: var(--scene-horizon-opacity, .5); } }
      .mub-scene::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 0%, var(--scene-veil, transparent) 34%, transparent 72%); }
      .mub-scene i { position: absolute; display: block; }
      .mub-scene-sun, .mub-scene-moon { transition: left 2.5s linear, top 2.5s linear; }
      .mub-scene { background: var(--scene-sky, transparent); }
      .mub-scene-sun { left: var(--scene-sun-x, 78%); top: var(--scene-sun-y, 10%); width: var(--scene-sun-size, 110px); height: var(--scene-sun-size, 110px); transform: translate(-50%, -50%); border-radius: 50%; background: url('/dsh-usage/api/space/sun3d.webp') center / contain no-repeat; box-shadow: 0 0 var(--scene-glow-size, 120px) var(--scene-glow, rgba(255,210,130,.35)); opacity: var(--scene-sun-opacity, 1); filter: saturate(1.06) contrast(1.04); mix-blend-mode: normal; animation: mub-sun-breathe 18s ease-in-out infinite alternate; }
      .mub-scene-sun::before { content: ''; position: absolute; inset: 12%; border-radius: 50%; background: radial-gradient(circle at 42% 38%, rgba(255,255,255,.98) 0%, rgba(255,250,232,.9) 24%, rgba(255,226,170,.45) 48%, transparent 68%); mix-blend-mode: screen; filter: blur(3px); opacity: var(--scene-sun-core-opacity, .2); pointer-events: none; }
      .mub-scene-sun::after { content: ''; position: absolute; inset: -14%; border-radius: 50%; background: radial-gradient(circle, transparent 47%, var(--scene-glow, rgba(255,210,130,.35)) 56%, transparent 72%); filter: blur(11px); mix-blend-mode: screen; pointer-events: none; }
      .mub-style-auto.mub-phase-day .mub-scene-sun { filter: blur(1.1px) brightness(1.04) saturate(.86) contrast(.96); }
      .mub-style-auto.mub-phase-afternoon .mub-scene-sun { filter: blur(.65px) brightness(1.02) saturate(1.0) contrast(1.0); }
      .mub-style-auto.mub-phase-dusk .mub-scene-sun { filter: blur(1.15px) brightness(1.02) saturate(1.04) contrast(1.02); }
      .mub-scene-rays { inset: -12%; opacity: var(--scene-rays-opacity, .2); background: conic-gradient(from 205deg at var(--scene-sun-x, 78%) var(--scene-sun-y, 10%), transparent 0deg, var(--scene-ray, rgba(255,230,170,.25)) 7deg, transparent 18deg, var(--scene-ray, rgba(255,230,170,.25)) 27deg, transparent 38deg, var(--scene-ray, rgba(255,230,170,.25)) 46deg, transparent 58deg, var(--scene-ray, rgba(255,230,170,.25)) 66deg, transparent 80deg); filter: blur(10px); mix-blend-mode: screen; animation: mub-rays-turn 180s linear infinite; }
      .mub-scene-light { inset: 0; opacity: var(--scene-light-opacity, .28); background: linear-gradient(122deg, rgba(255,255,255,.20) 0%, rgba(255,245,220,.08) 18%, transparent 38%, transparent 68%, rgba(255,255,255,.06) 86%, transparent 100%); mix-blend-mode: screen; animation: mub-light-shift 34s ease-in-out infinite alternate; }
      .mub-scene-moon { left: var(--scene-moon-x, 80%); top: var(--scene-moon-y, 15%); width: var(--scene-moon-size, 54px); height: var(--scene-moon-size, 54px); transform: translate(-50%, -50%); border-radius: 50%; background: url('/dsh-usage/api/space/moon3d.webp') center / contain no-repeat; opacity: var(--scene-moon-opacity, 0); filter: blur(.25px) brightness(1.08) contrast(1.05) drop-shadow(0 0 9px var(--scene-moon-glow, rgba(165,195,255,.3))); mix-blend-mode: normal; animation: mub-moon-breathe 22s ease-in-out infinite alternate; }
      .mub-scene-moon::after { content: ''; position: absolute; inset: 3%; border-radius: 50%; background: radial-gradient(circle, transparent 54%, var(--scene-moon-glow, rgba(165,195,255,.3)) 70%, transparent 86%); mix-blend-mode: screen; filter: blur(4px); pointer-events: none; }
      .mub-scene-stars { inset: 0; opacity: var(--scene-stars-opacity, 0); background-image: radial-gradient(1.6px 1.6px at 12% 18%, rgba(255,255,255,1), transparent 100%), radial-gradient(1.3px 1.3px at 24% 34%, rgba(220,238,255,.92), transparent 100%), radial-gradient(2px 2px at 36% 12%, rgba(255,255,255,.96), transparent 100%), radial-gradient(1.4px 1.4px at 48% 29%, rgba(205,228,255,.82), transparent 100%), radial-gradient(1.8px 1.8px at 58% 16%, rgba(255,255,255,.94), transparent 100%), radial-gradient(1.3px 1.3px at 68% 36%, rgba(225,240,255,.78), transparent 100%), radial-gradient(2px 2px at 77% 21%, rgba(255,255,255,.96), transparent 100%), radial-gradient(1.4px 1.4px at 86% 31%, rgba(210,230,255,.8), transparent 100%), radial-gradient(1.6px 1.6px at 92% 12%, rgba(255,255,255,.86), transparent 100%), radial-gradient(1.3px 1.3px at 8% 42%, rgba(205,230,255,.72), transparent 100%), radial-gradient(1.8px 1.8px at 43% 42%, rgba(255,255,255,.78), transparent 100%), radial-gradient(1.4px 1.4px at 64% 44%, rgba(205,230,255,.68), transparent 100%), radial-gradient(1.2px 1.2px at 18% 52%, rgba(255,255,255,.62), transparent 100%), radial-gradient(1.5px 1.5px at 72% 52%, rgba(210,235,255,.55), transparent 100%), radial-gradient(1.2px 1.2px at 51% 58%, rgba(255,255,255,.5), transparent 100%); background-repeat: no-repeat; animation: mub-stars-breathe 11s ease-in-out infinite alternate; }
      .mub-scene-meteor { left: var(--meteor-x, 68%); top: var(--meteor-y, 22%); width: var(--meteor-len, 132px); height: 1.5px; border-radius: 2px; background: linear-gradient(90deg, transparent 0%, rgba(220,236,255,.2) 18%, rgba(255,255,255,.95) 56%, rgba(255,255,255,1) 64%, rgba(190,215,255,.25) 82%, transparent 100%); transform-origin: 100% 50%; transform: rotate(26deg); opacity: 0; filter: drop-shadow(0 0 4px rgba(175,205,255,.8)); animation: mub-meteor 9s ease-in infinite; }
      .mub-meteor-one { --meteor-x: 72%; --meteor-y: 20%; --meteor-len: 148px; animation-delay: 1.4s; animation-duration: 9s; }
      .mub-meteor-two { --meteor-x: 28%; --meteor-y: 32%; --meteor-len: 92px; animation-delay: 4.8s; animation-duration: 12s; opacity: 0; }
      .mub-meteor-three { --meteor-x: 86%; --meteor-y: 38%; --meteor-len: 116px; animation-delay: 7.2s; animation-duration: 14s; }
      .mub-meteor-four { --meteor-x: 46%; --meteor-y: 15%; --meteor-len: 76px; animation-delay: 10.5s; animation-duration: 16s; opacity: 0; }
      .mub-scene-galaxy { left: -16%; top: 5%; width: 132%; height: 238px; transform: rotate(-7deg); border-radius: 42%; background: url('/dsh-usage/api/space/galaxy.webp') center / cover no-repeat; mix-blend-mode: screen; filter: saturate(.9) contrast(1.02) brightness(.86); -webkit-mask-image: radial-gradient(ellipse 62% 88% at 50% 50%, #000 32%, transparent 78%); mask-image: radial-gradient(ellipse 62% 88% at 50% 50%, #000 32%, transparent 78%); opacity: var(--scene-galaxy-opacity, 0); animation: mub-galaxy-drift 120s ease-in-out infinite alternate; }
      .mub-scene-cloud { border-radius: 46%; filter: blur(9px); opacity: calc(var(--scene-cloud-opacity, 0) * .64); mix-blend-mode: var(--scene-cloud-blend, normal); background:
        radial-gradient(ellipse 46% 72% at 15% 62%, var(--scene-cloud-tint, rgba(255,255,255,.8)) 0%, transparent 72%),
        radial-gradient(ellipse 38% 64% at 37% 44%, var(--scene-cloud-tint, rgba(255,255,255,.8)) 0%, transparent 70%),
        radial-gradient(ellipse 52% 78% at 63% 58%, var(--scene-cloud-tint, rgba(255,255,255,.8)) 0%, transparent 74%),
        radial-gradient(ellipse 30% 54% at 86% 47%, var(--scene-cloud-tint, rgba(255,255,255,.8)) 0%, transparent 68%); }
      .mub-cloud-one { left: -24%; top: 13%; width: 370px; height: 78px; transform: rotate(-7deg); animation: mub-cloud-one 56s ease-in-out infinite alternate; }
      .mub-cloud-two { right: -28%; top: 26%; width: 420px; height: 86px; transform: rotate(5deg); background:
        radial-gradient(ellipse 48% 70% at 16% 56%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 72%),
        radial-gradient(ellipse 40% 76% at 42% 50%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 70%),
        radial-gradient(ellipse 54% 82% at 70% 60%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 74%),
        radial-gradient(ellipse 32% 58% at 91% 44%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 68%); animation: mub-cloud-two 74s ease-in-out infinite alternate; }
      .mub-cloud-three { left: 2%; top: 39%; width: 310px; height: 66px; transform: rotate(-3deg); background:
        radial-gradient(ellipse 50% 72% at 20% 54%, var(--scene-cloud-tint-3, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 72%),
        radial-gradient(ellipse 42% 68% at 48% 62%, var(--scene-cloud-tint-3, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 70%),
        radial-gradient(ellipse 34% 58% at 82% 46%, var(--scene-cloud-tint-3, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 68%); opacity: calc(var(--scene-cloud-opacity, 0) * .48); animation: mub-cloud-three 43s ease-in-out infinite alternate; }
      .mub-cloud-four { right: -12%; top: 51%; width: 340px; height: 62px; transform: rotate(4deg); background:
        radial-gradient(ellipse 46% 70% at 18% 58%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 72%),
        radial-gradient(ellipse 36% 64% at 54% 48%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 70%),
        radial-gradient(ellipse 30% 54% at 84% 60%, var(--scene-cloud-tint-2, var(--scene-cloud-tint, rgba(255,255,255,.8))) 0%, transparent 68%); opacity: calc(var(--scene-cloud-opacity, 0) * .36); animation: mub-cloud-four 67s ease-in-out infinite alternate; }
      .mub-cloud-five { left: -30%; top: 60%; width: 400px; height: 72px; transform: rotate(-5deg); opacity: calc(var(--scene-cloud-opacity, 0) * .26); animation: mub-cloud-five 82s ease-in-out infinite alternate; }
      .mub-cloud-texture { left: -12%; width: 124%; height: 96px; background: var(--scene-cloud-tint, rgba(255,255,255,.8)); -webkit-mask-image: url('/dsh-usage/api/space/clouds.webp'); mask-image: url('/dsh-usage/api/space/clouds.webp'); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; filter: blur(12px); opacity: calc(var(--scene-cloud-opacity, 0) * .24); mix-blend-mode: screen; }
      .mub-cloud-texture-a { top: 21%; animation: mub-cloud-texture-a 96s ease-in-out infinite alternate; }
      .mub-cloud-texture-b { top: 43%; height: 82px; opacity: calc(var(--scene-cloud-opacity, 0) * .16); animation: mub-cloud-texture-b 128s ease-in-out infinite alternate; }
      /* Blender-rendered 3D cloud banks replace the flat gradient puffs. */
      .mub-scene-cloud { background: url('/dsh-usage/api/space/cloud3d.webp') center / cover no-repeat; filter: var(--scene-cloud-filter, none) blur(1.2px); mix-blend-mode: var(--scene-cloud-blend, normal); }
      .mub-cloud-one { left: -25%; top: 12%; width: 390px; height: 104px; transform: rotate(-5deg); opacity: calc(var(--scene-cloud-opacity, 0) * .62); }
      .mub-cloud-two { right: -31%; top: 25%; width: 440px; height: 116px; transform: rotate(4deg); background-image: url('/dsh-usage/api/space/cloud3d-far.webp'); opacity: calc(var(--scene-cloud-opacity, 0) * .42); }
      .mub-cloud-three { left: 0%; top: 38%; width: 340px; height: 92px; transform: rotate(-2deg); background-image: url('/dsh-usage/api/space/cloud3d.webp'); opacity: calc(var(--scene-cloud-opacity, 0) * .48); }
      .mub-cloud-four { right: -18%; top: 51%; width: 360px; height: 98px; transform: rotate(3deg); background-image: url('/dsh-usage/api/space/cloud3d-far.webp'); opacity: calc(var(--scene-cloud-opacity, 0) * .3); }
      .mub-cloud-five { left: -35%; top: 60%; width: 430px; height: 112px; transform: rotate(-4deg); opacity: calc(var(--scene-cloud-opacity, 0) * .22); }
      .mub-scene-cloud-texture { display: none !important; }
      .mub-scene-horizon { left: 2%; right: 2%; top: 45%; height: 118px; background: linear-gradient(90deg, transparent, var(--scene-horizon, rgba(255,255,255,.2)), transparent); filter: blur(22px); opacity: var(--scene-horizon-opacity, .5); animation: mub-horizon-breathe 18s ease-in-out infinite alternate; }
      .mub-style-auto.mub-phase-day { --scene-sun-x: 84%; --scene-sun-y: 28%; --scene-sun-size: 84px; --scene-sun-core: #ffe8ad; --scene-sun-core-opacity: .82; --scene-glow: rgba(255,210,130,.52); --scene-glow-size: 120px; --scene-rays-opacity: .26; --scene-light-opacity: .32; --scene-ray: rgba(255,232,180,.4); --scene-moon-opacity: 0; --scene-stars-opacity: 0; --scene-galaxy-opacity: 0; --scene-cloud-opacity: .42; --scene-cloud-color: linear-gradient(90deg, transparent, rgba(165,205,255,.7), transparent); --scene-cloud-color-2: linear-gradient(90deg, transparent, rgba(255,238,215,.85), transparent); --scene-cloud-color-3: linear-gradient(90deg, transparent, rgba(255,246,225,.65), transparent); --scene-horizon: rgba(255,232,185,.64); --scene-horizon-opacity: .58; --scene-veil: rgba(255,255,255,.14); --scene-haze: rgba(255,225,170,.3); --scene-haze-x: 78%; --scene-haze-y: 24%; --scene-cloud-tint: rgba(255,255,255,.94); --scene-cloud-tint-2: rgba(216,232,250,.86); --scene-cloud-tint-3: rgba(255,242,218,.82); --scene-cloud-blend: normal; --scene-cloud-filter: brightness(1.08) saturate(.62) contrast(.94); --scene-vignette: .06; --scene-meteor-opacity: 0; --scene-sky: linear-gradient(180deg, rgba(120,180,245,.24), rgba(210,232,255,.10) 48%, transparent 72%); }
      .mub-style-auto.mub-phase-afternoon { --scene-sun-x: 84%; --scene-sun-y: 36%; --scene-sun-size: 104px; --scene-sun-core: #ffd08a; --scene-sun-core-opacity: .46; --scene-glow: rgba(255,146,58,.62); --scene-glow-size: 150px; --scene-rays-opacity: .4; --scene-light-opacity: .42; --scene-ray: rgba(255,190,110,.48); --scene-moon-opacity: 0; --scene-stars-opacity: 0; --scene-galaxy-opacity: 0; --scene-cloud-opacity: .60; --scene-cloud-color: linear-gradient(90deg, transparent, rgba(255,220,170,.9), transparent); --scene-cloud-color-2: linear-gradient(90deg, transparent, rgba(255,170,95,.68), transparent); --scene-cloud-color-3: linear-gradient(90deg, transparent, rgba(255,145,75,.6), transparent); --scene-horizon: rgba(255,174,95,.76); --scene-horizon-opacity: .66; --scene-veil: rgba(255,239,210,.12); --scene-haze: rgba(255,180,110,.34); --scene-haze-x: 76%; --scene-haze-y: 32%; --scene-cloud-tint: rgba(255,238,208,.95); --scene-cloud-tint-2: rgba(255,196,150,.86); --scene-cloud-tint-3: rgba(255,172,118,.8); --scene-cloud-blend: normal; --scene-cloud-filter: sepia(.25) saturate(1.2) hue-rotate(-8deg) brightness(1.02); --scene-vignette: .08; --scene-meteor-opacity: 0; --scene-sky: linear-gradient(180deg, rgba(255,214,160,.20), rgba(255,235,210,.08) 52%, transparent 74%); }
      .mub-style-auto.mub-phase-dusk { --scene-sun-x: 68%; --scene-sun-y: 50%; --scene-sun-size: 132px; --scene-sun-core: #ffb36b; --scene-sun-core-opacity: .12; --scene-glow: rgba(255,78,68,.72); --scene-glow-size: 190px; --scene-rays-opacity: .6; --scene-light-opacity: .18; --scene-ray: rgba(255,130,90,.58); --scene-moon-opacity: .05; --scene-moon-x: 86%; --scene-moon-y: 22%; --scene-stars-opacity: .18; --scene-galaxy-opacity: .06; --scene-cloud-opacity: .72; --scene-cloud-color: linear-gradient(90deg, transparent, rgba(255,68,48,.92), rgba(255,155,72,.72), transparent); --scene-cloud-color-2: linear-gradient(90deg, transparent, rgba(255,78,112,.78), rgba(132,72,225,.58), transparent); --scene-cloud-color-3: linear-gradient(90deg, transparent, rgba(255,54,58,.8), transparent); --scene-horizon: rgba(255,110,72,.95); --scene-horizon-opacity: .9; --scene-veil: rgba(40,12,34,.08); --scene-haze: rgba(255,100,68,.42); --scene-haze-x: 62%; --scene-haze-y: 44%; --scene-cloud-tint: rgba(255,132,92,.96); --scene-cloud-tint-2: rgba(216,105,166,.86); --scene-cloud-tint-3: rgba(255,90,80,.9); --scene-cloud-blend: screen; --scene-cloud-filter: sepia(.8) saturate(2.4) hue-rotate(-18deg) brightness(.82); --scene-vignette: .26; --scene-meteor-opacity: .08; }
      .mub-style-auto.mub-phase-night { --scene-sun-opacity: 0; --scene-rays-opacity: 0; --scene-light-opacity: .04; --scene-moon-opacity: 0; --scene-moon-x: 83%; --scene-moon-y: 28%; --scene-moon-size: 54px; --scene-moon-glow: rgba(158,190,255,.5); --scene-stars-opacity: .82; --scene-galaxy-opacity: .46; --scene-meteor-opacity: .58; --scene-cloud-opacity: .08; --scene-cloud-color: linear-gradient(90deg, transparent, rgba(47,78,125,.55), transparent); --scene-cloud-color-2: linear-gradient(90deg, transparent, rgba(72,102,160,.36), transparent); --scene-cloud-color-3: linear-gradient(90deg, transparent, rgba(35,60,105,.4), transparent); --scene-horizon: rgba(96,144,235,.6); --scene-horizon-opacity: .58; --scene-veil: rgba(4,9,18,.02); --scene-haze: rgba(92,138,228,.24); --scene-haze-x: 82%; --scene-haze-y: 28%; --scene-cloud-tint: rgba(55,80,130,.58); --scene-cloud-tint-2: rgba(38,60,100,.46); --scene-cloud-tint-3: rgba(44,70,116,.5); --scene-cloud-blend: screen; --scene-cloud-filter: sepia(.55) saturate(.6) hue-rotate(180deg) brightness(.35); --scene-vignette: .32; }
      .mub-style-auto.mub-phase-dawn { --scene-sun-opacity: 0; --scene-rays-opacity: 0; --scene-light-opacity: .04; --scene-moon-opacity: 0; --scene-moon-x: 86%; --scene-moon-y: 24%; --scene-moon-size: 40px; --scene-moon-glow: rgba(150,190,255,.18); --scene-stars-opacity: .42; --scene-galaxy-opacity: .24; --scene-cloud-opacity: .40; --scene-cloud-color: linear-gradient(90deg, transparent, rgba(255,150,165,.72), transparent); --scene-cloud-color-2: linear-gradient(90deg, transparent, rgba(95,215,205,.62), transparent); --scene-cloud-color-3: linear-gradient(90deg, transparent, rgba(255,135,155,.55), transparent); --scene-horizon: rgba(94,228,214,.86); --scene-horizon-opacity: .82; --scene-veil: rgba(3,12,18,.05); --scene-haze: rgba(78,218,206,.26); --scene-haze-x: 24%; --scene-haze-y: 62%; --scene-cloud-tint: rgba(255,170,190,.76); --scene-cloud-tint-2: rgba(90,200,205,.66); --scene-cloud-tint-3: rgba(255,145,165,.6); --scene-cloud-blend: screen; --scene-cloud-filter: sepia(.55) saturate(1.4) hue-rotate(-8deg) brightness(.72); --scene-vignette: .28; --scene-meteor-opacity: .30; }
      .mub-scene-haze { inset: -20%; background: radial-gradient(62% 52% at var(--scene-haze-x, 72%) var(--scene-haze-y, 26%), var(--scene-haze, rgba(255,210,150,.25)), transparent 72%); filter: blur(24px); mix-blend-mode: screen; opacity: .72; animation: mub-haze-drift 32s ease-in-out infinite alternate; }
      .mub-scene-vignette { inset: 0; background: radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(0,0,0,.9) 100%); opacity: var(--scene-vignette, .18); mix-blend-mode: multiply; }
      .mub-scene-grain { inset: 0; background-image: url('/dsh-usage/api/space/grain.webp'); background-size: 128px 128px; opacity: .055; mix-blend-mode: overlay; animation: mub-grain-jitter 1.4s steps(3) infinite; }

      /* ---- Redesigned Cyber: cockpit obsidian, no neon grid ---- */
      .mub-style-cyber { --mub-accent: #7ddcff; --dsw-alias-brand-primary: #7ddcff; --dsw-alias-label-primary: #e9f6ff; --dsw-alias-label-secondary: #8da5b8; --dsw-alias-border-l1: rgba(125, 220, 255, .13); --dsw-alias-border-l2: rgba(125, 220, 255, .22); --dsw-alias-bg-layer-1: rgba(255, 255, 255, .04); --dsw-alias-bg-layer-2: rgba(125, 220, 255, .07); --dsw-alias-bg-overlay: rgba(8, 15, 26, .96); --dsw-alias-bg-base: #060c16; }
      .mub-style-cyber .mub-panel { background: radial-gradient(80% 46% at 16% 0%, rgba(48, 92, 150, .20), transparent 68%), linear-gradient(165deg, rgba(7, 12, 22, .96), rgba(3, 6, 12, .93)); border-color: rgba(125, 220, 255, .19); box-shadow: 0 26px 62px rgba(0, 4, 12, .55), 0 0 0 1px rgba(125, 220, 255, .04), inset 0 1px 0 rgba(255, 255, 255, .12); backdrop-filter: blur(28px) saturate(118%); }
      .mub-style-cyber .mub-panel::before { background-image: radial-gradient(1.2px 1.2px at 16% 16%, rgba(255, 255, 255, .48), transparent 100%), radial-gradient(1px 1px at 72% 25%, rgba(255, 255, 255, .30), transparent 100%), radial-gradient(1.4px 1.4px at 46% 9%, rgba(125, 220, 255, .42), transparent 100%), linear-gradient(180deg, rgba(125, 220, 255, .07), transparent 18%, transparent 84%, rgba(125, 220, 255, .04)); background-size: 100% 100%; background-repeat: no-repeat; }
      .mub-style-cyber .mub-panel::after { box-shadow: inset 0 1px 0 rgba(170, 235, 255, .20), inset 0 0 0 1px rgba(125, 220, 255, .04), inset 0 -1px 0 rgba(0, 0, 0, .5); }
      .mub-style-cyber .mub-head { background: linear-gradient(180deg, rgba(125, 220, 255, .055), transparent); }
      .mub-style-cyber .mub-head::after { background: linear-gradient(90deg, transparent, rgba(125, 220, 255, .72), rgba(143, 125, 255, .35), transparent); opacity: .6; }
      .mub-style-cyber .mub-tab.mub-active { background: rgba(125, 220, 255, .09); color: #f2fbff; border: 1px solid rgba(125, 220, 255, .16); box-shadow: none; }
      .mub-style-cyber .mub-model { border-color: rgba(125, 220, 255, .09); }
      .mub-style-cyber .mub-drift { display: none; }
      .mub-style-cyber .mub-pill, .mub-style-cyber .mub-launcher { background: linear-gradient(145deg, rgba(8, 17, 29, .97), rgba(3, 8, 14, .95)); border-color: rgba(125, 220, 255, .22); }

      /* ---- Redesigned Matrix: brushed jade terminal, not neon green ---- */
      .mub-style-matrix { --mub-accent: #7fe3b0; --dsw-alias-brand-primary: #7fe3b0; --dsw-alias-label-primary: #e7f4ed; --dsw-alias-label-secondary: #93aa9f; --dsw-alias-border-l1: rgba(127, 227, 176, .13); --dsw-alias-border-l2: rgba(127, 227, 176, .22); --dsw-alias-bg-layer-1: rgba(255, 255, 255, .035); --dsw-alias-bg-layer-2: rgba(127, 227, 176, .065); --dsw-alias-bg-overlay: rgba(8, 18, 15, .96); --dsw-alias-bg-base: #040c08; }
      .mub-style-matrix .mub-panel { background: radial-gradient(72% 48% at 100% 0%, rgba(42, 92, 70, .20), transparent 66%), linear-gradient(165deg, rgba(8, 17, 14, .96), rgba(3, 8, 6, .94)); border-color: rgba(127, 227, 176, .18); box-shadow: 0 26px 62px rgba(0, 8, 4, .58), 0 0 0 1px rgba(127, 227, 176, .04), inset 0 1px 0 rgba(255, 255, 255, .10); font-family: inherit; }
      .mub-style-matrix .mub-panel::before { background-image: radial-gradient(rgba(127, 227, 176, .10) 1px, transparent 1px), linear-gradient(180deg, rgba(127, 227, 176, .05), transparent 24%, transparent 80%, rgba(127, 227, 176, .04)); background-size: 14px 14px, 100% 100%; }
      .mub-style-matrix .mub-panel::after { box-shadow: inset 0 1px 0 rgba(180, 255, 220, .16), inset 0 0 0 1px rgba(127, 227, 176, .04), inset 0 -1px 0 rgba(0, 0, 0, .48); }
      .mub-style-matrix .mub-head { background: linear-gradient(180deg, rgba(127, 227, 176, .045), transparent); }
      .mub-style-matrix .mub-head::after { background: linear-gradient(90deg, transparent, rgba(127, 227, 176, .62), transparent); opacity: .55; }
      .mub-style-matrix .mub-tab.mub-active { background: rgba(127, 227, 176, .09); color: #f1fff8; border: 1px solid rgba(127, 227, 176, .15); box-shadow: none; }
      .mub-style-matrix .mub-model { border-color: rgba(127, 227, 176, .09); }
      .mub-style-matrix .mub-drift { display: none; }
      .mub-style-matrix .mub-hero-cost, .mub-style-matrix .mub-model-cost, .mub-style-matrix .mub-model-tokens, .mub-style-matrix .mub-pill-cost { font-family: "Cascadia Code", "Consolas", monospace; font-variant-numeric: tabular-nums; }
      .mub-style-matrix .mub-pill, .mub-style-matrix .mub-launcher { background: linear-gradient(145deg, rgba(8, 20, 15, .97), rgba(3, 9, 6, .95)); border-color: rgba(127, 227, 176, .20); }

      .mub-head { display: flex; align-items: center; gap: 8px; padding: 9px 10px 8px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); cursor: grab; touch-action: none; user-select: none; flex: none; }
      .mub-head:active, .mub-head.mub-dragging { cursor: grabbing; }
      .mub-brand { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex: none; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); color: var(--dsw-alias-brand-primary); }
      .mub-brand svg { width: 17px; height: 17px; display: block; }
      .mub-headtext { min-width: 0; flex: 1; }
      .mub-title { font-size: 13px; font-weight: 650; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-sub { color: var(--dsw-alias-label-secondary); font-size: 10px; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; }
      .mub-live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--dsw-alias-state-success-primary); display: inline-block; box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-success-primary) 22%, transparent); flex: none; }
      .mub-live-dot.mub-offline { background: var(--dsw-alias-state-idle-primary); box-shadow: none; }
      .mub-headactions { display: flex; align-items: center; gap: 2px; flex: none; }
      .mub-iconbtn { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); width: 27px; height: 27px; border-radius: 7px; display: grid; place-items: center; cursor: pointer; flex: none; font: inherit; }
      .mub-iconbtn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .mub-iconbtn:focus-visible, .mub-btn:focus-visible, .mub-tab:focus-visible, .mub-input:focus-visible, .mub-select:focus-visible, .mub-linkbtn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .mub-iconbtn svg { width: 15px; height: 15px; display: block; }
      .mub-toolbar { display: flex; align-items: center; gap: 6px; padding: 8px 10px 6px; flex: none; }
      .mub-tabs { display: flex; gap: 1px; background: var(--dsw-alias-bg-layer-2); border-radius: 8px; padding: 2px; flex: 1; min-width: 0; }
      .mub-tab { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11px; padding: 4px 0; border-radius: 6px; cursor: pointer; flex: 1; min-width: 0; white-space: nowrap; }
      .mub-tab:hover { color: var(--dsw-alias-label-primary); }
      .mub-tab.mub-active { background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); box-shadow: 0 1px 3px color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent); font-weight: 600; }
      .mub-nav { display: flex; align-items: center; gap: 1px; flex: none; }
      .mub-nav .mub-iconbtn { width: 24px; height: 24px; }
      .mub-today { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 10px; height: 24px; padding: 0 5px; border-radius: 6px; cursor: pointer; white-space: nowrap; flex: none; }
      .mub-today:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .mub-subbar { display: flex; align-items: center; gap: 6px; padding: 0 12px 8px; color: var(--dsw-alias-label-secondary); font-size: 10px; flex: none; }
      .mub-range { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-currency { display: flex; gap: 1px; background: var(--dsw-alias-bg-layer-2); border-radius: 6px; padding: 1px; }
      .mub-curbtn { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 10px; padding: 2px 6px; border-radius: 5px; cursor: pointer; }
      .mub-curbtn.mub-active { background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); font-weight: 600; }
      .mub-scroll { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--dsw-alias-border-l2) transparent; }
      .mub-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .mub-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2); border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
      .mub-hero { padding: 10px 14px 4px; }
      .mub-hero-label { color: var(--dsw-alias-label-secondary); font-size: 10px; display: flex; align-items: center; gap: 6px; }
      .mub-hero-cost { font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1.15; margin-top: 1px; font-variant-numeric: tabular-nums; }
      .mub-hero-alt { display: flex; align-items: center; gap: 5px; color: var(--dsw-alias-label-secondary); font-size: 10px; margin-top: 1px; font-variant-numeric: tabular-nums; }
      .mub-actual-line { display: inline-flex; align-items: baseline; flex-wrap: wrap; gap: 3px 5px; margin-top: 2px; color: var(--dsw-alias-label-secondary); font-size: 10px; font-variant-numeric: tabular-nums; }
      .mub-actual-label { color: var(--dsw-alias-label-secondary); font-weight: 500; }
      .mub-actual-line b { color: var(--dsw-alias-label-primary); font-size: 11.5px; font-weight: 650; }
      .mub-actual-sep { opacity: .45; }
      .mub-hero-alt .mub-badge { font-size: 10px; }
      .mub-hero-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; color: var(--dsw-alias-label-secondary); font-size: 10px; margin-top: 2px; }
      .mub-hero-meta b { color: var(--dsw-alias-label-primary); font-weight: 600; font-variant-numeric: tabular-nums; }
      .mub-note { color: var(--dsw-alias-state-warn-primary); font-size: 10px; margin-top: 4px; }
      .mub-chart { padding: 8px 14px 8px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
      .mub-chart-head { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 10px; }
      .mub-chart-readout { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-legend { display: flex; gap: 8px; align-items: center; flex: none; }
      .mub-legend i { width: 6px; height: 6px; border-radius: 2px; display: inline-block; margin-right: 3px; vertical-align: 1px; }
      .mub-legend .mub-linekey { width: 10px; height: 0; border-top: 1.5px solid var(--dsw-alias-brand-primary); border-radius: 0; }
      .mub-plot { position: relative; height: 104px; margin-top: 7px; }
      .mub-bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 2px; }
      .mub-bar-slot { flex: 1; height: 100%; display: flex; align-items: flex-end; position: relative; min-width: 0; cursor: default; }
      .mub-bar { width: 100%; border-radius: 2px 2px 0 0; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, transparent); min-height: 0; transition: background .12s; }
      .mub-bar-slot:hover .mub-bar { background: var(--dsw-alias-brand-primary); }
      .mub-line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
      .mub-axis { position: relative; height: 12px; margin-top: 3px; }
      .mub-axis-label { position: absolute; top: 0; transform: translateX(-50%); color: var(--dsw-alias-label-secondary); font-size: 9px; white-space: nowrap; }
      .mub-empty { padding: 22px 16px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .mub-empty b { display: block; color: var(--dsw-alias-label-primary); font-size: 12px; margin-bottom: 3px; }
      .mub-section-title { display: flex; align-items: center; gap: 6px; padding: 10px 14px 6px; color: var(--dsw-alias-label-secondary); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
      .mub-section-title span { flex: 1; }
      .mub-models { padding: 0 14px 16px; }
      .mub-model { border-top: 1px solid var(--dsw-alias-border-l1); padding: 8px 0 7px; }
      .mub-model:first-child { border-top: 0; }
      .mub-model-row { display: flex; align-items: center; gap: 8px; cursor: pointer; border-radius: 7px; transition: background .12s; }
      .mub-model-row:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent); }
      .mub-model-row:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
      .mub-model-main { min-width: 0; flex: 1; }
      .mub-model-name { display: flex; align-items: center; gap: 5px; min-width: 0; }
      .mub-color { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--mub-model-color, var(--dsw-alias-brand-primary)); }
      .mub-vendor { display: inline-grid; place-items: center; border-radius: 6px; flex: none; overflow: hidden; background: color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent); box-shadow: inset 0 1px 0 rgba(255,255,255,.24), inset 0 -1px 0 rgba(0,0,0,.18), 0 1px 3px rgba(0,0,0,.22); }
      .mub-vendor img { width: 100%; height: 100%; object-fit: contain; display: block; }
      .mub-vendor-mono { color: #fff; font-weight: 750; line-height: 1; letter-spacing: -.02em; text-shadow: 0 1px 1px rgba(0,0,0,.25); }
      .mub-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-provider { color: var(--dsw-alias-label-secondary); font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-badge { font-size: 9px; line-height: 1; padding: 2px 4px; border-radius: 4px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); flex: none; }
      .mub-badge-new { color: var(--dsw-alias-brand-primary); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, transparent); font-weight: 650; letter-spacing: .04em; }
      .mub-badge.mub-warn { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 35%, transparent); }
      .mub-model-num { text-align: right; flex: none; font-variant-numeric: tabular-nums; }
      .mub-model-cost { font-weight: 650; }
      .mub-model-tokens { color: var(--dsw-alias-label-secondary); font-size: 9px; }
      .mub-model-ref { color: var(--dsw-alias-label-secondary); font-size: 9px; margin-top: 1px; white-space: nowrap; }
      .mub-disclose { color: var(--dsw-alias-label-secondary); font-size: 10px; flex: none; width: 8px; text-align: center; }
      .mub-quota { margin-top: 5px; }
      .mub-quota-line { display: flex; justify-content: space-between; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 9px; }
      .mub-quota-line b { color: var(--dsw-alias-label-primary); font-weight: 600; }
      .mub-track { height: 3px; background: var(--dsw-alias-bg-layer-2); border-radius: 999px; overflow: hidden; margin-top: 3px; }
      .mub-fill { height: 100%; border-radius: 999px; background: var(--dsw-alias-brand-primary); }
      .mub-fill.mub-warn { background: var(--dsw-alias-state-warn-primary); }
      .mub-fill.mub-over { background: var(--dsw-alias-state-error-primary); }
      .mub-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 10px; padding: 7px 0 1px 11px; color: var(--dsw-alias-label-secondary); font-size: 9px; }
      .mub-detail b { color: var(--dsw-alias-label-primary); font-weight: 500; font-variant-numeric: tabular-nums; }
      .mub-quota-note { color: var(--dsw-alias-label-secondary); font-size: 9px; margin-top: 3px; }
      .mub-foot { display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-top: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); font-size: 9px; flex: none; }
      .mub-foot > span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-linkbtn { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; cursor: pointer; padding: 2px 3px; border-radius: 4px; }
      .mub-linkbtn:hover { background: var(--dsw-alias-bg-layer-2); }
      .mub-btn { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 11px; border-radius: 7px; padding: 5px 10px; cursor: pointer; }
      .mub-btn:hover { background: var(--dsw-alias-bg-layer-2); }
      .mub-btn:disabled { opacity: .55; cursor: default; }
      .mub-btn.mub-primary { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); font-weight: 600; }
      .mub-btn.mub-primary:hover { filter: brightness(1.06); }
      .mub-btn.mub-danger { color: var(--dsw-alias-state-error-primary); }
      .mub-launcher { position: relative; width: 42px; height: 42px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent); background: linear-gradient(145deg, color-mix(in srgb, var(--dsw-alias-bg-overlay) 92%, white 8%), color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, black 12%)); color: var(--dsw-alias-label-primary); display: grid; place-items: center; cursor: pointer; box-shadow: 0 12px 30px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent), inset 0 1px 0 rgba(255,255,255,.3), inset 0 -1px 0 rgba(0,0,0,.22); backdrop-filter: blur(18px) saturate(140%); }
      .mub-launcher:hover { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); }
      .mub-launcher svg { width: 19px; height: 19px; display: block; }
      .mub-launcher .mub-live-dot { position: absolute; right: 8px; top: 8px; }
      .mub-pill { display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 11px 0 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent); border-radius: 999px; background: linear-gradient(145deg, color-mix(in srgb, var(--dsw-alias-bg-overlay) 92%, white 8%), color-mix(in srgb, var(--dsw-alias-bg-overlay) 88%, black 12%)); color: var(--dsw-alias-label-primary); box-shadow: 0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent), inset 0 1px 0 rgba(255,255,255,.26), inset 0 -1px 0 rgba(0,0,0,.22); cursor: grab; user-select: none; touch-action: none; font-size: 11px; white-space: nowrap; backdrop-filter: blur(18px) saturate(140%); }
      .mub-pill:active { cursor: grabbing; }
      .mub-pill .mub-brand { width: 22px; height: 22px; border-radius: 7px; }
      .mub-pill b { font-variant-numeric: tabular-nums; font-weight: 650; }
      .mub-pill .mub-pill-cost { color: var(--dsw-alias-brand-primary); }
      .mub-pill .mub-live-dot { margin-left: 1px; }
      .mub-pill-phase { color: var(--mub-phase-accent, var(--dsw-alias-brand-primary)); font-size: 9px; font-weight: 650; }
      .mub-settings { flex: 1; min-height: 0; overflow: auto; padding-bottom: 10px; scrollbar-width: thin; scrollbar-color: var(--dsw-alias-border-l2) transparent; }
      .mub-settings::-webkit-scrollbar { width: 8px; }
      .mub-settings::-webkit-scrollbar-thumb { background: var(--dsw-alias-border-l2); border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
      .mub-field { display: flex; align-items: center; gap: 8px; padding: 6px 14px; }
      .mub-field label { flex: 1; color: var(--dsw-alias-label-secondary); font-size: 11px; }
      .mub-field-block { display: block; }
      .mub-field-block > label { display: block; margin-bottom: 5px; }
      .mub-input, .mub-select { width: 104px; flex: none; background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-primary); border-radius: 6px; font: inherit; font-size: 11px; padding: 4px 6px; }
      .mub-select.mub-wide { width: 178px; }
      .mub-switch { appearance: none; border: 1px solid var(--dsw-alias-border-l1); width: 36px; height: 20px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); padding: 2px; cursor: pointer; flex: none; display: flex; align-items: center; transition: background .15s; }
      .mub-switch span { width: 15px; height: 15px; border-radius: 50%; background: var(--dsw-alias-label-secondary); display: block; transform: translateX(0); transition: transform .15s, background .15s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
      .mub-switch.mub-on { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
      .mub-switch.mub-on span { background: var(--dsw-alias-bg-base); transform: translateX(16px); }
      .mub-style-picker { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; width: 100%; }
      .mub-style-card { display: flex; align-items: center; gap: 6px; min-width: 0; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-2); border-radius: 7px; padding: 5px 6px; color: var(--dsw-alias-label-secondary); font-size: 10px; cursor: pointer; text-align: left; }
      .mub-style-card:hover { color: var(--dsw-alias-label-primary); }
      .mub-style-card.mub-style-active { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-brand-primary); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 25%, transparent); }
      .mub-style-swatch { width: 18px; height: 18px; border-radius: 5px; flex: none; border: 1px solid rgba(255,255,255,.18); box-shadow: inset 0 1px 0 rgba(255,255,255,.28); }
      .mub-swatch-auto { background: linear-gradient(135deg, #ffd6a5, #8ecae6 34%, #ff8fab 67%, #7aa2ff); }
      .mub-swatch-glass { background: linear-gradient(145deg, #e5edf8, #8fa4bd); }
      .mub-swatch-cyber { background: linear-gradient(135deg, #06172f, #45f3ff 58%, #ff4fd8); }
      .mub-swatch-matrix { background: linear-gradient(135deg, #03140a, #46ff9f); }
      .mub-swatch-aurora { background: linear-gradient(135deg, #0b0b22, #6f46ff 54%, #5ef1d4); }
      .mub-swatch-prism { background: conic-gradient(from 180deg, #ff5f9e, #ffb86b, #f9f871, #5ef1d4, #5aa9ff, #b388ff, #ff5f9e); }
      .mub-phase-preview { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; width: 100%; }
      .mub-phase-card { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px; background: var(--dsw-alias-bg-layer-2); padding: 4px 2px 3px; color: var(--dsw-alias-label-secondary); font-size: 9px; }
      .mub-phase-card small { font-size: 8px; opacity: .65; letter-spacing: .02em; }
      .mub-phase-card.mub-phase-current { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent); }
      .mub-phase-swatch { display: block; width: 100%; height: 15px; border-radius: 4px; border: 1px solid rgba(255,255,255,.18); box-shadow: inset 0 1px 0 rgba(255,255,255,.35); }
      .mub-phase-swatch-day { background: linear-gradient(135deg, #fff8ea, #dcecff 55%, #a9cdf5); }
      .mub-phase-swatch-afternoon { background: linear-gradient(135deg, #fff0d3, #ffd39a 55%, #d89543); }
      .mub-phase-swatch-dusk { background: linear-gradient(135deg, #ff9a86, #b06ad4 58%, #36254f); }
      .mub-phase-swatch-night { background: linear-gradient(135deg, #99baff, #4b67a8 58%, #0b1426); }
      .mub-phase-swatch-dawn { background: linear-gradient(135deg, #b9fff3, #4bb8ad 55%, #061a20); }
      .mub-input::placeholder { color: var(--dsw-alias-state-idle-primary); }
      .mub-input.mub-num { width: 72px; text-align: right; font-variant-numeric: tabular-nums; }
      .mub-settings-hint { padding: 2px 14px 8px; color: var(--dsw-alias-label-secondary); font-size: 10px; }
      .mub-settings-section { border-top: 1px solid var(--dsw-alias-border-l1); margin-top: 6px; padding-top: 4px; }
      .mub-settings-section:first-of-type { border-top: 0; margin-top: 0; padding-top: 0; }
      .mub-modelcfg { border-top: 1px solid var(--dsw-alias-border-l1); padding: 7px 14px 8px; }
      .mub-modelcfg:first-child { border-top: 0; }
      .mub-modelcfg summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 6px; }
      .mub-modelcfg summary::-webkit-details-marker { display: none; }
      .mub-modelcfg summary::after { content: '›'; color: var(--dsw-alias-label-secondary); transform: rotate(90deg); margin-left: 2px; }
      .mub-modelcfg[open] summary::after { transform: rotate(-90deg); }
      .mub-cfgtext { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
      .mub-cfgname { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
      .mub-cfgmeta { color: var(--dsw-alias-label-secondary); font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-cfgprice { color: var(--dsw-alias-label-secondary); font-size: 9px; flex: none; }
      .mub-cfgbody { padding-top: 7px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 8px; }
      .mub-cfgfield { display: flex; flex-direction: column; gap: 2px; color: var(--dsw-alias-label-secondary); font-size: 9px; }
      .mub-cfgfield .mub-input { width: 100%; }
      .mub-cfgwide { grid-column: 1 / -1; }
      .mub-cfgactions { grid-column: 1 / -1; display: flex; gap: 8px; justify-content: flex-end; padding-top: 1px; }
      .mub-data { padding: 4px 14px 8px; color: var(--dsw-alias-label-secondary); font-size: 10px; }
      .mub-data code { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); padding: 1px 4px; border-radius: 4px; font-size: 10px; word-break: break-all; }
      .mub-data-row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; }
      .mub-data-row b { color: var(--dsw-alias-label-primary); font-weight: 500; }
      .mub-banner { margin: 8px 14px 0; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent); color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); border-radius: 7px; padding: 6px 8px; font-size: 10px; display: flex; align-items: center; gap: 8px; }
      .mub-banner span { flex: 1; }
      .mub-banner.mub-info { border-color: var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); }
      .mub-settings > .mub-foot { position: sticky; bottom: 0; background: var(--dsw-alias-bg-layer-1); z-index: 2; box-shadow: 0 -8px 18px color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent); }
      .mub-toast { position: absolute; left: 50%; bottom: 42px; transform: translateX(-50%); background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-primary); padding: 5px 9px; border-radius: 7px; font-size: 10px; box-shadow: 0 8px 20px color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent); z-index: 3; white-space: nowrap; }
      .mub-custom { display: flex; align-items: center; gap: 4px; padding: 0 12px 8px; flex: none; }
      .mub-custom .mub-input { width: 112px; }
      .mub-custom .mub-btn { padding: 3px 8px; }
      .mub-detail-head { display: flex; align-items: center; gap: 8px; padding: 9px 12px 5px; flex: none; }
      .mub-back { appearance: none; border: 0; background: transparent; color: var(--dsw-alias-label-secondary); width: 27px; height: 27px; border-radius: 7px; display: grid; place-items: center; cursor: pointer; flex: none; }
      .mub-back:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
      .mub-back svg { width: 16px; height: 16px; }
      .mub-detail-id { flex: 1; min-width: 0; }
      .mub-detail-name { font-size: 14px; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-detail-sub { color: var(--dsw-alias-label-secondary); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mub-detail-rangebadge { color: var(--dsw-alias-label-secondary); font-size: 9px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 4px; padding: 1px 5px; flex: none; }
      .mub-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 12px; padding: 10px 14px 8px; border-top: 1px solid var(--dsw-alias-border-l1); }
      .mub-detail-grid > span { display: flex; justify-content: space-between; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 10px; min-width: 0; }
      .mub-detail-grid b { color: var(--dsw-alias-label-primary); font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
      .mub-detail-wide { grid-column: 1 / -1; }
      .mub-detail-quota { padding: 2px 14px 8px; }
      .mub-recent { padding: 0 14px 12px; }
      .mub-recent-row { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: center; border-top: 1px solid var(--dsw-alias-border-l1); padding: 5px 0; color: var(--dsw-alias-label-secondary); font-size: 9px; }
      .mub-recent-row b { color: var(--dsw-alias-label-primary); font-weight: 500; text-align: right; font-variant-numeric: tabular-nums; }
      .mub-loading { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary); padding: 20px 16px; font-size: 11px; }
      .mub-spinner { width: 12px; height: 12px; border: 1.5px solid var(--dsw-alias-border-l2); border-top-color: var(--dsw-alias-brand-primary); border-radius: 50%; animation: mub-spin .8s linear infinite; }
      .mub-spin-icon { display: grid; place-items: center; animation: mub-spin .9s linear infinite; }
      @keyframes mub-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .mub-spinner, .mub-spin-icon, .mub-drift span, .mub-scene i { animation: none !important; } .mub-drift span { opacity: .12; } }
      @media (max-width: 480px) { .mub-panel { width: calc(100vw - 16px); height: calc(100vh - 20px); max-height: calc(100vh - 20px); } .mub-field { padding-left: 10px; padding-right: 10px; } }
    `

    const ICON = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M4 19V9M10 19V5M16 19v-7M22 19V3', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
    )

    const CHEVRON_LEFT = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M14 6l-6 6 6 6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )
    const CHEVRON_RIGHT = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M10 6l6 6-6 6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )
    const CHEVRON_DOWN = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M6 9l6 6 6-6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )
    const GEAR = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z', stroke: 'currentColor', strokeWidth: 1.7 }),
      h('path', { d: 'M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .61 1.7 1.7 0 00-.36 1.05V21a2 2 0 11-4 0v-.09A1.7 1.7 0 008.6 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.61-1 1.7 1.7 0 00-1.05-.36H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 8.6a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.61 1.7 1.7 0 00.36-1.05V3a2 2 0 114 0v.09A1.7 1.7 0 0015.4 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.13.38.36.72.67.98.3.26.67.4 1.05.4H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51.62z', stroke: 'currentColor', strokeWidth: 1.4 }),
    )
    const REFRESH = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M20 11a8 8 0 10-2.34 5.66M20 4v7h-7', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )
    const DESKTOP = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('rect', { x: 3, y: 4, width: 18, height: 12, rx: 2, stroke: 'currentColor', strokeWidth: 1.7 }),
      h('path', { d: 'M8 20h8M12 16v4', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
    )
    const POWER = h('svg', { viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M12 3v8', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }),
      h('path', { d: 'M7.05 5.05a9 9 0 1010.9 0', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' }),
    )

    function fallbackT(key) {
      return (zh[key] ?? en[key] ?? key)
    }

    function fmtTokens(value) {
      const n = Number(value) || 0
      if (n < 1000) return String(Math.round(n))
      if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`
      if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)}M`
      return `${(n / 1_000_000_000).toFixed(2)}B`
    }

    function fmtMoney(value, currency) {
      const n = Number(value) || 0
      const symbol = currency === 'USD' ? '$' : '¥'
      if (n === 0) return `${symbol}0.00`
      if (n < 0.01) return `${symbol}${n.toFixed(4)}`
      if (n < 1) return `${symbol}${n.toFixed(3)}`
      return `${symbol}${n.toFixed(2)}`
    }

    function fmtPrice(value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '—'
      if (n >= 10) return n.toFixed(1)
      if (n >= 1) return n.toFixed(2)
      return n.toFixed(3)
    }

    function fmtPlaceholder(value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '0'
      return String(Number(n.toFixed(4)))
    }

    function fmtPct(value) {
      const n = Number(value)
      if (!Number.isFinite(n)) return '—'
      return `${Math.round(n * 100)}%`
    }

    function fmtUnitPrice(price, t) {
      if (!price || !price.original) return '—'
      const original = price.original
      const symbol = original.currency === 'CNY' ? '¥' : '$'
      return `${price.official ? `${t('currentUnit')} ` : ''}${t('input')} ${symbol}${fmtPrice(original.input)} · ${t('output')} ${symbol}${fmtPrice(original.output)} · ${t('cacheRead')} ${symbol}${fmtPrice(original.cacheRead)} ${t('perMillionShort')}`
    }

    function compactUnitPrice(price, t) {
      if (!price?.original) return '—'
      const original = price.original
      const symbol = original.currency === 'CNY' ? '¥' : '$'
      return `${symbol}${fmtPrice(original.input)} / ${symbol}${fmtPrice(original.output)} / ${symbol}${fmtPrice(original.cacheRead)} ${t('perMillionShort')}`
    }

    function fmtTime(ms, timeZone, locale = 'zh-CN') {
      if (!Number.isFinite(ms)) return '—'
      try {
        return new Intl.DateTimeFormat(locale, {
          timeZone, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
        }).format(new Date(ms))
      } catch {
        return new Date(ms).toLocaleString()
      }
    }

    function addDaysKey(key, days) {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key ?? ''))
      if (m === null) return key
      const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days))
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    }

    function rangeLabel(period, t) {
      if (period === null) return ''
      const endInclusive = addDaysKey(period.endKey, -1)
      switch (period.kind) {
        case 'day': return period.startKey
        case 'week': return `${period.startKey} ${t('rangeTo')} ${endInclusive}`
        case 'month': return period.startKey.slice(0, 7)
        case 'quarter': {
          const year = period.startKey.slice(0, 4)
          const month = Number(period.startKey.slice(5, 7))
          return `${year} Q${Math.floor((month - 1) / 3) + 1}`
        }
        case 'year': return period.startKey.slice(0, 4)
        case 'custom': return `${period.startKey} ${t('rangeTo')} ${endInclusive}`
        default: return `${period.startKey} ${t('rangeTo')} ${endInclusive}`
      }
    }

    const VENDOR_META = {
      deepseek: { label: 'DeepSeek' },
      qwen: { label: 'Qwen · 千问' },
      stepfun: { label: 'StepFun · 阶跃' },
      claude: { label: 'Anthropic · Claude' },
      openai: { label: 'OpenAI' },
      mimo: { label: 'Xiaomi · MiMo' },
      moss: { label: 'MOSS · NEX' },
      gemini: { label: 'Google · Gemini' },
      grok: { label: 'xAI · Grok' },
      kimi: { label: 'Moonshot · Kimi' },
      zhipu: { label: 'Zhipu · GLM' },
      minimax: { label: 'MiniMax' },
      meta: { label: 'Meta · Llama' },
      mistral: { label: 'Mistral' },
      doubao: { label: 'ByteDance · Doubao' },
      hunyuan: { label: 'Tencent · Hunyuan' },
      baidu: { label: 'Baidu · ERNIE' },
      cohere: { label: 'Cohere' },
      perplexity: { label: 'Perplexity' },
      generic: { label: 'Model' },
    }

    function vendorOf(provider, model) {
      const text = `${provider ?? ''} ${model ?? ''}`.toLowerCase()
      if (text.includes('claude') || text.includes('anthropic')) return 'claude'
      if (text.includes('qwen') || text.includes('qianwen') || text.includes('tongyi')) return 'qwen'
      if (text.includes('deepseek')) return 'deepseek'
      if (text.includes('step')) return 'stepfun'
      if (text.includes('mimo') || text.includes('xiaomi')) return 'mimo'
      if (text.includes('moss') || text.includes('nex')) return 'moss'
      if (text.includes('gemini') || text.includes('google') || text.includes('bard') || text.includes('palm')) return 'gemini'
      if (text.includes('grok') || text.includes('xai')) return 'grok'
      if (text.includes('kimi') || text.includes('moonshot')) return 'kimi'
      if (text.includes('glm') || text.includes('zhipu') || text.includes('chatglm')) return 'zhipu'
      if (text.includes('minimax') || text.includes('abab')) return 'minimax'
      if (text.includes('llama') || text.includes('meta-')) return 'meta'
      if (text.includes('mistral') || text.includes('mixtral') || text.includes('codestral')) return 'mistral'
      if (text.includes('doubao') || text.includes('bytedance') || text.includes('seed-')) return 'doubao'
      if (text.includes('hunyuan') || text.includes('tencent')) return 'hunyuan'
      if (text.includes('ernie') || text.includes('wenxin') || text.includes('baidu')) return 'baidu'
      if (text.includes('cohere') || text.includes('command-r')) return 'cohere'
      if (text.includes('perplexity') || text.includes('sonar')) return 'perplexity'
      if (text.includes('gpt') || text.includes('openai') || /(^|[/\s])o[134]($|[-.\s])/.test(text)) return 'openai'
      return 'generic'
    }

    function initialsOf(provider, model) {
      const source = String(provider || model || '?').replace(/[^A-Za-z0-9\u4e00-\u9fff]/g, '')
      return source.slice(0, 2).toUpperCase() || 'AI'
    }

    function hueOf(text) {
      let hash = 0
      const source = String(text ?? '')
      for (let index = 0; index < source.length; index += 1) hash = (hash * 31 + source.charCodeAt(index)) >>> 0
      return hash % 360
    }

    function VendorIcon({ provider, model, size = 18 }) {
      const vendor = vendorOf(provider, model)
      const meta = VENDOR_META[vendor]
      if (vendor === 'generic' || meta === undefined) {
        const hue = hueOf(`${provider}/${model}`)
        return h('span', {
          className: 'mub-vendor mub-vendor-mono',
          style: {
            width: size, height: size,
            background: `linear-gradient(135deg, hsl(${hue} 62% 48%), hsl(${(hue + 42) % 360} 70% 30%))`,
            fontSize: Math.max(7, Math.round(size * 0.4)),
          },
          title: `${provider || ''}/${model || ''}`,
          'aria-hidden': true,
        }, initialsOf(provider, model))
      }
      return h('span', {
        className: 'mub-vendor',
        style: { width: size, height: size },
        title: meta.label,
        'aria-hidden': true,
      }, h('img', { src: `${API}/vendor/${vendor}.svg`, alt: meta.label, draggable: false }))
    }

    async function apiGet(path, signal) {
      const res = await fetch(path, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data === null || data.ok === false) {
        throw new Error(data?.error ?? `HTTP ${res.status}`)
      }
      return data
    }

    async function apiPost(path, body, signal) {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dsh-usage': '1',
          Accept: 'application/json',
        },
        body: JSON.stringify(body ?? {}),
        cache: 'no-store',
        signal,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data === null || data.ok === false) {
        throw new Error(data?.error ?? `HTTP ${res.status}`)
      }
      return data
    }

    function useDebouncedRefresh(setTick, delay = 350) {
      const timer = useRef(null)
      useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])
      return useCallback(() => {
        if (timer.current !== null) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          timer.current = null
          setTick(v => v + 1)
        }, delay)
      }, [delay, setTick])
    }

    function IconButton({ label, onClick, children, disabled = false }) {
      return h('button', {
        type: 'button', className: 'mub-iconbtn', title: label, 'aria-label': label,
        onClick, disabled,
      }, children)
    }

    function TrendChart({ summary, t, costKey = 'cost', costUsdKey = 'costUsd' }) {
      const [hover, setHover] = useState(null)
      const buckets = summary.buckets ?? []
      const maxTokens = Math.max(1, ...buckets.map(b => b.tokens || 0))
      const maxCost = Math.max(1e-12, ...buckets.map(b => b[costUsdKey] || 0))
      const count = buckets.length
      const labelEvery = count <= 8 ? 1 : Math.ceil(count / 6)
      const points = buckets.map((bucket, index) => {
        const x = ((index + 0.5) / Math.max(1, count)) * 100
        const y = 100 - ((bucket[costUsdKey] || 0) / maxCost) * 88
        return `${x.toFixed(2)},${y.toFixed(2)}`
      }).join(' ')
      const active = hover !== null ? buckets[hover] : null
      return h('div', { className: 'mub-chart' },
        h('div', { className: 'mub-chart-head' },
          h('div', { className: 'mub-chart-readout' },
            active !== null
              ? `${active.label} · ${fmtTokens(active.tokens)} ${t('tokenShort')} · ${fmtMoney(active[costKey], summary.currency)}`
              : `${t('trend')} · ${rangeLabel(summary.period, t)}`,
          ),
          h('div', { className: 'mub-legend' },
            h('span', null, h('i', { style: { background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent)' } }), t('chartTokens')),
            h('span', null, h('i', { className: 'mub-linekey' }), t('chartCost')),
          ),
        ),
        h('div', { className: 'mub-plot' },
          h('div', { className: 'mub-bars' }, buckets.map((bucket, index) => h('div', {
            key: bucket.key,
            className: 'mub-bar-slot',
            onMouseEnter: () => setHover(index),
            onMouseLeave: () => setHover(null),
            onFocus: () => setHover(index),
            onBlur: () => setHover(null),
            tabIndex: -1,
            'aria-label': `${bucket.label}: ${fmtTokens(bucket.tokens)} tokens, ${fmtMoney(bucket[costKey], summary.currency)}`,
          }, h('div', {
            className: 'mub-bar',
            style: { height: bucket.tokens > 0 ? `${Math.max(2, (bucket.tokens / maxTokens) * 100)}%` : '0%' },
          })))),
          h('svg', { className: 'mub-line', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': true },
            h('polyline', {
              points,
              fill: 'none',
              stroke: 'var(--dsw-alias-brand-primary)',
              strokeWidth: 1.6,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              vectorEffect: 'non-scaling-stroke',
            }),
          ),
        ),
        h('div', { className: 'mub-axis' }, buckets.map((bucket, index) => {
          if (index % labelEvery !== 0) return null
          const left = Math.min(96, Math.max(4, ((index + 0.5) / Math.max(1, count)) * 100))
          return h('div', {
            key: bucket.key, className: 'mub-axis-label', style: { left: `${left}%` },
          }, bucket.label)
        })),
      )
    }

    function billingBadge(row, t) {
      if (row.billing === 'plan') return { text: t('plan'), title: t('planHint'), className: 'mub-badge' }
      if (row.billing === 'credits') return { text: t('credits'), title: t('creditsHint'), className: 'mub-badge' }
      if (row.billing === 'unpriced') {
        if (row.price?.source === 'list') return { text: t('priceListReference'), title: t('referenceHint'), className: 'mub-badge' }
        if (row.price?.source === 'nex-chars') return { text: t('priceNexChars'), title: t('nexCharsHint'), className: 'mub-badge' }
        if (row.price) return { text: t('priceFamilyEstimate'), title: t('estimatedHint'), className: 'mub-badge' }
        return { text: t('unpriced'), title: t('priceHint'), className: 'mub-badge mub-warn' }
      }
      if (row.price === null || row.price === undefined) {
        return { text: t('unpriced'), title: t('priceHint'), className: 'mub-badge mub-warn' }
      }
      if (row.official) {
        return { text: t('officialPrice'), title: t('officialHint'), className: 'mub-badge' }
      }
      if (row.calibrated || row.price?.calibrated) {
        return { text: t('platformCalibrated'), title: row.price?.note ?? t('calibrationHint'), className: 'mub-badge' }
      }
      if (row.price?.source === 'list') return { text: t('priceListReference'), title: t('referenceHint'), className: 'mub-badge' }
      if (row.price?.source === 'nex-chars') return { text: t('priceNexChars'), title: t('nexCharsHint'), className: 'mub-badge' }
      if (row.estimated) return { text: t('priceFamilyEstimate'), title: t('estimatedHint'), className: 'mub-badge' }
      if (row.price?.source === 'route' || row.price?.source === 'model') return { text: t('priceCustom'), title: t('priceHint'), className: 'mub-badge' }
      return null
    }

    function costText(row, summary, t) {
      if (summary.costBasis === 'cash') {
        if (row.billing === 'plan') return t('plan')
        if (row.billing === 'credits') return t('credits')
        if (row.billing === 'unpriced') return row.price?.source === 'nex-chars' ? t('priceNexChars') : row.price ? t('priceFamilyEstimate') : '—'
        if (row.price === null || row.price === undefined) return '—'
        if (row.billing === 'payg' && row.price?.cashEligible !== true) {
          return row.price?.source === 'list' ? t('priceListReference') : t('priceFamilyEstimate')
        }
      }
      return fmtMoney(row.cost ?? row.cashCost ?? 0, summary.currency)
    }

    function quotaDisplay(row, summary, t) {
      const quota = row.quota
      if (!quota) return null
      const isDay = summary.period.isCurrent && summary.period.kind === 'day' && quota.dailyTokens > 0
      const isMonth = summary.period.isCurrent && summary.period.kind === 'month'
      if (isDay) {
        const used = row.tokens || 0
        return { used, limit: quota.dailyTokens, ratio: used / quota.dailyTokens, label: t('quotaScopeDay'), money: false }
      }
      if (isMonth) {
        if (quota.monthlyUsd > 0) {
          const used = row.monthCostUsd || 0
          return { used, limit: quota.monthlyUsd, ratio: used / quota.monthlyUsd, label: t('quotaScopeMonth'), money: true }
        }
        if (quota.monthlyTokens > 0) {
          const used = row.monthTokens || 0
          return { used, limit: quota.monthlyTokens, ratio: used / quota.monthlyTokens, label: t('quotaScopeMonth'), money: false }
        }
      }
      const parts = []
      if (quota.dailyTokens > 0) parts.push(`${t('dayShort')} ${fmtTokens(quota.dailyTokens)}`)
      if (quota.monthlyTokens > 0) parts.push(`${t('monthShort')} ${fmtTokens(quota.monthlyTokens)}`)
      if (quota.monthlyUsd > 0) parts.push(`${t('monthlyBudget')} ${fmtMoney(quota.monthlyUsd, summary.currency)}`)
      return parts.length > 0 ? { text: parts.join(' · ') } : null
    }

    function ModelList({ summary, t, onOpenModel }) {
      const seenRef = useRef(null)
      const [newKeys, setNewKeys] = useState(() => new Set())
      const rows = useMemo(() => {
        const list = [...(summary.models ?? [])]
        const seen = new Set(list.map(row => row.key))
        for (const quota of summary.quotaRows ?? []) {
          if (seen.has(quota.key)) continue
          list.push({
            key: quota.key, provider: quota.provider, model: quota.model, displayName: quota.displayName,
            calls: 0, tokens: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0,
            costUsd: 0, cashCostUsd: 0, listCostUsd: 0, cost: 0, cashCost: 0, listCost: 0,
            pricedCalls: 0, unpricedCalls: 0, estimated: false, official: false, billing: quota.billing ?? 'payg', price: null,
            quota: quota.quota, todayTokens: quota.todayTokens, monthTokens: quota.monthTokens,
            monthCostUsd: quota.monthCostUsd, lastAt: null,
          })
        }
        return list.sort((a, b) => (b.costUsd || 0) - (a.costUsd || 0) || (b.tokens || 0) - (a.tokens || 0))
      }, [summary])
      useEffect(() => {
        const keys = rows.map(row => row.key)
        if (seenRef.current === null) {
          seenRef.current = new Set(keys)
          return
        }
        const fresh = keys.filter(key => !seenRef.current.has(key))
        if (fresh.length === 0) return
        for (const key of fresh) seenRef.current.add(key)
        setNewKeys(previous => new Set([...previous, ...fresh]))
      }, [rows])

      if (rows.length === 0) {
        return h('div', { className: 'mub-empty' }, h('b', null, t('noModels')), t('noData'))
      }
      return h('div', { className: 'mub-models' }, rows.map((row) => {
        const quota = quotaDisplay(row, summary, t)
        const quotaClass = quota?.ratio === undefined ? '' : quota.ratio >= 1 ? 'mub-over' : quota.ratio >= 0.8 ? 'mub-warn' : ''
        const badge = billingBadge(row, t)
        return h('div', { className: 'mub-model', key: row.key },
          h('div', {
            className: 'mub-model-row', role: 'button', tabIndex: 0,
            'aria-label': `${t('modelDetail')}: ${row.displayName || row.model}`,
            onClick: () => onOpenModel(row),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpenModel(row)
              }
            },
          },
            h('div', { className: 'mub-model-main' },
              h('div', { className: 'mub-model-name' },
                h(VendorIcon, { provider: row.provider, model: row.model, size: 18 }),
                h('span', { className: 'mub-name', title: row.model }, row.displayName || row.model),
                badge === null ? null : h('span', { className: badge.className, title: badge.title }, badge.text),
                newKeys.has(row.key) ? h('span', { className: 'mub-badge mub-badge-new', title: t('newModel') }, t('newModel')) : null,
              ),
              h('div', { className: 'mub-provider' }, row.provider || t('provider')),
            ),
            h('div', { className: 'mub-model-num' },
              h('div', { className: 'mub-model-cost' }, costText(row, summary, t)),
              h('div', { className: 'mub-model-tokens' }, `${fmtTokens(row.tokens)} ${t('tokenShort')} · ${row.calls || 0} ${t('callUnit')}`),
              summary.costBasis === 'cash' && (row.listCost ?? 0) > 0 && (row.cashCost ?? 0) === 0
                ? h('div', { className: 'mub-model-ref', title: t('referenceHint') }, `${t('referenceEstimate')} ${fmtMoney(row.listCost, summary.currency)}`)
                : null,
            ),
            h('span', { className: 'mub-disclose', 'aria-hidden': true }, '›'),
          ),
          quota !== null && quota.ratio !== undefined ? h('div', { className: 'mub-quota' },
            h('div', { className: 'mub-quota-line' },
              h('span', null, quota.label),
              h('span', null,
                `${quota.money ? fmtMoney(quota.used, summary.currency) : fmtTokens(quota.used)} / ${quota.money ? fmtMoney(quota.limit, summary.currency) : fmtTokens(quota.limit)}`,
                ' ',
                h('b', null, fmtPct(quota.ratio)),
              ),
            ),
            h('div', { className: 'mub-track' }, h('div', {
              className: `mub-fill ${quotaClass}`,
              style: { width: `${Math.min(100, Math.max(0, quota.ratio * 100))}%` },
            })),
            quota.ratio >= 1 ? h('div', { className: 'mub-note' }, t('over')) : null,
          ) : quota?.text ? h('div', { className: 'mub-quota-note' }, quota.text) : null,
        )
      }))
    }

    function Field({ label, children, className = '' }) {
      return h('div', { className: `mub-field ${className}` }, h('label', null, label), children)
    }

    function NumberInput({ value, onChange, placeholder, min = 0, step = 1, className = '' }) {
      return h('input', {
        type: 'number', min, step, value: value ?? '', placeholder,
        className: `mub-input mub-num ${className}`,
        onChange: event => onChange(event.target.value === '' ? '' : Number(event.target.value)),
      })
    }

    function SettingsView({ settingsView, summary, t, onSave, onRescan, onResetPosition, saving, scan, dirty, setDirty, phase }) {
      const source = settingsView?.settings
      const [draft, setDraft] = useState(source)
      useEffect(() => {
        if (!dirty) setDraft(source)
      }, [source, settingsView?.generatedAt, dirty])
      if (!source || !draft) {
        return h('div', { className: 'mub-loading' }, h('span', { className: 'mub-spinner' }), t('loading'))
      }
      const prices = draft.prices ?? {}
      const quotas = draft.quotas ?? {}
      const data = settingsView.data ?? {}
      const scanState = scan ?? data.scan ?? {}
      const setField = (key, value) => {
        setDirty(true)
        setDraft(prev => ({ ...prev, [key]: value }))
      }
      const priceFor = (row) => {
        const exact = prices[row.key] ?? {}
        const base = row.price ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
        return {
          input: exact.input ?? base.input ?? 0,
          output: exact.output ?? base.output ?? 0,
          cacheRead: exact.cacheRead ?? base.cacheRead ?? 0,
          cacheWrite: exact.cacheWrite ?? base.cacheWrite ?? 0,
          configured: true,
          fromExact: prices[row.key] !== undefined,
        }
      }
      const setPrice = (row, field, value) => {
        setDirty(true)
        setDraft((prev) => {
          const nextPrices = { ...(prev.prices ?? {}) }
          const current = nextPrices[row.key] ?? priceFor(row)
          nextPrices[row.key] = {
            input: current.input ?? 0,
            output: current.output ?? 0,
            cacheRead: current.cacheRead ?? 0,
            cacheWrite: current.cacheWrite ?? 0,
            configured: true,
            [field]: value === '' ? 0 : Number(value),
          }
          return { ...prev, prices: nextPrices }
        })
      }
      const clearPrice = (row) => {
        setDirty(true)
        setDraft((prev) => {
          const nextPrices = { ...(prev.prices ?? {}) }
          delete nextPrices[row.key]
          return { ...prev, prices: nextPrices }
        })
      }
      const quotaFor = (row) => quotas[row.key] ?? { dailyTokens: 0, monthlyTokens: 0, monthlyUsd: 0 }
      const setQuota = (row, field, value) => {
        setDirty(true)
        setDraft((prev) => {
          const nextQuotas = { ...(prev.quotas ?? {}) }
          const current = nextQuotas[row.key] ?? { dailyTokens: 0, monthlyTokens: 0, monthlyUsd: 0 }
          nextQuotas[row.key] = { ...current, [field]: value === '' ? 0 : Number(value) }
          return { ...prev, quotas: nextQuotas }
        })
      }
      const clearQuota = (row) => {
        setDirty(true)
        setDraft((prev) => {
          const nextQuotas = { ...(prev.quotas ?? {}) }
          delete nextQuotas[row.key]
          return { ...prev, quotas: nextQuotas }
        })
      }
      const handleSave = async () => {
        const ok = await onSave({
          currency: draft.currency,
          exchangeRate: draft.exchangeRate,
          refreshSeconds: draft.refreshSeconds,
          costBasis: draft.costBasis ?? 'cash',
          visualStyle: draft.visualStyle ?? 'glass',
          visible: draft.visible !== false,
          prices: draft.prices ?? {},
          quotas: draft.quotas ?? {},
        })
        if (ok) setDirty(false)
      }
      return h('div', { className: 'mub-settings' },
        h('div', { className: 'mub-settings-section' },
          h(Field, { label: t('currency') },
            h('select', {
              className: 'mub-select', value: draft.currency,
              onChange: event => setField('currency', event.target.value),
            }, h('option', { value: 'CNY' }, 'CNY ¥'), h('option', { value: 'USD' }, 'USD $')),
          ),
          h(Field, { label: t('rate') }, h(NumberInput, {
            value: draft.exchangeRate, step: 0.01, min: 0.01, onChange: value => setField('exchangeRate', value),
          })),
          h(Field, { label: t('refreshSec') }, h(NumberInput, {
            value: draft.refreshSeconds, step: 1, min: 2, onChange: value => setField('refreshSeconds', value),
          })),
          h(Field, { label: t('costBasis') },
            h('select', {
              className: 'mub-select mub-wide', value: draft.costBasis ?? 'cash',
              onChange: event => setField('costBasis', event.target.value),
            },
              h('option', { value: 'cash' }, t('costBasisCash')),
              h('option', { value: 'list' }, t('costBasisList')),
            ),
          ),
          h('div', { className: 'mub-settings-hint' }, draft.costBasis === 'list' ? t('listHint') : t('cashHint')),
          h(Field, { label: t('visualStyle'), className: 'mub-field-block' },
            h('div', { className: 'mub-style-picker' },
              ['auto', 'glass', 'cyber', 'matrix', 'aurora', 'prism'].map((id) => h('button', {
                key: id, type: 'button',
                className: `mub-style-card ${(draft.visualStyle ?? 'glass') === id ? 'mub-style-active' : ''}`,
                'aria-pressed': (draft.visualStyle ?? 'glass') === id,
                onClick: () => setField('visualStyle', id),
              },
                h('span', { className: `mub-style-swatch mub-swatch-${id}` }),
                h('span', null, t(`style${id[0].toUpperCase()}${id.slice(1)}`)),
              )),
            ),
          ),
          h('div', { className: 'mub-settings-hint' }, t('styleHint')),
          h(Field, { label: t('autoPhase'), className: 'mub-field-block' },
            h('div', { className: 'mub-phase-preview' },
              PHASES.map(item => h('div', {
                key: item.id,
                className: `mub-phase-card ${item.id === phase ? 'mub-phase-current' : ''}`,
              },
                h('span', { className: `mub-phase-swatch mub-phase-swatch-${item.id}` }),
                h('span', { className: 'mub-phase-name' }, t(phaseKey(item.id))),
                h('small', null, item.range),
              )),
            ),
          ),
          h('div', { className: 'mub-settings-hint' }, t('phaseHint')),
          h(Field, { label: t('showBoard') },
            h('button', {
              type: 'button', role: 'switch', 'aria-checked': draft.visible !== false,
              className: `mub-switch ${draft.visible !== false ? 'mub-on' : ''}`,
              onClick: () => setField('visible', draft.visible === false),
            }, h('span')),
          ),
        ),
        h('div', { className: 'mub-settings-section' },
          h('div', { className: 'mub-section-title' }, t('prices'), h('span'), h('span', { className: 'mub-cfgprice' }, t('priceUnit'))),
          h('div', { className: 'mub-settings-hint' }, t('pricesHint')),
          h('div', { className: 'mub-settings-hint' }, t('deepseekHint')),
          (settingsView.models ?? []).map((row) => {
            const p = priceFor(row)
            const q = quotaFor(row)
            const badge = billingBadge(row, t)
            return h('details', { className: 'mub-modelcfg', key: row.key },
              h('summary', null,
                h(VendorIcon, { provider: row.provider, model: row.model, size: 17 }),
                h('div', { className: 'mub-cfgtext' },
                  h('span', { className: 'mub-cfgname', title: row.model }, row.displayName || row.model),
                  h('span', { className: 'mub-cfgmeta' },
                    `${row.official ? `${t('currentUnit')} ` : ''}${compactUnitPrice(row.price, t)}`),
                ),
                h('span', { className: 'mub-cfgprice', title: badge?.title }, badge?.text ?? t('noPrice')),
              ),
              h('div', { className: 'mub-cfgbody' },
                h('div', { className: 'mub-cfgfield' }, t('input'), h(NumberInput, {
                  value: prices[row.key]?.input ?? '', placeholder: fmtPlaceholder(p.input), step: 0.001,
                  onChange: value => setPrice(row, 'input', value),
                })),
                h('div', { className: 'mub-cfgfield' }, t('output'), h(NumberInput, {
                  value: prices[row.key]?.output ?? '', placeholder: fmtPlaceholder(p.output), step: 0.001,
                  onChange: value => setPrice(row, 'output', value),
                })),
                h('div', { className: 'mub-cfgfield' }, t('cacheRead'), h(NumberInput, {
                  value: prices[row.key]?.cacheRead ?? '', placeholder: fmtPlaceholder(p.cacheRead), step: 0.001,
                  onChange: value => setPrice(row, 'cacheRead', value),
                })),
                h('div', { className: 'mub-cfgfield' }, t('cacheWrite'), h(NumberInput, {
                  value: prices[row.key]?.cacheWrite ?? '', placeholder: fmtPlaceholder(p.cacheWrite), step: 0.001,
                  onChange: value => setPrice(row, 'cacheWrite', value),
                })),
                h('div', { className: 'mub-cfgfield' }, t('perDay'), h(NumberInput, {
                  value: quotas[row.key]?.dailyTokens ?? '', placeholder: '0', step: 1000,
                  onChange: value => setQuota(row, 'dailyTokens', value),
                })),
                h('div', { className: 'mub-cfgfield' }, t('perMonth'), h(NumberInput, {
                  value: quotas[row.key]?.monthlyTokens ?? '', placeholder: '0', step: 1000,
                  onChange: value => setQuota(row, 'monthlyTokens', value),
                })),
                h('div', { className: 'mub-cfgfield' }, t('monthlyBudget'), h(NumberInput, {
                  value: quotas[row.key]?.monthlyUsd ?? '', placeholder: '0', step: 0.01,
                  onChange: value => setQuota(row, 'monthlyUsd', value),
                })),
                h('div', { className: 'mub-settings-hint mub-cfgwide', style: { padding: 0 } }, fmtUnitPrice(row.price, t)),
                row.official || row.billing === 'plan' || row.billing === 'credits'
                  ? h('div', { className: 'mub-settings-hint mub-cfgwide', style: { padding: 0 } },
                    row.official ? t('deepseekHint') : row.billing === 'plan' ? t('planHint') : t('creditsHint'))
                  : null,
                h('div', { className: 'mub-cfgactions' },
                  p.fromExact ? h('button', { type: 'button', className: 'mub-linkbtn', onClick: () => clearPrice(row) }, t('restoreEstimate')) : null,
                  (quotas[row.key] !== undefined) ? h('button', { type: 'button', className: 'mub-linkbtn', onClick: () => clearQuota(row) }, t('clearQuota')) : null,
                ),
              ),
            )
          }),
        ),
        h('div', { className: 'mub-settings-section' },
          h('div', { className: 'mub-section-title' }, t('data')),
          h('div', { className: 'mub-settings-hint' }, t('dataHint')),
          h('div', { className: 'mub-data' },
            summary ? h('div', { className: 'mub-data-row' },
              h('span', null, t('costBasis')),
              h('b', null, `${t('actualShort')} ${fmtMoney(summary.totals.cashCost, summary.currency)} · ${t('referenceEstimate')} ${fmtMoney(summary.totals.listCost, summary.currency)}`),
            ) : null,
            h('div', { className: 'mub-data-row' }, h('span', null, t('dataDir')), h('code', null, data.dir ?? '—')),
            h('div', { className: 'mub-data-row' }, h('span', null, `${t('records')} / ${t('sessions')}`), h('b', null, `${data.records ?? 0} / ${data.sessions ?? 0}`)),
            h('div', { className: 'mub-data-row' }, h('span', null, t('updated')), h('b', null, data.lastAt ? fmtTime(data.lastAt, summary?.timezone ?? 'Asia/Shanghai') : '—')),
            h('div', { className: 'mub-data-row' }, h('span', null, t('scanProgress')), h('b', null, scanState.running ? `${scanState.done ?? 0} / ${scanState.total ?? 0}` : (scanState.error ? t('scanFailed') : t('scanDone')))),
            scanState.error ? h('div', { className: 'mub-note', style: { marginTop: 4 } }, scanState.error) : null,
            h('div', { className: 'mub-cfgactions', style: { justifyContent: 'flex-start', paddingTop: 7 } },
              h('button', {
                type: 'button', className: 'mub-btn', disabled: scanState.running,
                onClick: () => { void onRescan() },
              }, scanState.running ? t('rescanning') : t('rescan')),
              h('button', { type: 'button', className: 'mub-btn', onClick: onResetPosition }, t('resetPosition')),
              h('a', {
                className: 'mub-btn', href: `${API}/export?period=${encodeURIComponent(summary?.period?.kind ?? 'day')}&anchor=${encodeURIComponent(summary?.period?.startKey ?? '')}`,
                download: 'dsh-model-usage.csv', style: { textDecoration: 'none' },
              }, t('exportCsv')),
            ),
          ),
        ),
        h('div', { className: 'mub-foot' },
          h('span', { className: dirty ? 'mub-note' : undefined, style: dirty ? { margin: 0 } : undefined }, dirty ? t('unsavedChanges') : t('settingsQuotaHint')),
          h('button', {
            type: 'button', className: 'mub-btn mub-primary', disabled: saving, onClick: handleSave,
          }, saving ? t('saving') : t('save')),
        ),
      )
    }

    function PanelHeader({ collapsed, onPointerDown, onPointerMove, onPointerUp, onKeyDown, t, view, phase, autoStyle, onOpenSettings, onBack, onHide, onToggle, onRefresh, onDesktop, loading, syncing }) {
      return h('div', {
        className: 'mub-head',
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
        onKeyDown,
        tabIndex: 0,
        role: 'button',
        'aria-label': t('dragHint'),
        title: t('dragHint'),
      },
        h('div', { className: 'mub-brand' }, ICON),
        h('div', { className: 'mub-headtext' },
          h('div', { className: 'mub-title' }, view === 'settings' ? t('settings') : t('title')),
          h('div', { className: 'mub-sub' },
            h('i', { className: `mub-live-dot ${loading ? 'mub-offline' : ''}` }),
            loading
              ? t('syncing')
              : view === 'settings'
                ? t('settingsSubtitle')
                : autoStyle
                  ? h(React.Fragment, null,
                    h('span', null, t('autoPhase')), ' · ',
                    h('b', { className: 'mub-phase-word' }, t(phaseKey(phase))),
                  )
                  : t('subtitle'),
          ),
        ),
        h('div', { className: 'mub-headactions' },
          view === 'board' ? h(IconButton, { label: t('desktopTitle'), onClick: onDesktop }, DESKTOP) : null,
          view === 'board' ? h(IconButton, { label: t('hideBoard'), onClick: onHide }, POWER) : null,
          view === 'board'
            ? h(IconButton, { label: t('settings'), onClick: onOpenSettings }, GEAR)
            : h(IconButton, { label: t('settingsBack'), onClick: onBack }, CHEVRON_LEFT),
          h(IconButton, { label: t('refresh'), onClick: onRefresh }, h('span', { className: syncing ? 'mub-spin-icon' : undefined }, REFRESH)),
          h(IconButton, { label: collapsed ? t('expand') : t('collapse'), onClick: onToggle }, CHEVRON_DOWN),
        ),
      )
    }

    function ModelDetail({ model, summary, t, loading, error, period, setPeriod, anchor, setAnchor, from, setFrom, to, setTo, onBack, onRefresh }) {
      const row = summary?.models?.[0] ?? {
        ...model, tokens: 0, calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
        cost: 0, listCost: 0, cashCost: 0, quota: null, price: null, billing: 'unpriced', official: false, estimated: false, calibrated: false,
      }
      const effectivePeriod = summary?.period?.kind ?? period
      const currency = summary?.currency ?? 'CNY'
      const badge = billingBadge(row, t)
      const quota = summary ? quotaDisplay(row, summary, t) : null
      const isCash = summary?.costBasis !== 'list'
      const mainIsReference = !isCash || (row.cashCost ?? 0) === 0
      const mainValue = mainIsReference ? (row.listCost ?? 0) : (row.cashCost ?? 0)
      const note = row.price?.note
      const quotaClass = quota?.ratio === undefined ? '' : quota.ratio >= 1 ? 'mub-over' : quota.ratio >= 0.8 ? 'mub-warn' : ''
      const recent = summary?.recent ?? []
      return h(React.Fragment, null,
        h('div', { className: 'mub-detail-head' },
          h('button', { type: 'button', className: 'mub-back', onClick: onBack, title: t('backToBoard'), 'aria-label': t('backToBoard') }, CHEVRON_LEFT),
          h(VendorIcon, { provider: model.provider, model: model.model, size: 28 }),
          h('div', { className: 'mub-detail-id' },
            h('div', { className: 'mub-detail-name' }, model.displayName || model.model),
            h('div', { className: 'mub-detail-sub' }, `${model.provider} · ${t('modelDetail')}`),
          ),
        ),
        h('div', { className: 'mub-toolbar' },
          h('div', { className: 'mub-tabs', role: 'tablist', 'aria-label': t('modelTrend') },
            ['day', 'week', 'month', 'quarter', 'year', 'custom'].map((kind) => h('button', {
              key: kind, type: 'button', role: 'tab', 'aria-selected': effectivePeriod === kind,
              className: `mub-tab ${effectivePeriod === kind ? 'mub-active' : ''}`,
              onClick: () => setPeriod(kind),
            }, t(`period.${kind}`))),
          ),
          h('div', { className: 'mub-nav' },
            h(IconButton, {
              label: t('prev'), disabled: !summary?.period?.prevAnchor,
              onClick: () => summary?.period?.prevAnchor && setAnchor(summary.period.prevAnchor),
            }, CHEVRON_LEFT),
            h(IconButton, {
              label: t('next'), disabled: !summary?.period?.nextAnchor || summary?.period?.isCurrent,
              onClick: () => summary?.period?.nextAnchor && !summary?.period?.isCurrent && setAnchor(summary.period.nextAnchor),
            }, CHEVRON_RIGHT),
            h('button', {
              type: 'button', className: 'mub-today', title: t('today'),
              onClick: () => {
                if (effectivePeriod === 'custom') setPeriod('day')
                setAnchor(null)
              },
            }, t('today')),
          ),
        ),
        h('div', { className: 'mub-subbar' },
          h('span', { className: 'mub-range' }, summary ? rangeLabel(summary.period, t) : t('loading')),
          h('span', { className: 'mub-detail-rangebadge' }, t('modelTrend')),
        ),
        effectivePeriod === 'custom' ? h('div', { className: 'mub-custom' },
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 10 } }, t('customFrom')),
          h('input', {
            type: 'date', className: 'mub-input', value: from ?? summary?.period?.startKey ?? '',
            onChange: event => setFrom(event.target.value),
          }),
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 10 } }, t('customTo')),
          h('input', {
            type: 'date', className: 'mub-input', value: to ?? addDaysKey(summary?.period?.endKey ?? '', -1),
            onChange: event => setTo(event.target.value),
          }),
        ) : null,
        h('div', { className: 'mub-scroll' },
          error ? h('div', { className: 'mub-banner' },
            h('span', null, `${t('error')}: ${error}`),
            h('button', { type: 'button', className: 'mub-linkbtn', onClick: onRefresh }, t('retry')),
          ) : null,
          loading && summary === null
            ? h('div', { className: 'mub-loading' }, h('span', { className: 'mub-spinner' }), t('loading'))
            : h(React.Fragment, null,
              h('div', { className: 'mub-hero' },
                h('div', { className: 'mub-hero-label' },
                  mainIsReference ? t('referenceEstimate') : t('actualCost'),
                  badge === null ? null : h('span', { className: badge.className, title: badge.title }, badge.text),
                ),
                h('div', { className: 'mub-hero-cost' }, fmtMoney(mainValue, currency)),
                mainIsReference && isCash && (row.cashCost ?? 0) > 0
                  ? h('div', { className: 'mub-hero-alt' }, h('span', { className: 'mub-badge' }, t('actualShort')), ` ${fmtMoney(row.cashCost, currency)}`)
                  : (!mainIsReference && summary?.totals?.listCost > summary?.totals?.cashCost + 0.005
                    ? h('div', { className: 'mub-hero-alt', title: t('referenceHint') },
                        h('span', { className: 'mub-badge' }, t('referenceEstimate')), ` ${fmtMoney(row.listCost, currency)}`)
                    : null),
                h('div', { className: 'mub-hero-meta' },
                  h('span', null, h('b', null, fmtTokens(row.tokens)), ` ${t('tokens')}`),
                  h('span', null, h('b', null, row.calls ?? 0), ` ${t('callUnit')}`),
                  h('span', null, `${t('cacheRead')} `, h('b', null, fmtTokens(row.cacheRead))),
                ),
                note ? h('div', { className: 'mub-note' }, `${t('platformCalibrated')} · ${note}`) : null,
                !note && row.billing === 'plan' ? h('div', { className: 'mub-note', style: { color: 'var(--dsw-alias-label-secondary)' } }, t('planHint')) : null,
                !note && row.billing === 'credits' ? h('div', { className: 'mub-note', style: { color: 'var(--dsw-alias-label-secondary)' } }, t('creditsHint')) : null,
              ),
              summary?.totals?.calls > 0
                ? h(TrendChart, {
                  summary, t,
                  costKey: mainIsReference ? 'listCost' : 'cost',
                  costUsdKey: mainIsReference ? 'listCostUsd' : 'costUsd',
                })
                : h('div', { className: 'mub-empty' }, h('b', null, t('noCalls')), t('customHint')),
              h('div', { className: 'mub-detail-grid' },
                h('span', null, t('input'), h('b', null, fmtTokens(row.input))),
                h('span', null, t('output'), h('b', null, fmtTokens(row.output))),
                h('span', null, t('cacheRead'), h('b', null, fmtTokens(row.cacheRead))),
                h('span', null, t('cacheWrite'), h('b', null, fmtTokens(row.cacheWrite))),
                h('span', null, t('calls'), h('b', null, row.calls ?? 0)),
                h('span', null, t('avgPerCall'), h('b', null, fmtTokens(row.calls > 0 ? row.tokens / row.calls : 0))),
                h('span', { className: 'mub-detail-wide' }, t('price'), h('b', null, fmtUnitPrice(row.price, t))),
                h('span', { className: 'mub-detail-wide' }, t('billing'), h('b', null, badge?.text ?? t('noPrice'))),
              ),
              quota !== null && quota.ratio !== undefined ? h('div', { className: 'mub-detail-quota' },
                h('div', { className: 'mub-quota-line' },
                  h('span', null, quota.label),
                  h('span', null,
                    `${quota.money ? fmtMoney(quota.used, currency) : fmtTokens(quota.used)} / ${quota.money ? fmtMoney(quota.limit, currency) : fmtTokens(quota.limit)} `,
                    h('b', null, fmtPct(quota.ratio)),
                  ),
                ),
                h('div', { className: 'mub-track' }, h('div', {
                  className: `mub-fill ${quotaClass}`,
                  style: { width: `${Math.min(100, Math.max(0, quota.ratio * 100))}%` },
                })),
              ) : null,
              h('div', { className: 'mub-section-title' }, t('recentCalls'), h('span')),
              h('div', { className: 'mub-recent' }, recent.length === 0
                ? h('div', { className: 'mub-empty' }, t('noCalls'))
                : recent.map((item) => {
                  const itemUsd = summary?.costBasis === 'cash' && (item.cashUsd ?? 0) === 0
                    ? (item.listUsd ?? item.costUsd)
                    : item.costUsd
                  return h('div', { className: 'mub-recent-row', key: `${item.at}-${item.model}` },
                    h('span', null, fmtTime(item.at, summary?.timezone ?? 'Asia/Shanghai')),
                    h('b', null, fmtTokens(item.tokens)),
                    h('span', null, fmtMoney(summary?.currency === 'CNY' ? itemUsd * summary.exchangeRate : itemUsd, currency)),
                  )
                })),
            ),
        ),
        h('div', { className: 'mub-foot' },
          h('span', null, `${t('updated')} ${fmtTime(summary?.models?.[0]?.lastAt ?? summary?.data?.lastAt, summary?.timezone ?? 'Asia/Shanghai')}`),
          h('button', { type: 'button', className: 'mub-linkbtn', onClick: onRefresh }, t('refresh')),
        ),
      )
    }

    const PHASES = [
      { id: 'day', from: 7, to: 12, range: '07–12' },
      { id: 'afternoon', from: 12, to: 17, range: '12–17' },
      { id: 'dusk', from: 17, to: 19, range: '17–19' },
      { id: 'night', from: 19, to: 29, range: '19–05' },
      { id: 'dawn', from: 5, to: 7, range: '05–07' },
    ]

    function phaseOfDate(date = new Date()) {
      const hour = date.getHours()
      if (hour >= 7 && hour < 12) return 'day'
      if (hour >= 12 && hour < 17) return 'afternoon'
      if (hour >= 17 && hour < 19) return 'dusk'
      if (hour >= 19 || hour < 5) return 'night'
      return 'dawn'
    }

    function skyPath(phase, date = new Date()) {
      let hour = date.getHours() + date.getMinutes() / 60
      if (phase === 'night' && hour < 5) hour += 24
      const span = PHASES.find(item => item.id === phase) || PHASES[0]
      const t = Math.max(0, Math.min(1, (hour - span.from) / Math.max(1e-6, span.to - span.from)))
      const mix = (from, to) => from + (to - from) * t
      if (phase === 'day') return { sunX: mix(58, 84), sunY: mix(40, 28), moonX: 82, moonY: 18 }
      if (phase === 'afternoon') return { sunX: mix(84, 70), sunY: mix(30, 46), moonX: 84, moonY: 20 }
      if (phase === 'dusk') return { sunX: mix(70, 58), sunY: mix(46, 52), moonX: 86, moonY: 20 }
      if (phase === 'night') return { sunX: 60, sunY: 64, moonX: mix(84, 74), moonY: mix(26, 22) }
      return { sunX: 60, sunY: 64, moonX: mix(78, 86), moonY: mix(24, 30) }
    }

    function phaseKey(phase) {
      return `phase${phase[0].toUpperCase()}${phase.slice(1)}`
    }

    function usePhase() {
      const [phase, setPhase] = useState(() => phaseOfDate())
      useEffect(() => {
        const update = () => setPhase(previous => {
          const next = phaseOfDate()
          return next === previous ? previous : next
        })
        const timer = setInterval(update, 15_000)
        window.addEventListener('focus', update)
        document.addEventListener('visibilitychange', update)
        return () => {
          clearInterval(timer)
          window.removeEventListener('focus', update)
          document.removeEventListener('visibilitychange', update)
        }
      }, [])
      return phase
    }

    const DRIFT_SEEDS = [
      { left: 5, delay: 0.2, duration: 15, size: 10, text: 'tok' },
      { left: 14, delay: 4.1, duration: 18, size: 9, text: 'cache' },
      { left: 23, delay: 8.2, duration: 16, size: 10, text: 'in' },
      { left: 31, delay: 2.7, duration: 20, size: 9, text: 'out' },
      { left: 39, delay: 11.5, duration: 17, size: 11, text: '1.2M' },
      { left: 47, delay: 6.3, duration: 19, size: 9, text: 'TPM' },
      { left: 55, delay: 1.1, duration: 14, size: 10, text: '¥' },
      { left: 63, delay: 9.4, duration: 21, size: 9, text: '$' },
      { left: 71, delay: 5.2, duration: 16, size: 9, text: 'API' },
      { left: 79, delay: 13.2, duration: 18, size: 10, text: 'tokens' },
      { left: 87, delay: 3.4, duration: 15, size: 9, text: 'CTX' },
      { left: 94, delay: 7.7, duration: 20, size: 10, text: 'tok' },
    ]

    function TimeScene({ phase }) {
      const [now, setNow] = useState(() => new Date())
      useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000)
        return () => clearInterval(timer)
      }, [])
      const sky = skyPath(phase, now)
      const nightHour = now.getHours()
      const eveningMoon = phase === 'night' && nightHour >= 19 && nightHour < 24
      return h('div', {
        className: 'mub-scene',
        'aria-hidden': true,
        style: {
          '--scene-sun-x': `${sky.sunX}%`,
          '--scene-sun-y': `${sky.sunY}%`,
          '--scene-moon-x': `${sky.moonX}%`,
          '--scene-moon-y': `${sky.moonY}%`,
          ...(phase === 'night' ? {
            '--scene-moon-opacity': eveningMoon ? '1' : '0',
            '--scene-galaxy-opacity': eveningMoon ? '.30' : '.52',
            '--scene-stars-opacity': eveningMoon ? '.62' : '.82',
            '--scene-meteor-opacity': eveningMoon ? '.30' : '.58',
          } : {}),
        },
      },
        h('i', { className: 'mub-scene-galaxy' }),
        h('i', { className: 'mub-scene-stars' }),
        h('i', { className: 'mub-meteor mub-meteor-one' }),
        h('i', { className: 'mub-meteor mub-meteor-two' }),
        h('i', { className: 'mub-meteor mub-meteor-three' }),
        h('i', { className: 'mub-meteor mub-meteor-four' }),
        h('i', { className: 'mub-scene-rays' }),
        h('i', { className: 'mub-scene-light' }),
        h('i', { className: 'mub-scene-sun' }),
        h('i', { className: 'mub-scene-moon' }),
        h('i', { className: 'mub-scene-cloud mub-cloud-one' }),
        h('i', { className: 'mub-scene-cloud mub-cloud-two' }),
        h('i', { className: 'mub-scene-cloud mub-cloud-three' }),
        h('i', { className: 'mub-scene-cloud mub-cloud-four' }),
        h('i', { className: 'mub-scene-cloud mub-cloud-five' }),
        h('i', { className: 'mub-scene-horizon' }),
        h('i', { className: 'mub-scene-haze' }),
        h('i', { className: 'mub-scene-vignette' }),
        h('i', { className: 'mub-scene-grain' }),
      )
    }

    function TokenDrift({ summary }) {
      const items = useMemo(() => {
        const total = fmtTokens(summary?.totals?.tokens ?? 0)
        return DRIFT_SEEDS.map((seed, index) => index === 4
          ? { ...seed, text: total }
          : seed)
      }, [summary?.totals?.tokens])
      return h('div', { className: 'mub-drift', 'aria-hidden': true },
        items.map((item, index) => h('span', {
          key: `${item.text}-${index}`,
          style: {
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}px`,
          },
        }, item.text)),
      )
    }

    function Board(props) {
      const {
        t, summary, settingsView, loading, syncing, error, period, setPeriod, anchor, setAnchor,
        from, setFrom, to, setTo, view, setView, scan, currency, setCurrency,
        onRefresh, onSave, saving, toast, onRescan, onResetPosition, onDesktop, onRetry,
        resetToken, selectedModel, modelSummary, modelLoading, modelError, onOpenModel, onCloseModel,
      } = props
      const [pos, setPos] = useState(() => ({
        x: Math.max(8, Math.min(window.innerWidth - 408 - 24, window.innerWidth - 8)),
        y: 84,
      }))
      const [collapsed, setCollapsed] = useState(false)
      const [settingsDirty, setSettingsDirty] = useState(false)
      const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
      const [dragging, setDragging] = useState(false)
      const initialized = useRef(false)
      const dragRef = useRef(null)
      const dragMoved = useRef(false)
      const posRef = useRef(pos)
      const saveTimer = useRef(null)
      const panelWidth = Math.min(408, viewport.w - 24)
      const pillWidth = Math.min(300, viewport.w - 16)
      const panelHeight = 640

      const clampPos = useCallback((x, y, width, height = panelHeight) => {
        const maxX = Math.max(8, viewport.w - width - 8)
        const maxY = Math.max(8, viewport.h - Math.min(height, viewport.h - 16) - 8)
        return { x: Math.max(8, Math.min(maxX, x)), y: Math.max(8, Math.min(maxY, y)) }
      }, [viewport])

      useEffect(() => {
        const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
      }, [])

      useEffect(() => {
        if (initialized.current) return
        const saved = settingsView?.settings?.position
        if (saved !== null && saved !== undefined) {
          initialized.current = true
          setCollapsed(saved.collapsed === true)
          const next = clampPos(saved.x, saved.y, saved.collapsed ? pillWidth : panelWidth, saved.collapsed ? 48 : 640)
          posRef.current = next
          setPos(next)
        } else if (settingsView !== null) {
          initialized.current = true
          const next = clampPos(viewport.w - panelWidth - 24, 84, panelWidth, 640)
          posRef.current = next
          setPos(next)
        }
      }, [settingsView, panelWidth, pillWidth, viewport, clampPos])

      useEffect(() => {
        setPos(current => {
          const next = clampPos(current.x, current.y, collapsed ? pillWidth : panelWidth, collapsed ? 48 : 640)
          posRef.current = next
          return next.x === current.x && next.y === current.y ? current : next
        })
      }, [collapsed, viewport, panelWidth, pillWidth, clampPos])

      useEffect(() => {
        if (!resetToken) return
        const next = clampPos(viewport.w - panelWidth - 24, 84, panelWidth, 640)
        setCollapsed(false)
        setPos(next)
        posRef.current = next
      }, [resetToken]) // eslint-disable-line react-hooks/exhaustive-deps

      const persistPosition = useCallback((next, collapsedOverride = collapsed) => {
        posRef.current = next
        if (saveTimer.current !== null) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
          saveTimer.current = null
          void apiPost(`${API}/settings`, { position: { ...next, collapsed: collapsedOverride } }).catch(() => {})
        }, 500)
      }, [collapsed])

      useEffect(() => () => { if (saveTimer.current !== null) clearTimeout(saveTimer.current) }, [])

      const onPointerDown = useCallback((event) => {
        if (event.button !== 0) return
        if (event.target.closest('button, a, input, select, summary')) return
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = { id: event.pointerId, sx: event.clientX, sy: event.clientY, x: pos.x, y: pos.y }
        dragMoved.current = false
        setDragging(true)
      }, [pos])

      const onPointerMove = useCallback((event) => {
        const drag = dragRef.current
        if (drag === null || drag.id !== event.pointerId) return
        const width = collapsed ? pillWidth : panelWidth
        const next = clampPos(
          drag.x + event.clientX - drag.sx,
          drag.y + event.clientY - drag.sy,
          width,
          collapsed ? 48 : 640,
        )
        if (Math.abs(event.clientX - drag.sx) + Math.abs(event.clientY - drag.sy) > 3) dragMoved.current = true
        posRef.current = next
        setPos(next)
      }, [collapsed, pillWidth, panelWidth, clampPos])

      const onPointerUp = useCallback(() => {
        if (dragRef.current === null) return
        dragRef.current = null
        setDragging(false)
        if (posRef.current !== null) persistPosition(posRef.current)
      }, [persistPosition])

      const onHeaderKeyDown = useCallback((event) => {
        const step = event.shiftKey ? 24 : 6
        const width = collapsed ? pillWidth : panelWidth
        let dx = 0
        let dy = 0
        if (event.key === 'ArrowLeft') dx = -step
        else if (event.key === 'ArrowRight') dx = step
        else if (event.key === 'ArrowUp') dy = -step
        else if (event.key === 'ArrowDown') dy = step
        else return
        event.preventDefault()
        setPos((current) => {
          const next = clampPos(current.x + dx, current.y + dy, width, collapsed ? 48 : 640)
          posRef.current = next
          persistPosition(next)
          return next
        })
      }, [collapsed, pillWidth, panelWidth, clampPos, persistPosition])

      const toggleCollapsed = useCallback(() => {
        setCollapsed((value) => {
          const next = !value
          if (posRef.current !== null) {
            const width = next ? pillWidth : panelWidth
            const clamped = clampPos(posRef.current.x, posRef.current.y, width, next ? 48 : 640)
            setPos(clamped)
            posRef.current = clamped
            persistPosition(clamped, next)
          }
          return next
        })
      }, [clampPos, pillWidth, panelWidth, persistPosition])

      const setBoardVisible = useCallback(async (visible) => {
        const ok = await onSave({ visible }, { silent: true })
        if (ok && visible) {
          setCollapsed(false)
          setView('board')
        }
      }, [onSave, setView])

      const openSettings = useCallback(() => {
        setSettingsDirty(false)
        setView('settings')
      }, [setView])

      const closeSettings = useCallback(() => {
        if (settingsDirty && !window.confirm(t('unsavedConfirm'))) return
        setSettingsDirty(false)
        setView('board')
      }, [settingsDirty, setView, t])

      const phase = usePhase()
      const rawStyle = settingsView?.settings?.visualStyle ?? 'auto'
      const visualStyle = rawStyle
      const boardVisible = settingsView?.settings?.visible !== false
      if (!boardVisible) {
        return h('div', { className: `mub-root mub-style-${visualStyle} mub-phase-${phase}`, style: { left: pos.x, top: pos.y } },
          h('style', null, CSS),
          h('button', {
            type: 'button', className: 'mub-launcher', title: t('launcher'), 'aria-label': t('launcher'),
            onClick: () => { void setBoardVisible(true) },
          }, ICON, h('i', { className: 'mub-live-dot' })),
        )
      }

      const header = h(PanelHeader, {
        collapsed, onPointerDown, onPointerMove, onPointerUp, onKeyDown: onHeaderKeyDown,
        t, view, phase, autoStyle: rawStyle === 'auto',
        onOpenSettings: openSettings, onBack: closeSettings, onHide: () => { void setBoardVisible(false) },
        onToggle: toggleCollapsed, onRefresh, onDesktop, loading, syncing,
      })

      if (collapsed) {
        return h('div', { className: `mub-root mub-style-${visualStyle} mub-phase-${phase}`, style: { left: pos.x, top: pos.y } },
          h('style', null, CSS),
          h('div', {
            className: 'mub-pill', role: 'button', tabIndex: 0,
            onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp,
            onKeyDown: onHeaderKeyDown,
            onClick: (event) => {
              if (!dragMoved.current && !event.target.closest('button')) toggleCollapsed()
            },
            title: t('dragHint'),
          },
            h('div', { className: 'mub-brand' }, ICON),
            h('span', null, t('today')),
            h('b', null, fmtTokens(summary?.today?.tokens ?? 0)),
            h('span', { className: 'mub-pill-cost' }, fmtMoney(summary?.today?.cost ?? 0, currency ?? summary?.currency ?? 'CNY')),
            rawStyle === 'auto' ? h('span', { className: 'mub-pill-phase' }, t(phaseKey(phase))) : null,
            h('i', { className: `mub-live-dot ${loading ? 'mub-offline' : ''}` }),
          ),
        )
      }

      const settings = settingsView
      const scanState = scan ?? summary?.scan ?? settings?.data?.scan
      const scanRunning = scanState?.running === true
      const activeCurrency = currency ?? summary?.currency ?? settings?.settings?.currency ?? 'CNY'
      const effectivePeriod = summary?.period?.kind ?? period

      return h('div', {
        className: `mub-root mub-style-${visualStyle} mub-phase-${phase}`, style: { left: pos.x, top: pos.y },
      },
        h('style', null, CSS),
        h('div', { className: 'mub-panel', style: { height: view === 'settings' ? 620 : 640 } },
          visualStyle === 'auto' ? h(TimeScene, { key: phase, phase }) : null,
          h('div', { className: 'mub-phase-layer', 'aria-hidden': true }),
          rawStyle === 'auto' ? h(TokenDrift, { summary }) : null,
          header,
          error ? h('div', { className: 'mub-banner' },
            h('span', null, `${t('error')}: ${error}`),
            h('button', { type: 'button', className: 'mub-linkbtn', onClick: onRetry }, t('retry')),
          ) : null,
          view === 'settings'
            ? h(SettingsView, {
              settingsView, summary, t, onSave, onRescan, onResetPosition, saving, scan: scanState,
              dirty: settingsDirty, setDirty: setSettingsDirty, phase,
            })
            : selectedModel !== null
              ? h(ModelDetail, {
                model: selectedModel, summary: modelSummary, t,
                loading: modelLoading, error: modelError,
                period, setPeriod, anchor, setAnchor, from, setFrom, to, setTo,
                onBack: onCloseModel, onRefresh,
              })
              : h(React.Fragment, null,
              h('div', { className: 'mub-toolbar' },
                h('div', { className: 'mub-tabs', role: 'tablist', 'aria-label': t('trend') },
                  ['day', 'week', 'month', 'quarter', 'year', 'custom'].map((kind) => h('button', {
                    key: kind, type: 'button', role: 'tab', 'aria-selected': effectivePeriod === kind,
                    className: `mub-tab ${effectivePeriod === kind ? 'mub-active' : ''}`,
                    onClick: () => setPeriod(kind),
                  }, t(`period.${kind}`))),
                ),
                h('div', { className: 'mub-nav' },
                  h(IconButton, {
                    label: t('prev'), disabled: !summary?.period?.prevAnchor,
                    onClick: () => summary?.period?.prevAnchor && setAnchor(summary.period.prevAnchor),
                  }, CHEVRON_LEFT),
                  h(IconButton, {
                    label: t('next'), disabled: !summary?.period?.nextAnchor || summary?.period?.isCurrent,
                    onClick: () => summary?.period?.nextAnchor && !summary?.period?.isCurrent && setAnchor(summary.period.nextAnchor),
                  }, CHEVRON_RIGHT),
                  h('button', {
                    type: 'button', className: 'mub-today', title: t('today'),
                    onClick: () => {
                      if (effectivePeriod === 'custom') setPeriod('day')
                      setAnchor(null)
                    },
                  }, t('today')),
                ),
              ),
              h('div', { className: 'mub-subbar' },
                h('span', { className: 'mub-range' }, summary ? rangeLabel(summary.period, t) : t('loading')),
                h('div', { className: 'mub-currency', role: 'group', 'aria-label': t('toggleCurrency') },
                  h('button', {
                    type: 'button', className: `mub-curbtn ${activeCurrency === 'CNY' ? 'mub-active' : ''}`,
                    onClick: () => { setCurrency('CNY'); void onSave({ currency: 'CNY' }, { silent: true }) },
                  }, '¥'),
                  h('button', {
                    type: 'button', className: `mub-curbtn ${activeCurrency === 'USD' ? 'mub-active' : ''}`,
                    onClick: () => { setCurrency('USD'); void onSave({ currency: 'USD' }, { silent: true }) },
                  }, '$'),
                ),
                scanRunning ? h('span', { className: 'mub-badge mub-warn' }, `${t('scanningCount')} ${scanState?.done ?? 0}/${scanState?.total ?? 0}`) : null,
              ),
              effectivePeriod === 'custom' ? h('div', { className: 'mub-custom' },
                h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 10 } }, t('customFrom')),
                h('input', {
                  type: 'date', className: 'mub-input', value: from ?? summary?.period?.startKey ?? '',
                  onChange: event => setFrom(event.target.value),
                }),
                h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 10 } }, t('customTo')),
                h('input', {
                  type: 'date', className: 'mub-input', value: to ?? addDaysKey(summary?.period?.endKey ?? '', -1),
                  onChange: event => setTo(event.target.value),
                }),
              ) : null,
              h('div', { className: 'mub-scroll' },
                summary === null
                  ? h('div', { className: 'mub-loading' }, h('span', { className: 'mub-spinner' }), t('loading'))
                  : h(React.Fragment, null,
                    h('div', { className: 'mub-hero' },
                      h('div', { className: 'mub-hero-label', title: t('totalSpendHint') },
                        t('totalSpend'),
                        summary.totals.officialCalls > 0 ? h('span', { className: 'mub-badge' }, t('officialPrice')) : null,
                        summary.costBasis === 'list' && summary.totals.estimatedCalls > 0 ? h('span', { className: 'mub-badge' }, t('includesFamilyEstimate')) : null,
                      ),
                      h('div', { className: 'mub-hero-cost' }, fmtMoney(
                        summary.totals.totalSpend ?? summary.totals.listCost,
                        summary.currency,
                      )),
                      h('div', { className: 'mub-actual-line', title: t('totalSpendHint') },
                        h('span', { className: 'mub-actual-label' }, t('actualCost')),
                        h('b', null, fmtMoney(summary.totals.cashCost, summary.currency)),
                        h('span', { className: 'mub-actual-sep' }, '·'),
                        h('span', null, `${t('otherCost')} ${fmtMoney(summary.totals.otherCost ?? 0, summary.currency)}`),
                      ),
                      h('div', { className: 'mub-hero-meta' },
                        h('span', null, h('b', null, fmtTokens(summary.totals.tokens)), ` ${t('tokens')}`),
                        h('span', null, h('b', null, summary.totals.calls), ` ${t('callUnit')}`),
                        h('span', null, h('b', null, summary.models.length), ` ${t('modelCount')}`),
                        summary.totals.cacheRead > 0 ? h('span', null, `${t('cacheRead')} `, h('b', null, fmtTokens(summary.totals.cacheRead))) : null,
                      ),
                      h('div', {
                        className: 'mub-note', style: { color: 'var(--dsw-alias-label-secondary)' },
                        title: [
                          summary.costBasis === 'cash' ? t('cashHint') : t('listHint'),
                          summary.totals.officialCalls > 0 ? t('officialHint') : '',
                          summary.costBasis === 'list' && summary.totals.estimatedCalls > 0 ? t('estimatedHint') : '',
                        ].filter(Boolean).join(' '),
                      }, summary.costBasis === 'cash' ? t('cashHint') : t('listHint')),
                      summary.totals.unpricedCalls > 0 ? h('div', { className: 'mub-note' }, t('unpricedHint')) : null,
                    ),
                    summary.totals.calls === 0
                      ? h('div', { className: 'mub-empty' }, h('b', null, t('noData')), t('customHint'))
                      : h(TrendChart, { summary, t }),
                    h('div', { className: 'mub-section-title' }, t('modelTable'), h('span'), t('costLabel')),
                    h(ModelList, { summary, t, onOpenModel }),
                  ),
              ),
              h('div', { className: 'mub-foot' },
                h('span', null,
                  `${scanRunning ? t('syncing') : t('synced')} · ${summary?.data?.records ?? 0} ${t('records')} · ${t('updated')} ${fmtTime(summary?.data?.lastAt, summary?.timezone ?? 'Asia/Shanghai')}`,
                ),
                h('button', { type: 'button', className: 'mub-linkbtn', onClick: onRefresh }, t('refresh')),
              ),
            ),
          toast ? h('div', { className: 'mub-toast' }, toast) : null,
        ),
      )
    }

    function App(props) {
      const t = typeof props.t === 'function' ? props.t : fallbackT
      const [summary, setSummary] = useState(null)
      const [selectedModel, setSelectedModel] = useState(null)
      const [modelSummary, setModelSummary] = useState(null)
      const [modelLoading, setModelLoading] = useState(false)
      const [modelError, setModelError] = useState(null)
      const [settingsView, setSettingsView] = useState(null)
      const [period, setPeriod] = useState('day')
      const [anchor, setAnchor] = useState(null)
      const [from, setFrom] = useState(null)
      const [to, setTo] = useState(null)
      const [currency, setCurrency] = useState(null)
      const [view, setView] = useState('board')
      const [loading, setLoading] = useState(true)
      const [syncing, setSyncing] = useState(false)
      const [error, setError] = useState(null)
      const [scan, setScan] = useState(null)
      const [refreshTick, setRefreshTick] = useState(0)
      const [saving, setSaving] = useState(false)
      const [toast, setToast] = useState('')
      const [resetToken, setResetToken] = useState(0)
      const toastTimer = useRef(null)
      const refresh = useDebouncedRefresh(setRefreshTick)

      const showToast = useCallback((text) => {
        setToast(text)
        if (toastTimer.current !== null) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => { toastTimer.current = null; setToast('') }, 2400)
      }, [])
      useEffect(() => () => { if (toastTimer.current !== null) clearTimeout(toastTimer.current) }, [])

      const loadSettings = useCallback(async (signal) => {
        try {
          const data = await apiGet(`${API}/settings`, signal)
          setSettingsView(data)
          if (data?.settings?.currency && currency === null) setCurrency(data.settings.currency)
          if (data?.data?.scan) setScan(data.data.scan)
        } catch (err) {
          if (err?.name !== 'AbortError') setError(err?.message ?? String(err))
        }
      }, [currency])

      useEffect(() => {
        const controller = new AbortController()
        void loadSettings(controller.signal)
        return () => controller.abort()
      }, []) // eslint-disable-line react-hooks/exhaustive-deps

      useEffect(() => {
        if (view === 'settings') {
          const controller = new AbortController()
          void loadSettings(controller.signal)
          return () => controller.abort()
        }
        return undefined
      }, [view, loadSettings])

      useEffect(() => {
        const controller = new AbortController()
        let alive = true
        setError(null)
        if (summary === null) setLoading(true)
        setSyncing(true)
        const params = new URLSearchParams({ period })
        if (anchor !== null) params.set('anchor', anchor)
        if (period === 'custom') {
          if (from) params.set('from', from)
          if (to) params.set('to', to)
        }
        if (currency) params.set('currency', currency)
        void apiGet(`${API}/summary?${params.toString()}`, controller.signal)
          .then((data) => {
            if (!alive) return
            setSummary(data)
            setScan(data.scan)
            if (period === 'custom' && from === null && to === null) {
              setFrom(data.period.startKey)
              setTo(addDaysKey(data.period.endKey, -1))
            }
          })
          .catch((err) => {
            if (!alive || err?.name === 'AbortError') return
            setError(err?.message ?? String(err))
          })
          .finally(() => {
            if (alive) {
              setLoading(false)
              setSyncing(false)
            }
          })
        return () => { alive = false; controller.abort() }
      }, [period, anchor, from, to, currency, refreshTick])

      useEffect(() => {
        if (selectedModel === null) {
          setModelSummary(null)
          setModelError(null)
          setModelLoading(false)
          return undefined
        }
        const controller = new AbortController()
        let alive = true
        setModelLoading(true)
        setModelError(null)
        const params = new URLSearchParams({ period })
        if (anchor !== null) params.set('anchor', anchor)
        if (period === 'custom') {
          if (from) params.set('from', from)
          if (to) params.set('to', to)
        }
        if (currency) params.set('currency', currency)
        params.set('model', selectedModel.key)
        void apiGet(`${API}/summary?${params.toString()}`, controller.signal)
          .then((data) => { if (alive) setModelSummary(data) })
          .catch((err) => {
            if (alive && err?.name !== 'AbortError') setModelError(err?.message ?? String(err))
          })
          .finally(() => { if (alive) setModelLoading(false) })
        return () => { alive = false; controller.abort() }
      }, [selectedModel?.key, period, anchor, from, to, currency, refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

      useEffect(() => {
        const seconds = Number(settingsView?.settings?.refreshSeconds) || 5
        const timer = setInterval(() => setRefreshTick(v => v + 1), Math.max(2, seconds) * 1000)
        return () => clearInterval(timer)
      }, [settingsView?.settings?.refreshSeconds])

      useEffect(() => {
        let stopped = false
        let controller = null
        let retryTimer = null
        let changeTimer = null
        const connect = async () => {
          if (stopped) return
          controller = new AbortController()
          try {
            const res = await fetch(`${API}/stream`, {
              headers: { Accept: 'text/event-stream' },
              cache: 'no-store',
              signal: controller.signal,
            })
            if (!res.ok || res.body === null) throw new Error(`HTTP ${res.status}`)
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            for (;;) {
              const { value, done } = await reader.read()
              if (done) break
              buffer += decoder.decode(value, { stream: true })
              let split = buffer.indexOf('\n\n')
              while (split >= 0) {
                const block = buffer.slice(0, split)
                buffer = buffer.slice(split + 2)
                let event = 'message'
                const dataLines = []
                for (const line of block.split('\n')) {
                  if (line.startsWith('event:')) event = line.slice(6).trim()
                  else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
                }
                if (dataLines.length > 0) {
                  let payload = null
                  try { payload = JSON.parse(dataLines.join('\n')) } catch { payload = null }
                  if (event === 'scan' && payload) setScan(payload)
                  if (event === 'hello' && payload?.scan) setScan(payload.scan)
                  if (event === 'change') {
                    if (changeTimer !== null) clearTimeout(changeTimer)
                    changeTimer = setTimeout(() => { changeTimer = null; setRefreshTick(v => v + 1) }, 250)
                  }
                  if (event === 'settings' && payload) {
                    setSettingsView(prev => prev ? { ...prev, settings: payload } : prev)
                  }
                }
                split = buffer.indexOf('\n\n')
              }
            }
          } catch (err) {
            if (stopped || err?.name === 'AbortError') return
          }
          if (!stopped) {
            retryTimer = setTimeout(connect, 3000)
          }
        }
        void connect()
        return () => {
          stopped = true
          if (retryTimer !== null) clearTimeout(retryTimer)
          if (changeTimer !== null) clearTimeout(changeTimer)
          controller?.abort()
        }
      }, [])

      const onSave = useCallback(async (patch, options = {}) => {
        setSaving(true)
        try {
          const data = await apiPost(`${API}/settings`, patch)
          setSettingsView(prev => prev ? { ...prev, settings: data.settings } : prev)
          if (data.settings?.currency) setCurrency(data.settings.currency)
          if (!options.silent) {
            showToast(t('settingsSaved'))
            setRefreshTick(v => v + 1)
            void apiGet(`${API}/settings`).then(setSettingsView).catch(() => {})
          }
          return true
        } catch (err) {
          showToast(`${t('settingsSaveFailed')}: ${err?.message ?? String(err)}`)
          return false
        } finally {
          setSaving(false)
        }
      }, [showToast, t])

      const onRescan = useCallback(async () => {
        try {
          await apiPost(`${API}/rescan`, {})
          setScan(prev => ({ ...(prev ?? {}), running: true, done: 0, total: 0 }))
          showToast(t('rescanning'))
        } catch (err) {
          showToast(`${t('scanFailed')}: ${err?.message ?? String(err)}`)
        }
      }, [showToast, t])

      const onResetPosition = useCallback(() => {
        const width = Math.min(408, window.innerWidth - 24)
        void apiPost(`${API}/settings`, { position: { x: window.innerWidth - width - 24, y: 84, collapsed: false } }).catch(() => {})
        setResetToken(v => v + 1)
        showToast(t('resetPosition'))
      }, [showToast, t])

      const onDesktop = useCallback(async () => {
        const theme = document.documentElement.dataset.dsThemeSource
          ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        const targetFrom = from ?? summary?.period?.startKey ?? ''
        const targetTo = to ?? (summary?.period ? addDaysKey(summary.period.endKey, -1) : '')
        const style = settingsView?.settings?.visualStyle ?? 'auto'
        const x = Math.round((window.screenX ?? 0) + Math.max(0, (window.outerWidth ?? 0) - 470))
        const y = Math.round((window.screenY ?? 0) + 64)
        try {
          await apiPost(`${API}/floating-window`, {
            theme,
            style,
            period,
            anchor: summary?.period?.startKey ?? '',
            from: targetFrom,
            to: targetTo,
            x,
            y,
          })
          showToast(t('desktopOpened'))
        } catch {
          showToast(t('desktopFailed'))
        }
      }, [period, from, to, summary?.period?.startKey, summary?.period?.endKey, settingsView?.settings?.visualStyle, showToast, t])

      const onOpenModel = useCallback((row) => {
        setSelectedModel({
          key: row.key,
          provider: row.provider,
          model: row.model,
          displayName: row.displayName || row.model,
        })
        setModelSummary(null)
        setModelError(null)
        setView('board')
      }, [])

      const onCloseModel = useCallback(() => {
        setSelectedModel(null)
        setModelSummary(null)
        setModelError(null)
      }, [])

      const activePeriod = summary?.period?.kind ?? period
      return h(Board, {
        t, summary, settingsView, loading, syncing, error,
        period: activePeriod, setPeriod: (kind) => {
          setPeriod(kind)
          if (kind === 'custom' && (from === null || to === null)) {
            const today = summary?.period?.todayKey
            setFrom(today ? addDaysKey(today, -29) : null)
            setTo(today ?? null)
          }
        },
        anchor, setAnchor, from, setFrom, to, setTo, view, setView, scan,
        currency, setCurrency, onRefresh: () => setRefreshTick(v => v + 1),
        onSave, saving, toast, onRescan, onResetPosition, onDesktop, resetToken,
        selectedModel, modelSummary, modelLoading, modelError, onOpenModel, onCloseModel,
        onRetry: () => setRefreshTick(v => v + 1),
      })
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'model-usage-board: dictionaries')
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'model-usage-board',
          order: 40,
          locale: NS,
        }, App))
      },
    }
  },
})
