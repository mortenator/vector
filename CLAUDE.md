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
