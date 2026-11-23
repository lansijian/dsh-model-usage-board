# Publishing and market checklist

This file is for maintainers. The published package is
`dsh-model-usage-board` at
<https://github.com/lansijian/dsh-model-usage-board>; author Terry Chen, MIT.
The live development checkout may still use a private local alias.

## What the official DSH docs require

- A bundle declares `dsh.bundle.patch` in `package.json`; the patch inserts the
  plugin row.
- Export `./locale/*.json` and `./icon`; keep every runtime file, the patch,
  locales, icon, and any detail document in `files`.
- `locale/en.json` and `locale/zh.json` need `meta.title` and
  `meta.description`. `meta.detail` is optional and, when present, points to one
  Markdown document containing one image.
- The icon must be SVG/PNG/JPEG/WebP, inside the package, at most 256 KiB. Use a
  transparent 36×36 symbol rather than drawing a tile; Plugin Manager draws the
  tile.
- The plugin market is an index the user configures. The format-1 index is JSON
  with `title`, optional `description`, `plugins`, and exact `versions`; each
  version names an npm package or a commit-pinned Git source. DSH ships no
  default index, so a public listing needs an index URL plus submission to the
  community indexes the user reads.
- GitHub discovery commonly uses the `dsh-plugin` topic. Community indexes
  include [DSH Market](https://github.com/2BingLing/dsh-market) and
  [DSH Plugin Hub](https://dsh-plugin.org/); read each index's current submission
  instructions before posting.

## 1. Choose the public identity

Needed before the first publish:

- GitHub account or organization and public repository name
  (suggested: `dsh-model-usage-board`).
- npm scope and account, or a decision to publish from Git only.
- Author display name and copyright holder for `LICENSE`.
- Public homepage (usually the GitHub repository or Pages site).

Suggested package name: `@<scope>/dsh-model-usage-board` (or the unscoped
`dsh-model-usage-board` if available). Keep the `cordis.patch.yml` row name in
sync with it.

## 2. Release package

From the package directory:

```json
{
  "name": "@<scope>/dsh-model-usage-board",
  "version": "1.0.0",
  "private": false,
  "license": "MIT",
  "repository": { "type": "git", "url": "git+https://github.com/<owner>/dsh-model-usage-board.git" },
  "homepage": "https://github.com/<owner>/dsh-model-usage-board",
  "keywords": ["deepseek-harness", "dsh", "dsh-plugin", "tokens", "usage"],
  "files": [
    "index.js", "client.js", "host", "assets", "locale/*.json",
    "cordis.patch.yml", "icon.svg", "docs", "README.md", "LICENSE"
  ]
}
```

Then:

1. Update `cordis.patch.yml` `name` to the public package name.
2. Add/refresh `docs/DETAIL.md` + one preview image if a feature image is used.
3. Run `npm pack --dry-run` and inspect the file list and size.
4. `npm publish --access public` (scoped) or `npm publish` (unscoped).
5. Tag the Git commit (`v1.0.0`), create a GitHub release, and add the
   `dsh-plugin` and `deepseek-harness` topics.
6. For a Git-only release, use the full 40-character commit in the market
   version source and keep the `path` field only when the package is not at the
   repository root.

## 3. Market index (format 1)

Host a JSON file at a stable HTTPS URL, for example
`https://<owner>.github.io/dsh-model-usage-board/market.json` or a GitHub raw
URL. Relative `icon` paths resolve against the index; inline data icons are
limited to 32 KiB.

```json
{
  "format": 1,
  "title": { "en": "Model usage board", "zh": "模型用量看板" },
  "description": { "en": "Live per-model token, cost, and quota board.", "zh": "按模型记录 Token、支出和额度的实时看板。" },
  "metadata": {
    "categories": { "monitoring": { "title": { "en": "Monitoring", "zh": "监控" } } },
    "labels": { "local-first": { "title": { "en": "Local-first", "zh": "本地优先" } } }
  },
  "plugins": [{
    "name": "@<scope>/dsh-model-usage-board",
    "title": { "en": "Model usage board", "zh": "模型用量看板" },
    "description": { "en": "Live per-model token, cost, and quota board.", "zh": "按模型记录 Token、支出和额度的实时看板。" },
    "author": "<author>",
    "homepage": "https://github.com/<owner>/dsh-model-usage-board",
    "repository": { "type": "git", "url": "https://github.com/<owner>/dsh-model-usage-board" },
    "icon": "https://<host>/icon.svg",
    "metadata": { "category": "monitoring", "labels": ["local-first"], "keywords": ["tokens", "cost"] },
    "versions": [{
      "version": "1.0.0",
      "publishTimestamp": 0,
      "source": { "type": "npm" },
      "engines": { "dsh": ">=0.2.0" }
    }]
  }]
}
```

Replace `publishTimestamp` with the real Unix seconds and `engines.dsh` with a
range the release has been tested against. For a Git source:

```json
"source": {
  "type": "git",
  "url": "https://github.com/<owner>/dsh-model-usage-board",
  "commit": "<40 lowercase hex characters>",
  "path": "."
}
```

Validate by installing the exact version in a throwaway profile or by loading
the index in **Plugins → Discover**. Do not test only against a local directory:
the published path must resolve npm/Git files, locale, icon, and the host
assets.

## 4. Community submission

1. Push the public repository with topics `dsh-plugin`,
   `deepseek-harness`, and `dsh-bundle`.
2. Submit the repository to the community index/issue tracker named in its
   current README; do not assume an old form field or label.
3. For the built-in Discover page, add the hosted `market.json` URL under
   **Plugins → Discover → Manage sources**.
4. After listing, install from the market into a clean profile and verify:
   bundle title/description, icon in light/dark, board location, native window,
   data directory, and uninstall/reinstall.

## 5. Privacy and limitations to keep in the listing

- Usage stays local; there is no telemetry or upload.
- The board aggregates all sessions on the machine, not one chat.
- Plan/credit amounts are list-equivalent references, not invoices.
- Native floating-window support is Windows/WPF/WebView2; it uses a bundled
  WebView2 loader and writes its runtime/profile below the configured data
  directory.
