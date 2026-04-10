# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vector is a PowerPoint add-in for inserting professional charts, inspired by Think-cell. It has two implementations:
- **Web-based add-in** (primary): React + TypeScript + Office.js, deployed to GitHub Pages
- **PPAM/VBA-based add-in** (legacy): Traditional PowerPoint ribbon with VBA macros

## Build Commands

```bash
npm run build          # Production build
npm run dev            # Development server with hot reload
npm run start          # Dev server with HTTPS (required for Office add-in testing)
npm run lint           # ESLint for .ts and .tsx files
npm run sideload       # Sideload add-in into PowerPoint for testing
npm run validate       # Validate manifest.xml
npm run deploy         # Build and deploy to GitHub Pages
```

For the legacy VBA version:
```bash
python Scripts/build-ppam.py    # Build PPAM file
./Scripts/install.sh            # Install on macOS
```

## Architecture

### Source Structure
```
src/
├── taskpane/
│   ├── index.tsx       # React entry point, Office.onReady handler
│   ├── App.tsx         # Main app component with chart type state
│   └── taskpane.css    # Tailwind imports + custom styles
├── components/
│   ├── Header.tsx      # Branding header
│   └── ChartPanel.tsx  # Chart type selection + insert button
└── utils/
    └── chartUtils.ts   # Office.js integration for chart insertion
```

### Key Technologies
- React 18 with TypeScript
- Fluent UI React Components (Microsoft design system)
- Office.js for PowerPoint API
- Tailwind CSS with custom Office-themed color palette
- Webpack 5 with dev server on port 3000 (HTTPS)

### Office.js Integration Pattern
Charts are created using `PowerPoint.run()` context:
```typescript
await PowerPoint.run(async (context) => {
  const shapes = context.presentation.slides.getItemAt(0).shapes;
  // Add shapes and manipulate slides
  await context.sync();
});
```

### Manifests
- `manifest.xml` - Development (localhost:3000)
- `manifest-prod.xml` - Production (GitHub Pages)

## Deployment

GitHub Actions automatically deploys to GitHub Pages on push to main branch. The workflow:
1. Runs `npm ci` and `npm run build`
2. Copies `manifest-prod.xml` to dist/
3. Deploys to https://mortenator.github.io/vector/

## Development Notes

- Tailwind config has custom `office` color palette (orange, dark, gray, light)
- Path alias `@/*` maps to `src/*` in TypeScript
- No test framework is currently configured

## gstack

For all web browsing, use the `/browse` skill from gstack. **NEVER use `mcp__claude-in-chrome__*` tools** — they are slow, unreliable, and superseded by gstack's headless browser.

Available skills:

| Skill | Purpose |
|-------|---------|
| `/office-hours` | YC Office Hours — startup diagnostic + builder brainstorm |
| `/plan-ceo-review` | CEO-perspective plan review |
| `/plan-eng-review` | Engineering plan review |
| `/plan-design-review` | Design audit (report only) |
| `/plan-devex-review` | Developer experience review |
| `/design-consultation` | Design system from scratch |
| `/design-shotgun` | Visual design exploration |
| `/design-html` | HTML design artifacts |
| `/design-review` | Design audit + fix loop |
| `/review` | PR review |
| `/ship` | Ship workflow |
| `/land-and-deploy` | Merge, deploy, and canary verify |
| `/canary` | Post-deploy monitoring loop |
| `/benchmark` | Performance regression detection |
| `/browse` | Headless browser for QA, testing, and web interaction |
| `/connect-chrome` | Launch GStack Browser (alias for /open-gstack-browser) |
| `/qa` | QA testing with fixes |
| `/qa-only` | QA testing (report only, no fixes) |
| `/setup-browser-cookies` | Configure browser cookies |
| `/setup-deploy` | One-time deploy config |
| `/retro` | Retrospective |
| `/investigate` | Systematic root-cause debugging |
| `/document-release` | Post-ship doc updates |
| `/codex` | Multi-AI second opinion via OpenAI Codex CLI |
| `/cso` | OWASP Top 10 + STRIDE security audit |
| `/autoplan` | Auto-review pipeline (CEO + design + eng) |
| `/devex-review` | Developer experience review + fixes |
| `/careful` | Extra-careful mode |
| `/freeze` | Freeze changes |
| `/guard` | Guard mode |
| `/unfreeze` | Unfreeze changes |
| `/gstack-upgrade` | Upgrade gstack |
| `/learn` | Capture learnings |

