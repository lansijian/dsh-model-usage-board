/**
 * A dependency-free standalone page for the separate desktop window. It talks
 * to the same same-origin API as the in-app board, so the popup needs no boot
 * payload, token, or client bundle.
 */

export function widgetHtml({ theme = 'light', title = '模型用量 · Model usage' } = {}) {
  const safeTitle = String(title).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
  return `<!doctype html>
<html lang="zh-CN" data-theme="${theme === 'dark' ? 'dark' : 'light'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${safeTitle}</title>
<style>
  :root {
    --bg: #f6f8fa; --panel: #ffffff; --text: #1f2328; --muted: #656d76;
    --border: #d0d7de; --soft: #eaeef2; --brand: #0969da; --good: #1a7f37;
    --warn: #9a6700; --bad: #cf222e; --shadow: rgba(31,35,40,.12);
  }
  html[data-theme="dark"] {
    --bg: #0d1117; --panel: #161b22; --text: #e6edf3; --muted: #8b949e;
    --border: #30363d; --soft: #21262d; --brand: #4493f8; --good: #3fb950;
    --warn: #d29922; --bad: #f85149; --shadow: rgba(1,4,9,.5);
  }
  html[data-style="cyber"] {
    --bg: #040b16; --panel: #081525; --text: #e8f7ff; --muted: #8da8bb;
    --border: rgba(120,220,255,.18); --soft: rgba(69,243,255,.08); --brand: #45f3ff;
    --good: #46ff9f; --warn: #ffd166; --bad: #ff5b7f; --shadow: rgba(0,0,0,.5);
  }
  html[data-style="cyber"] body { background: var(--bg); }
  html[data-style="cyber"] .app::before { background-image: linear-gradient(rgba(69,243,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(69,243,255,.06) 1px, transparent 1px); background-size: 22px 22px; }
  html[data-style="matrix"] {
    --bg: #031008; --panel: #061b0e; --text: #d8ffe8; --muted: #79b692;
    --border: rgba(70,255,159,.18); --soft: rgba(70,255,159,.08); --brand: #46ff9f;
    --good: #46ff9f; --warn: #d6ff72; --bad: #ff6b6b; --shadow: rgba(0,0,0,.55);
  }
  html[data-style="matrix"] body { background: var(--bg); font-family: "Cascadia Code", "Consolas", "Microsoft YaHei", monospace; }
  html[data-style="matrix"] .app::before { background-image: linear-gradient(rgba(70,255,159,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(70,255,159,.055) 1px, transparent 1px); background-size: 18px 18px; }
  html[data-style="aurora"] {
    --bg: #080a18; --panel: #0e1226; --text: #f0eaff; --muted: #a99bc9;
    --border: rgba(199,166,255,.20); --soft: rgba(199,166,255,.09); --brand: #c7a6ff;
    --good: #5ef1d4; --warn: #ffd166; --bad: #ff6b9a; --shadow: rgba(0,0,0,.5);
  }
  html[data-style="aurora"] body { background: radial-gradient(120% 80% at 10% 0%, rgba(111,70,255,.24), transparent 58%), var(--bg); }
  html[data-style="prism"] {
    --bg: #0c0818; --panel: #120d22; --text: #f4efff; --muted: #b8a9cc;
    --border: rgba(255,255,255,.16); --soft: rgba(255,255,255,.07); --brand: #ff9ad8;
    --good: #5ef1d4; --warn: #ffd166; --bad: #ff6b9a; --shadow: rgba(0,0,0,.55);
  }
  html[data-style="prism"] body { background: var(--bg); }
  html[data-style="prism"] .app::before { background: linear-gradient(120deg, rgba(255,95,158,.18), rgba(90,169,255,.14) 42%, rgba(94,241,212,.12)); }
  html[data-style="prism"] .app { box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
  html[data-style="auto"] { --bg:#fbf8f1; --panel:#fffaf0; --text:#1b2a3a; --muted:#60758c; --border:rgba(35,70,105,.16); --soft:rgba(43,92,145,.07); --brand:#2f7cf6; --good:#1a7f37; --warn:#9a6700; --bad:#cf222e; --shadow:rgba(30,64,110,.16); }
  html[data-style="auto"] body { background: var(--bg); }
  html[data-style="auto"] .app::before { background: linear-gradient(120deg, rgba(255,196,120,.10), transparent 36%, rgba(100,175,255,.10)); }
  html[data-style="auto"][data-phase="afternoon"] { --bg:#fff8ed; --panel:#fffaf2; --text:#2c2117; --muted:#7b6752; --border:rgba(120,85,45,.18); --soft:rgba(160,105,40,.08); --brand:#b06b24; --shadow:rgba(90,55,10,.14); }
  html[data-style="auto"][data-phase="dusk"] { --bg:#1a1020; --panel:#241426; --text:#fff3ef; --muted:#d6b6c2; --border:rgba(255,170,145,.20); --soft:rgba(255,170,145,.09); --brand:#ff9d7a; --good:#7fe3b0; --warn:#ffd166; --bad:#ff6b9a; --shadow:rgba(20,6,24,.5); }
  html[data-style="auto"][data-phase="night"] { --bg:#07101f; --panel:#0b1730; --text:#eaf1ff; --muted:#9db1cc; --border:rgba(138,180,255,.16); --soft:rgba(138,180,255,.08); --brand:#8ab4ff; --good:#7fe3b0; --warn:#ffd166; --bad:#ff6b9a; --shadow:rgba(0,4,14,.55); }
  html[data-style="auto"][data-phase="dawn"] { --bg:#031018; --panel:#061a20; --text:#e6fbf8; --muted:#8fa8ad; --border:rgba(125,227,212,.14); --soft:rgba(125,227,212,.065); --brand:#7de3d4; --good:#7fe3b0; --warn:#ffd166; --bad:#ff6b9a; --shadow:rgba(0,6,10,.6); }
  html[data-style="auto"][data-phase="day"] { --bg:#fbf8f1; --panel:#fffaf0; --text:#1b2a3a; --muted:#60758c; --border:rgba(35,70,105,.16); --soft:rgba(43,92,145,.07); --brand:#2f7cf6; }
  html[data-phase="morning"] { --phase-1: rgba(255,183,112,.24); --phase-2: rgba(120,203,255,.14); }
  html[data-phase="noon"] { --phase-1: rgba(74,194,255,.22); --phase-2: rgba(90,255,218,.13); }
  html[data-phase="evening"] { --phase-1: rgba(255,111,168,.25); --phase-2: rgba(174,96,255,.16); }
  html[data-phase="night"] { --phase-1: rgba(78,116,255,.21); --phase-2: rgba(150,102,255,.14); }
  html[data-phase] body { background: radial-gradient(100% 65% at 8% 0%, var(--phase-1), transparent 62%), radial-gradient(80% 55% at 100% 4%, var(--phase-2), transparent 62%), var(--bg); }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0; color: var(--text); background: var(--bg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
    font-size: 12px; line-height: 1.4; overflow: hidden;
  }
  .app { position: relative; height: 100%; display: flex; flex-direction: column; box-shadow: inset 0 0 0 1px rgba(255,255,255,.05); }
  .app::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0; background: linear-gradient(118deg, rgba(255,255,255,.09) 0%, rgba(255,255,255,.02) 22%, transparent 44%, transparent 66%, rgba(255,255,255,.035) 84%, rgba(255,255,255,.07) 100%); mix-blend-mode: screen; }
  .app > * { position: relative; z-index: 1; }
  .drift { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .drift span { position: absolute; bottom: -16px; color: var(--brand); font-size: 9px; font-weight: 600; letter-spacing: .04em; opacity: 0; animation: token-float linear infinite; }
  @keyframes token-float { 0% { transform: translateY(0) scale(.92); opacity: 0; } 14% { opacity: .26; } 100% { transform: translateY(-740px) scale(1.05); opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .drift span { animation: none; opacity: .1; } }
  .head {
    display: flex; align-items: center; gap: 8px; padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--panel) 88%, transparent);
    backdrop-filter: blur(18px) saturate(140%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.18);
    flex: none;
  }
  .logo {
    width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center;
    background: color-mix(in srgb, var(--brand) 16%, transparent); color: var(--brand);
  }
  .logo svg { width: 17px; height: 17px; }
  .headtext { flex: 1; min-width: 0; }
  .title { font-size: 13px; font-weight: 650; }
  .sub { font-size: 10px; color: var(--muted); display: flex; align-items: center; gap: 4px; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--good); display: inline-block; }
  .dot.off { background: var(--muted); }
  button {
    appearance: none; border: 0; background: transparent; color: var(--muted);
    font: inherit; cursor: pointer; border-radius: 6px; padding: 4px 6px;
  }
  button:hover { background: var(--soft); color: var(--text); }
  html[data-native] .head { cursor: grab; }
  html[data-native] .head:active { cursor: grabbing; }
  html[data-native] .app { border-radius: 14px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); }
  #native-close { width: 24px; height: 24px; padding: 0; font-size: 16px; line-height: 1; flex: none; }
  #native-close:hover { color: var(--bad); }
  .tabs { display: flex; gap: 2px; padding: 8px 12px 0; flex: none; }
  .tab {
    flex: 1; background: var(--soft); color: var(--muted); font-size: 11px;
    padding: 5px 0; border-radius: 6px;
  }
  .tab.active { background: var(--panel); color: var(--text); font-weight: 650; box-shadow: 0 1px 3px var(--shadow); }
  .custom { display: flex; align-items: center; gap: 5px; padding: 7px 12px 0; color: var(--muted); font-size: 10px; flex: none; }
  .custom[hidden] { display: none; }
  .custom input { flex: 1; min-width: 0; background: var(--soft); border: 1px solid var(--border); color: var(--text); border-radius: 6px; font: inherit; font-size: 10px; padding: 3px 5px; }
  .subbar { display: flex; align-items: center; gap: 6px; padding: 6px 12px 8px; color: var(--muted); font-size: 10px; flex: none; }
  .range { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .main { flex: 1; min-height: 0; overflow: auto; }
  .hero { padding: 4px 14px 6px; }
  .hero-label { color: var(--muted); font-size: 10px; }
  .cost { font-size: 28px; font-weight: 700; letter-spacing: -.02em; line-height: 1.15; font-variant-numeric: tabular-nums; }
  .alt { color: var(--muted); font-size: 10px; margin-top: 1px; font-variant-numeric: tabular-nums; }
  .alt .badge { margin-right: 3px; }
  .total { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-size: 10px; margin-top: 3px; padding: 2px 5px; border: 1px solid var(--border); border-radius: 5px; background: var(--soft); }
  .total b { color: var(--text); font-size: 11px; font-weight: 650; }
  .total small { color: var(--muted); font-size: 8px; }
  .mref { color: var(--muted); font-size: 9px; margin-top: 1px; }
  .meta { display: flex; flex-wrap: wrap; gap: 3px 12px; color: var(--muted); font-size: 10px; margin-top: 2px; }
  .meta b { color: var(--text); font-weight: 600; }
  .warn { color: var(--warn); font-size: 10px; margin-top: 4px; }
  .chart { padding: 6px 14px 9px; border-bottom: 1px solid var(--border); }
  .chart-head { display: flex; gap: 8px; color: var(--muted); font-size: 10px; }
  .chart-head .readout { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .legend { display: flex; gap: 8px; flex: none; }
  .legend i { width: 6px; height: 6px; border-radius: 2px; display: inline-block; margin-right: 3px; background: color-mix(in srgb, var(--brand) 50%, transparent); vertical-align: 1px; }
  .legend .ln { width: 10px; height: 0; border-top: 1.5px solid var(--brand); border-radius: 0; background: transparent; }
  .plot { position: relative; height: 112px; margin-top: 7px; }
  .bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 2px; }
  .slot { flex: 1; height: 100%; display: flex; align-items: flex-end; min-width: 0; }
  .bar { width: 100%; border-radius: 2px 2px 0 0; background: color-mix(in srgb, var(--brand) 48%, transparent); transition: background .12s; }
  .slot:hover .bar { background: var(--brand); }
  .line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
  .axis { position: relative; height: 12px; margin-top: 3px; }
  .axis div { position: absolute; top: 0; transform: translateX(-50%); color: var(--muted); font-size: 9px; white-space: nowrap; }
  .section { padding: 9px 14px 6px; color: var(--muted); font-size: 10px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; display: flex; gap: 6px; }
  .section span { flex: 1; }
  .models { padding: 0 14px 12px; }
  .model { border-top: 1px solid var(--border); padding: 8px 0 7px; }
  .model:first-child { border-top: 0; }
  .row { display: flex; align-items: center; gap: 8px; }
  .model-main { flex: 1; min-width: 0; }
  .model-name { display: flex; align-items: center; gap: 5px; min-width: 0; }
  .color { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--brand); }
  .vicon { width: 17px; height: 17px; border-radius: 5px; flex: none; display: inline-grid; place-items: center; background: rgba(255,255,255,.06); box-shadow: inset 0 1px 0 rgba(255,255,255,.24), 0 1px 3px rgba(0,0,0,.28); overflow: hidden; }
  .vicon img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .vicon-mono { color: #fff; font-size: 7px; font-weight: 750; line-height: 1; text-shadow: 0 1px 1px rgba(0,0,0,.25); }
  .name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .provider { color: var(--muted); font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .badge { font-size: 9px; color: var(--muted); border: 1px solid var(--border); border-radius: 4px; padding: 1px 4px; flex: none; }
  .badge.warn { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 35%, transparent); }
  .num { text-align: right; flex: none; font-variant-numeric: tabular-nums; }
  .mcost { font-weight: 650; }
  .mtok { color: var(--muted); font-size: 9px; }
  .quota { margin-top: 5px; }
  .qline { display: flex; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 9px; }
  .qline b { color: var(--text); }
  .track { height: 3px; background: var(--soft); border-radius: 999px; overflow: hidden; margin-top: 3px; }
  .fill { height: 100%; border-radius: 999px; background: var(--brand); }
  .fill.warn { background: var(--warn); }
  .fill.over { background: var(--bad); }
  .empty { padding: 28px 16px; text-align: center; color: var(--muted); }
  .empty b { display: block; color: var(--text); margin-bottom: 3px; }
  .foot { padding: 7px 12px; border-top: 1px solid var(--border); color: var(--muted); font-size: 9px; display: flex; gap: 8px; flex: none; }
  .foot span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .foot a, .foot button { color: var(--brand); text-decoration: none; }
  .foot button { padding: 0; font-size: 9px; }
  .error { color: var(--bad); }
</style>
</head>
<body>
<div class="app">
  <div class="drift" id="drift" aria-hidden="true"></div>
  <div class="head">
    <div class="logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M4 19V9M10 19V5M16 19v-7M22 19V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
    <div class="headtext">
      <div class="title" id="title">模型用量 · Model usage</div>
      <div class="sub"><i class="dot" id="live"></i><span id="status">读取中…</span></div>
    </div>
    <button id="refresh" title="刷新 / Refresh" aria-label="刷新">↻</button>
    <button id="theme" title="明暗 / Theme" aria-label="主题">◐</button>
  </div>
  <div class="tabs" id="tabs">
    <button class="tab active" data-period="day">日</button>
    <button class="tab" data-period="week">周</button>
    <button class="tab" data-period="month">月</button>
    <button class="tab" data-period="quarter">季</button>
    <button class="tab" data-period="year">年</button>
    <button class="tab" data-period="custom">自定义</button>
  </div>
  <div class="custom" id="custom" hidden>
    <span id="fromlabel">开始</span>
    <input type="date" id="from">
    <span id="tolabel">结束</span>
    <input type="date" id="to">
  </div>
  <div class="subbar">
    <button id="prev" title="上一周期" aria-label="上一周期">‹</button>
    <div class="range" id="range">—</div>
    <button id="next" title="下一周期" aria-label="下一周期">›</button>
  </div>
  <div class="main">
    <div class="hero">
      <div class="hero-label" id="costlabel">总费用 · Total cost</div>
      <div class="cost" id="cost">—</div>
      <div class="alt" id="alt"></div>
      <div class="total" id="total"></div>
      <div class="meta" id="meta"></div>
      <div id="notes"></div>
    </div>
    <div class="chart">
      <div class="chart-head">
        <div class="readout" id="readout">趋势</div>
        <div class="legend"><span><i></i>Token</span><span><i class="ln"></i>费用</span></div>
      </div>
      <div class="plot">
        <div class="bars" id="bars"></div>
        <svg class="line" id="line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline id="points" fill="none" stroke="var(--brand)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="axis" id="axis"></div>
    </div>
    <div class="section">模型明细 · Models <span></span></div>
    <div class="models" id="models"></div>
  </div>
  <div class="foot">
    <span id="foot">—</span>
    <button type="button" id="reload">刷新 / Refresh</button>
  </div>
</div>
<script>
(function () {
  var API = '/dsh-usage/api';
  var params = new URLSearchParams(location.search);
  var windowTitle = params.get('windowTitle');
  if (windowTitle) document.title = windowTitle;
  var nativeWindow = params.get('native') === '1' && window.chrome && window.chrome.webview;
  if (nativeWindow) {
    document.documentElement.setAttribute('data-native', '1');
    var nativeHead = document.querySelector('.head');
    var nativeClose = document.createElement('button');
    nativeClose.id = 'native-close';
    nativeClose.type = 'button';
    nativeClose.textContent = '×';
    nativeClose.title = '关闭浮窗 / Close';
    nativeClose.setAttribute('aria-label', '关闭浮窗');
    nativeClose.addEventListener('click', function () { window.chrome.webview.postMessage('close'); });
    nativeHead.appendChild(nativeClose);
    nativeHead.addEventListener('mousedown', function (event) {
      if (event.button !== 0) return;
      if (event.target.closest('button, a, input, select')) return;
      event.preventDefault();
      window.chrome.webview.postMessage('drag');
    });
  }
  var visualStyle = params.get('style') || 'auto';
  var effectiveStyle = visualStyle;
  document.documentElement.setAttribute('data-style', effectiveStyle);
  function phaseNow() {
    var h = new Date().getHours();
    if (h >= 6 && h < 12) return 'day';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 20) return 'dusk';
    if (h >= 20) return 'night';
    return 'dawn';
  }
  function applyPhase() { document.documentElement.setAttribute('data-phase', phaseNow()); }
  applyPhase();
  setInterval(applyPhase, 15000);
  if (effectiveStyle === 'auto' || effectiveStyle === 'aurora' || effectiveStyle === 'prism') {
    var drift = document.getElementById('drift');
    var words = ['tok', 'cache', 'in', 'out', '1.2M', 'TPM', '¥', '$', 'tokens'];
    for (var di = 0; di < words.length; di++) {
      var span = document.createElement('span');
      span.textContent = words[di];
      span.style.left = (5 + di * 11) + '%';
      span.style.animationDelay = (di * 1.7) + 's';
      span.style.animationDuration = (12 + (di % 5) * 3) + 's';
      drift.appendChild(span);
    }
  }
  var period = params.get('period') || 'day';
  var anchor = params.get('anchor') || '';
  var from = params.get('from') || '';
  var to = params.get('to') || '';
  var theme = params.get('theme') || document.documentElement.getAttribute('data-theme') || 'light';
  var current = null;
  var timer = null;
  var zh = (navigator.language || 'zh').toLowerCase().indexOf('zh') === 0;
  var T = zh ? {
    loading: '读取中…', live: '实时', error: '读取失败', today: '今天', trend: '趋势', calls: '次调用',
    title: '模型用量', custom: '自定义', from: '开始', to: '结束',
    models: '个模型', tokens: 'Token', unpriced: '未定价', estimate: '参考价',
    actual: '实际支出', total: '总支出', other: '套餐/积分参考', reference: '参考总价', refShort: '按量参考', calibrated: '平台校准', cashHint: '套餐与积分模型不计现金',
    listHint: '按公开价或配置单价折算，不是实际账单', plan: '套餐内', credits: '积分',
    official: '官方价', officialHint: 'DeepSeek 官方峰谷价按调用时间计算',
    quota: '额度', used: '已用', over: '已超额', noData: '这个时间范围内还没有模型调用',
    updated: '更新于', day: '日', week: '周', month: '月', quarter: '季', year: '年'
  } : {
    loading: 'Loading…', live: 'Live', error: 'Failed', today: 'Today', trend: 'Trend', calls: 'calls',
    title: 'Model usage', custom: 'Custom', from: 'From', to: 'To',
    models: 'models', tokens: 'Tokens', unpriced: 'Unpriced', estimate: 'Estimate',
    actual: 'Actual spend', total: 'Total spend', other: 'Plan/credit reference', reference: 'Reference total', refShort: 'List reference', calibrated: 'Platform calibrated', cashHint: 'Plans and credits add no cash',
    listHint: 'Converted from list or configured prices; not an invoice', plan: 'Plan', credits: 'Credits',
    official: 'Official', officialHint: 'DeepSeek peak/off-peak rates applied per call',
    quota: 'Quota', used: 'used', over: 'over', noData: 'No model calls in this range yet',
    updated: 'Updated', day: 'Day', week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year'
  };
  document.getElementById('title').textContent = T.title;
  document.getElementById('fromlabel').textContent = T.from;
  document.getElementById('tolabel').textContent = T.to;
  var customTab = document.querySelector('[data-period="custom"]');
  if (customTab) customTab.textContent = T.custom;
  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function syncTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (node) {
      node.classList.toggle('active', node.getAttribute('data-period') === period);
    });
  }
  function syncCustom() {
    var box = document.getElementById('custom');
    box.hidden = period !== 'custom';
    if (box.hidden) return;
    if (!from) {
      var start = new Date();
      start.setDate(start.getDate() - 29);
      from = dateKey(start);
    }
    if (!to) to = dateKey(new Date());
    document.getElementById('from').value = from;
    document.getElementById('to').value = to;
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function tok(n) {
    n = Number(n) || 0;
    if (n < 1000) return String(Math.round(n));
    if (n < 1000000) return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K';
    if (n < 1000000000) return (n / 1000000).toFixed(n < 10000000 ? 1 : 0) + 'M';
    return (n / 1000000000).toFixed(2) + 'B';
  }
  function money(v, c) {
    v = Number(v) || 0;
    var s = c === 'USD' ? '$' : '¥';
    if (v === 0) return s + '0.00';
    if (v < 0.01) return s + v.toFixed(4);
    if (v < 1) return s + v.toFixed(3);
    return s + v.toFixed(2);
  }
  function pct(v) {
    return Number.isFinite(v) ? Math.round(v * 100) + '%' : '—';
  }
  function rangeLabel(p) {
    if (!p) return '—';
    var end = p.endKey;
    var d = new Date(end + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1);
    var endInclusive = d.toISOString().slice(0, 10);
    if (p.kind === 'month') return p.startKey.slice(0, 7);
    if (p.kind === 'year') return p.startKey.slice(0, 4);
    if (p.kind === 'quarter') return p.startKey.slice(0, 4) + ' Q' + (Math.floor((Number(p.startKey.slice(5, 7)) - 1) / 3) + 1);
    if (p.kind === 'week' || p.kind === 'custom') return p.startKey + ' → ' + endInclusive;
    return p.startKey;
  }
  var VENDOR = {
    deepseek: 'DeepSeek', qwen: 'Qwen', stepfun: 'StepFun', claude: 'Claude', openai: 'OpenAI', moss: 'MOSS',
    gemini: 'Gemini', grok: 'Grok', kimi: 'Kimi', zhipu: 'GLM', minimax: 'MiniMax', meta: 'Llama',
    mistral: 'Mistral', doubao: 'Doubao', hunyuan: 'Hunyuan', baidu: 'ERNIE', cohere: 'Cohere', perplexity: 'Perplexity',
    generic: 'Model'
  };
  function vendorOf(provider, model) {
    var text = (String(provider || '') + ' ' + String(model || '')).toLowerCase();
    if (text.indexOf('claude') >= 0 || text.indexOf('anthropic') >= 0) return 'claude';
    if (text.indexOf('qwen') >= 0 || text.indexOf('qianwen') >= 0 || text.indexOf('tongyi') >= 0) return 'qwen';
    if (text.indexOf('deepseek') >= 0) return 'deepseek';
    if (text.indexOf('step') >= 0) return 'stepfun';
    if (text.indexOf('moss') >= 0 || text.indexOf('nex') >= 0) return 'moss';
    if (text.indexOf('gemini') >= 0 || text.indexOf('google') >= 0 || text.indexOf('bard') >= 0) return 'gemini';
    if (text.indexOf('grok') >= 0 || text.indexOf('xai') >= 0) return 'grok';
    if (text.indexOf('kimi') >= 0 || text.indexOf('moonshot') >= 0) return 'kimi';
    if (text.indexOf('glm') >= 0 || text.indexOf('zhipu') >= 0) return 'zhipu';
    if (text.indexOf('minimax') >= 0 || text.indexOf('abab') >= 0) return 'minimax';
    if (text.indexOf('llama') >= 0 || text.indexOf('meta-') >= 0) return 'meta';
    if (text.indexOf('mistral') >= 0 || text.indexOf('mixtral') >= 0) return 'mistral';
    if (text.indexOf('doubao') >= 0 || text.indexOf('bytedance') >= 0) return 'doubao';
    if (text.indexOf('hunyuan') >= 0 || text.indexOf('tencent') >= 0) return 'hunyuan';
    if (text.indexOf('ernie') >= 0 || text.indexOf('wenxin') >= 0 || text.indexOf('baidu') >= 0) return 'baidu';
    if (text.indexOf('cohere') >= 0) return 'cohere';
    if (text.indexOf('perplexity') >= 0 || text.indexOf('sonar') >= 0) return 'perplexity';
    if (text.indexOf('openai') >= 0 || text.indexOf('gpt') >= 0) return 'openai';
    return 'generic';
  }
  function vendorIcon(provider, model) {
    var vendor = vendorOf(provider, model);
    var label = VENDOR[vendor] || 'Model';
    if (vendor === 'generic') {
      var source = String(provider || model || '?').replace(/[^A-Za-z0-9]/g, '');
      var initials = (source.slice(0, 2) || 'AI').toUpperCase();
      var hash = 0;
      for (var i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
      var hue = hash % 360;
      return '<span class="vicon vicon-mono" title="' + esc(label) + '" style="background:linear-gradient(135deg,hsl(' + hue + ',62%,48%),hsl(' + ((hue + 42) % 360) + ',70%,30%))">' + esc(initials) + '</span>';
    }
    return '<span class="vicon" title="' + esc(label) + '"><img src="/dsh-usage/api/vendor/' + vendor + '.svg" alt="' + esc(label) + '"></span>';
  }
  function setStatus(text, live) {
    document.getElementById('status').textContent = text;
    var dot = document.getElementById('live');
    dot.className = 'dot' + (live ? '' : ' off');
  }
  function render(summary) {
    current = summary;
    var periodInfo = summary.period;
    var totalSpend = Number(summary.totals.totalSpend || summary.totals.listCost || 0);
    var otherSpend = Number(summary.totals.otherCost || 0);
    document.getElementById('costlabel').textContent = T.total;
    document.getElementById('cost').textContent = money(totalSpend, summary.currency);
    document.getElementById('alt').innerHTML = '<span class="badge">' + T.actual + '</span>' + money(summary.totals.cashCost, summary.currency) + ' · ' + T.other + ' ' + money(otherSpend, summary.currency);
    document.getElementById('total').innerHTML = '';
    document.getElementById('range').textContent = rangeLabel(periodInfo);
    document.getElementById('meta').innerHTML =
      '<span><b>' + tok(summary.totals.tokens) + '</b> ' + T.tokens + '</span>' +
      '<span><b>' + summary.totals.calls + '</b> ' + T.calls + '</span>' +
      '<span><b>' + summary.models.length + '</b> ' + T.models + '</span>';
    var notes = '<div class="warn" style="color:var(--muted)">' + (summary.costBasis === 'cash' ? T.cashHint : T.listHint) + '</div>';
    if (summary.totals.officialCalls > 0) notes += '<div class="warn" style="color:var(--muted)">' + T.officialHint + '</div>';
    if (summary.totals.unpricedCalls > 0) notes += '<div class="warn">' + T.unpriced + ' × ' + summary.totals.unpricedCalls + ' — cost counts as 0</div>';
    document.getElementById('notes').innerHTML = notes;
    var buckets = summary.buckets || [];
    var maxTokens = 1, maxCost = 1e-12;
    buckets.forEach(function (b) { maxTokens = Math.max(maxTokens, b.tokens || 0); maxCost = Math.max(maxCost, b.costUsd || 0); });
    document.getElementById('bars').innerHTML = buckets.map(function (b) {
      var h = b.tokens > 0 ? Math.max(2, (b.tokens / maxTokens) * 100) : 0;
      return '<div class="slot" title="' + esc(b.label + ' · ' + tok(b.tokens) + ' ' + T.tokens + ' · ' + money(b.cost, summary.currency)) + '"><div class="bar" style="height:' + h + '%"></div></div>';
    }).join('');
    var points = buckets.map(function (b, i) {
      var x = ((i + 0.5) / Math.max(1, buckets.length)) * 100;
      var y = 100 - ((b.costUsd || 0) / maxCost) * 88;
      return x.toFixed(2) + ',' + y.toFixed(2);
    }).join(' ');
    document.getElementById('points').setAttribute('points', points);
    var every = buckets.length <= 8 ? 1 : Math.ceil(buckets.length / 6);
    document.getElementById('axis').innerHTML = buckets.map(function (b, i) {
      if (i % every !== 0) return '';
      var left = Math.min(96, Math.max(4, ((i + 0.5) / Math.max(1, buckets.length)) * 100));
      return '<div style="left:' + left + '%">' + esc(b.label) + '</div>';
    }).join('');
    document.getElementById('readout').textContent = (T.trend || '趋势') + ' · ' + rangeLabel(periodInfo);
    var models = summary.models || [];
    if (models.length === 0) {
      document.getElementById('models').innerHTML = '<div class="empty"><b>' + T.noData + '</b></div>';
    } else {
      document.getElementById('models').innerHTML = models.map(function (m) {
        var quota = null;
        if (m.quota && periodInfo.kind === 'day' && periodInfo.isCurrent && m.quota.dailyTokens > 0) {
          quota = { used: m.tokens, limit: m.quota.dailyTokens, ratio: m.tokens / m.quota.dailyTokens, label: T.today };
        } else if (m.quota && periodInfo.kind === 'month' && periodInfo.isCurrent) {
          if (m.quota.monthlyUsd > 0) quota = { used: m.monthCostUsd || 0, limit: m.quota.monthlyUsd, ratio: (m.monthCostUsd || 0) / m.quota.monthlyUsd, label: T.quota, money: true };
          else if (m.quota.monthlyTokens > 0) quota = { used: m.monthTokens || 0, limit: m.quota.monthlyTokens, ratio: (m.monthTokens || 0) / m.quota.monthlyTokens, label: T.quota, money: false };
        }
        var badgeText = m.billing === 'plan' ? T.plan : m.billing === 'credits' ? T.credits : !m.price ? T.unpriced : m.official ? T.official : m.estimated ? T.estimate : '';
        var badgeClass = (!m.price || m.billing === 'unpriced') ? 'badge warn' : 'badge';
        var badge = badgeText ? '<span class="' + badgeClass + '">' + badgeText + '</span>' : '';
        var shownCost = money(m.cost, summary.currency);
        if (summary.costBasis === 'cash' && m.billing === 'plan') shownCost = T.plan;
        else if (summary.costBasis === 'cash' && m.billing === 'credits') shownCost = T.credits;
        else if (summary.costBasis === 'cash' && m.billing === 'unpriced') shownCost = '—';
        var refLine = summary.costBasis === 'cash' && m.listCost > 0 && m.cashCost === 0
          ? '<div class="mref">' + T.refShort + ' ' + money(m.listCost, summary.currency) + '</div>' : '';
        var calLine = m.calibrated ? '<div class="mref">' + T.calibrated + '</div>' : '';
        var quotaHtml = quota ? '<div class="quota"><div class="qline"><span>' + quota.label + '</span><span>' +
          (quota.money ? money(quota.used, summary.currency) + ' / ' + money(quota.limit, summary.currency) : tok(quota.used) + ' / ' + tok(quota.limit)) +
          ' <b>' + pct(quota.ratio) + '</b></span></div><div class="track"><div class="fill ' + (quota.ratio >= 1 ? 'over' : quota.ratio >= 0.8 ? 'warn' : '') + '" style="width:' + Math.min(100, Math.max(0, quota.ratio * 100)) + '%"></div></div></div>' : '';
        return '<div class="model"><div class="row"><div class="model-main"><div class="model-name">' + vendorIcon(m.provider, m.model) + '<span class="name">' + esc(m.displayName || m.model) + '</span>' + badge + '</div><div class="provider">' + esc(m.provider) + '</div></div><div class="num"><div class="mcost">' + shownCost + '</div><div class="mtok">' + tok(m.tokens) + ' · ' + (m.calls || 0) + '</div>' + refLine + calLine + '</div></div></div>' + quotaHtml + '</div>';
      }).join('');
    }
    document.getElementById('foot').textContent = T.updated + ' ' + new Date(summary.generatedAt).toLocaleTimeString();
    setStatus(T.live, true);
  }
  async function load() {
    try {
      var q = new URLSearchParams({ period: period });
      if (anchor) q.set('anchor', anchor);
      if (period === 'custom') {
        if (from) q.set('from', from);
        if (to) q.set('to', to);
      }
      var res = await fetch(API + '/summary?' + q.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (!data.ok) throw new Error(data.error || 'error');
      render(data);
    } catch (err) {
      setStatus(T.error + ': ' + (err && err.message ? err.message : String(err)), false);
    }
  }
  document.getElementById('tabs').addEventListener('click', function (event) {
    var button = event.target.closest('[data-period]');
    if (!button) return;
    period = button.getAttribute('data-period');
    anchor = '';
    syncTabs();
    syncCustom();
    load();
  });
  document.getElementById('from').addEventListener('change', function (event) { from = event.target.value; load(); });
  document.getElementById('to').addEventListener('change', function (event) { to = event.target.value; load(); });
  document.getElementById('prev').addEventListener('click', function () {
    if (current && current.period && current.period.prevAnchor) { anchor = current.period.prevAnchor; load(); }
  });
  document.getElementById('next').addEventListener('click', function () {
    if (current && current.period && current.period.nextAnchor && !current.period.isCurrent) { anchor = current.period.nextAnchor; load(); }
  });
  document.getElementById('refresh').addEventListener('click', load);
  document.getElementById('reload').addEventListener('click', load);
  document.getElementById('theme').addEventListener('click', function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) load();
  });
  syncTabs();
  syncCustom();
  load();
  timer = setInterval(function () { if (!document.hidden) load(); }, 5000);
})();
</script>
</body>
</html>`
}
