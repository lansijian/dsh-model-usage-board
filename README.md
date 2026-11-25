# Model usage board

[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)

A floating, draggable board that records every completed model call in DeepSeek
Harness, aggregates tokens and cost per model, and lets you inspect day, week,
month, quarter, year, and custom ranges.

## What it records

The host half reads the durable `assistant/message` events in the DSH session log
and keeps a derived, append-only ledger. It does not send usage data anywhere.
For each call it stores the provider, model, session, time, input/output tokens,
cache read/write tokens, and reasoning tokens. Cost is computed from the editable
price table, so changing a price or the USD/CNY rate re-prices history.

Live calls are picked up from the post-commit `session/event` feed; the initial
backfill scans existing sessions once.

## Where to find it

After enabling the bundle, the board appears in the frame-wide overlay. Drag the
title bar to move it, use the chevron to collapse it to a pill, and use the
monitor button to open a separate browser window that can be moved anywhere on
the desktop.

## Live sky

`跟随时间` uses Blender-rendered 3D sun, moon, and cloud sprites plus a
public-domain NASA/JPL Milky Way plate. The sun is a procedural shaded sphere
with a feathered limb; the moon is a lit sphere with a projected lunar texture
and bump. Cloud banks are rendered 3D forms with independent parallax layers,
then tinted per phase. Film grain, vignette, atmospheric haze, a slow sun/moon
path, drifting clouds, twinkling stars, and a slowly turning ray field complete
the scene. All animation stops under `prefers-reduced-motion: reduce`.

The sky assets are under `assets/space/`; see `assets/space/README.md` for
credits and processing. No image is fetched at runtime from a third-party site.

## Data location

The ledger and settings stay local. `DSH_USAGE_DIR` overrides the directory;
existing installations with `E:\\DSH-Usage\\usage.v1.jsonl` keep using E:.
A fresh installation uses `<DSH_PROFILE_DIR>/model-usage-board` (or
`~/.dsh/model-usage-board` without a profile).

## Billing and prices

The board separates **actual pay-as-you-go spend** from **reference list
prices**:

- **Actual spend** (default) counts only pay-as-you-go routes with a known
  official rate, plus any exact price you configure. Subscription plans
  (千问 Token Plan, StepFun Step Plan) and gateway credit routes
  (OpenAI-Next) show their tokens but add **¥0** cash spend and are labelled
  `套餐内` / `积分`.
- **Total spend** is the large headline: `actual cash + the list reference of
  plan/credit usage`; the smaller line beneath it is the actual cash spend and
  the non-cash reference. It is not an invoice; it answers “what did I spend
  out of pocket, and what would the non-cash usage cost at list?”.
- **Reference total** (Settings → cost basis) converts every priced model at
  public list or configured rates. It is explicitly not an invoice.

DeepSeek Flash and DeepSeek V4 Pro use the official CNY peak/off-peak table,
applied to each call by its own timestamp:

| Model | Cache hit | Cache miss input | Output |
| --- | --- | --- | --- |
| `deepseek-flash` | ¥0.04 | ¥2 | ¥8 |
| `deepseek-v4-pro` | ¥0.30 | ¥9 | ¥27 |

The table above is the **peak** rate. Off-peak is half; peak is Beijing time
Monday–Friday (excluding Chinese statutory holidays) 09:00–12:00 and
14:00–18:00. Cache writes are billed at the cache-miss input rate. These are the
rates that matched the DeepSeek platform's own 30-day usage amount within about
1% in verification.

Official sources used by the default table:

- DeepSeek Models & Pricing — <https://api-docs.deepseek.com/zh-cn/quick_start/pricing>
- StepFun API pricing — <https://platform.stepfun.com/docs/zh/guides/pricing/details>
- Qwen Token Plan — <https://www.qianwenai.com/benefits/tokenplan>
- Anthropic Claude Opus 5.5 — <https://platform.claude.com/docs/en/models/opus-5-5/overview>

Plan and credit models are audited against their public list rates:

