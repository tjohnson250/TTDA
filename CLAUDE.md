# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TARGET Trial Design Assistant (TTDA) — an AI-powered interactive tool that guides researchers through designing target trial emulations for estimating causal effects from observational data. It follows the TARGET (Transparent Reporting of Observational Studies Emulating a Target Trial) framework (Cashin et al. 2025).

**Live site:** https://tjohnson250.github.io/TTDA/TTDA.html

## Build & Render

This is a Quarto project. The main deliverable is the rendered HTML page.

```bash
# Render the Quarto document to HTML
quarto render TTDA.qmd
```

There is no package.json, no test suite, no linter, and no build toolchain for the TSX component. The React component (`target-trial-designer.tsx`) is deployed as a Claude artifact hosted at claude.site, not built locally.

## Architecture

### Deployment Model

The project has an unusual deployment architecture:

1. **`TTDA.qmd`** → Quarto renders to **`TTDA.html`** → hosted on GitHub Pages
2. `TTDA.html` embeds an `<iframe>` pointing to a Claude artifact URL on `claude.site`
3. The artifact contains the compiled version of **`target-trial-designer.tsx`**
4. **`index.html`** redirects visitors to `TTDA.html`

When the TSX component is updated, a new Claude artifact must be created and the iframe URL in `TTDA.qmd` must be updated to point to the new artifact.

### Core Component: `target-trial-designer.tsx`

A single-file React component (no local build system) that runs inside a Claude artifact. Key architecture:

- **State management:** React hooks (`useState`/`useEffect`/`useRef`), no external state library
- **Persistence:** Auto-saves to `window.storage` (Claude artifact storage API), not standard localStorage
- **AI interaction:** Direct fetch to `https://api.anthropic.com/v1/messages` using `claude-sonnet-4-20250514`
- **Styling:** Tailwind CSS classes (available in the Claude artifact runtime)
- **Icons:** `lucide-react`

### Workflow Phases

The tool guides users through a linear progression:

```
introduction → specification (Items 6a-h) → emulation (Items 7a-h) → complete
```

- **Specification (6a-6h):** Define a pragmatic clinical trial that could actually be conducted
- **Emulation (7a-7h):** Map that trial design to observational data

Phase transitions are triggered by `[PHASE_COMPLETE:specification]` and `[PHASE_COMPLETE:emulation]` markers in the AI response, which are stripped before display.

### Protocol Data Structure

```typescript
protocol: {
  researchQuestion: string
  specification: { '6a_eligibility' through '6h_analysis' }
  emulation: { '7a_eligibility_ops' through '7h_analysis_ops' }
}
```

### Domain Concept: TIME ZERO

A critical concept throughout the codebase. Time zero is the single point when eligibility criteria are met, treatment is assigned, and follow-up begins. The system prompt heavily emphasizes this to prevent immortal time bias.

## Key Files

- `target-trial-designer.tsx` — The entire interactive application (React component)
- `TTDA.qmd` — Landing page with embedded artifact iframe and academic citations
- `references.bib` — BibTeX references for the Quarto document
- `index.html` — GitHub Pages redirect to TTDA.html
