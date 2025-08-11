# Suspect unused or duplicate files

- dist/ and public/admin/assets/: built artifacts; do not commit if not needed for hosting
- .netlify/*: local Netlify emulator outputs
- vite.config.js.timestamp.mjs: generated during preflight; can be ignored/removed if not used
- public/_redirects: keep this as the single source; removed scripts/public/_redirects (duplicate)
- public/admin/assets/index-*.js|css: generated; verify via scripts/verify-admin-assets.mjs


Recommendation: keep .gitignore updated to exclude emulation/build outputs.
