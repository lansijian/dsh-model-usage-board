# Contributing

Thanks for improving the model usage board.

## Development

1. Clone the repository.
2. Install the directory with **Plugins → Add plugin**, or install the Git
   package with the DSH plugin CLI.
3. Keep the bundle contract in `package.json` and `cordis.patch.yml` intact.
4. Run `node --check index.js`, `node --check client.js`, and
   `node --check host/store.js`.
5. Use a clean test profile for install and native-window checks; do not commit
   a profile, ledger, WebView2 profile, screenshots, or generated release
   artifacts.

## Pull requests

- One concern per change. Describe the user-visible result and the affected
  phase/style if the sky scene changes.
- For scene assets, state the source and license. Bundled images must be
  redistributable; public-domain NASA imagery and original Blender renders are
  preferred.
- Do not add telemetry. Usage data stays local.
- Keep the native floating window optional and leave non-Windows installs
  functional.

## Checks before opening a PR

```sh
npm pack --dry-run
```

The file list must include `index.js`, `client.js`, `host/`, `assets/`,
`locale/*.json`, `icon.svg`, `cordis.patch.yml`, `README.md`, `LICENSE`, and
`PUBLISHING.md`. If the change affects the market listing, update the format-1
`market.json` version and pinned commit.