| Model / route | Input | Output | Cache hit | Treatment |
| --- | ---: | ---: | ---: | --- |
| Qwen4-Max (Token Plan) | ¥10 / 1M | ¥30 / 1M | ¥0.5 / 1M | plan cash ¥0; list reference |
| StepFun `step-5-preview` (Step Plan) | ¥7 / 1M | ¥20 / 1M | ¥0.7 / 1M | plan cash ¥0; list reference |
| Claude Opus 5.5 (gateway credits) | $4 / 1M | $20 / 1M | $0.4 / 1M | credits cash ¥0; list reference |
| Claude Sonnet 5.5 (gateway credits) | $10.1799 / 1M | $50.8995 / 1M | $1.0180 / 1M | calibrated reference; credits cash ¥0 |
| NEX N2.6 (configured character reference) | — | ¥1.20 / 10k characters | — | `usage.c` preferred; output tokens used only when no character count exists |
| MiMo V2.6 Flash (`amd` route) | ¥1 / 1M | ¥2 / 1M | ¥0.02 / 1M | official list reference; no cash until the route is marked paid |
| Hunyuan 4 Flash (`amd` route) | ¥0.5 / 1M | ¥2 / 1M | ¥0.02 / 1M | official list reference; 5折 promo is not modeled |

Qwen Token Plan personal tiers (list): Lite ¥39/month (20k credits),
Essential ¥79 (45k), Standard ¥139 (80k), Pro ¥312 (200k). The first-purchase
promo and preview discounts change the subscription fee, not the list reference
used here. StepFun Step Plan plan fees are not modeled; its public API list is
used for the reference. The model rows always show `套餐内` / `积分` plus the
reference amount, so a plan never masquerades as cash.
NEX N2.6 is configured at the user's ¥1.20 / 万字符 rate as a reference. The
public MOSS model list currently marks N2.6 as limited-time free (0 credits),
so it remains non-cash on this board; the character reference is shown
separately. Sources:
[Qwen Token Plan](https://www.qianwenai.com/benefits/tokenplan),
[Qwen4-Max price details](https://developer.aliyun.com/article/1784343),
[StepFun pricing](https://platform.stepfun.com/docs/zh/guides/pricing/details),
[Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing),
[MOSS model pricing](https://platform.mosi.cn/docs/models/overview),
[MiMo V2.6 Flash pricing](https://mimo.mi.com/models/en-US/mimo-v2.6-flash),
[Hunyuan Hy4 Flash pricing](https://cloud.tencent.cn/developer/article/2787195).

Reference totals are deliberately labelled `按量参考` on the board and in the
desktop window. They answer “what would these tokens cost at the public
pay-as-you-go rate”, not “what did the plan or credits charge me”. A 30-day
DeepSeek comparison against the platform's own usage page matched within about
1% (¥113.75 computed vs ¥115.07 shown).

Claude Sonnet 5.5 has one extra **platform calibration**. The relay reported
$35.39 / ¥237.58 for 2026-11-22. Preserving Anthropic's official input /
output / cache ratios against that day's token mix gives a 3.393301× factor:

| Rate | Calibrated reference |
| --- | --- |
| Input | $10.1799 / 1M |
| Output | $50.8995 / 1M |
| Cache read | $1.0180 / 1M |
| Cache write | $12.7249 / 1M |

The resulting row is labelled `平台校准` and remains a reference, never cash.
Changing the exchange rate changes only the USD→CNY display; the calibration is
defined in USD.

## Views and operations

- Day, week, month, quarter, year, and custom range tabs, with previous/next
  navigation.
- Token bars and a cost line for the selected range.
- **Per-model detail view**: click a model row to switch to that model's own
  page — its own trend chart, token/cache breakdown, billing badge, price,
  quota, calibration note, and recent calls. The back chevron returns to the
  all-model overview.
- Per-model totals, input/output/cache breakdown, billing badge, and reference
  price badge.
- **New models appear automatically**: any model found in a later Session event
  or scan is added on the next refresh, marked `新`, and sorted into the list.
  Provider detection covers DeepSeek, Qwen, StepFun, Claude/Anthropic, OpenAI,
  Gemini, Grok/xAI, Kimi/Moonshot, GLM/Zhipu, MiniMax, Llama/Meta, Mistral,
  Doubao/ByteDance, Hunyuan/Tencent, ERNIE/Baidu, Cohere, Perplexity, and MOSS.
  Unknown vendors get a generated two-letter monogram instead of a blank icon.
- Optional daily token quota and monthly token/cost budget per model. Quotas are
  user-defined local limits, not a provider plan balance.
- Currency toggle between CNY and USD with an editable exchange rate.
- Settings page for cost basis, prices, quotas, refresh interval, and a rescan
  trigger.
- **Board power**: the power button in the header hides the panel to a small
  launcher; Settings → “显示悬浮看板” does the same. The whole bundle can still
  be disabled from **Plugins**.
- **Vendor marks**: official DeepSeek, Qwen, StepFun, Claude, OpenAI, and MOSS
  marks are served from `assets/vendor/` (sources and licenses in that folder).
- **Six selectable visual styles** in Settings → 界面风格:
  `跟随时间` (auto phase), `液态玻璃` (neutral frosted glass),
  `赛博霓虹` (obsidian cockpit with restrained cyan), `矩阵终端` (jade
  dot-matrix without full monospace), `深空极光` (violet/teal aurora), and
  `虹彩棱镜` (holographic rainbow rim).
  `跟随时间` switches five full palettes and scenes:
  **白天 07–12** (sunlit ivory/sky), **下午 12–17** (amber sun and warm haze),
  **傍晚 17–19** (fiery clouds, coral sun, violet sky),
  **晚上 19–05** (pure Milky Way, stars and meteors; no moon),
  **朝霞 05–07** (rose/teal dawn glow). Fixed styles stay fixed.
  The auto scene includes a positioned sun, rays, clouds, horizon, moon,
  stars, and galaxy; it is CSS-only and disabled by `prefers-reduced-motion`.
- **Native floating window**: the header desktop button opens a frameless WPF
  window hosting the widget through WebView2 — no browser chrome, address bar,
  or tab strip. Drag the slim top grip with the mouse to move it to any monitor;
  it stays topmost. The runtime is deployed below the configured data directory
  as `floating-window-runtime`, and its WebView2 profile as
  `floating-window-profile`. WebView2 assemblies are bundled under
  `host/webview2/`. Reopening closes the previous native window first.
- **Liquid-glass shell**: neutral frosted glass, a soft specular rim, and an
  inner metallic edge — no colored glow. Text and controls keep theme-token
  contrast, with reduced-motion fallbacks.
- CSV export for the current range.

## Install and contribute

- Repository: <https://github.com/lansijian/dsh-model-usage-board>
- Package: `dsh-model-usage-board`
- Author: Terry Chen
- License: MIT

Install from the repository or a local checkout with **Plugins → Add plugin**.
For a source install:

```sh
dsh plugin --profile web add "git+https://github.com/lansijian/dsh-model-usage-board.git"
```

The repository is public and open to improvements: fork it, keep the bundle
contract intact, run `npm pack --dry-run`, and open a pull request with a short
description and screenshots. Add the `dsh-plugin` and `deepseek-harness` GitHub
topics when publishing a fork. See `PUBLISHING.md` for the market index format
and release checklist.

Discover index (format 1):
<https://raw.githubusercontent.com/lansijian/dsh-model-usage-board/main/market.json>

## Limitations

- A call contributes only if its session log contains a usage report. A failed
  request that produced no `assistant/message` usage is not counted.
- The board aggregates **all sessions on this machine**. A single chat's own
  cost badge (for example the one under the composer) covers only that chat, so
  the two totals are expected to differ.
- Quotas are local limits. The plugin cannot read a provider's remaining plan
  balance or credit balance.
- Actual spend excludes subscription plans and credit routes by design. Use
  reference mode to see list-equivalent amounts, which are estimates and not an
  invoice.
- The in-app board remains inside DSH. Use the native floating window (top grip
  drag) to move a copy to another monitor; it requires the WebView2 runtime,
  which is normally installed with Edge.
- The initial scan can take a few seconds on a large session history; the board
  shows progress and remains usable.
