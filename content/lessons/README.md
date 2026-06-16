# Lesson corpus

This folder is the source of truth for Orchestra-Core's curriculum content. Each lesson is one Markdown file with frontmatter, organized by series:

- `money-basics/` — fundamentals (budgeting, compound interest, payslips, emergency funds)
- `smart-money/` — educational case studies on how market-movers think (balance sheets, 13F filings, short-selling, risk) — always framed as "understand how they think," never as signals to act on
- `kenya-money/` — Kenya-specific accounts, tools, and rules (M-Pesa, SACCOs, NSE, T-Bills)

## Frontmatter schema

```yaml
title: string        # matches the title in src/lib/lessons.ts
module: string       # "Module N"
series: string        # money-basics | smart-money | kenya-money
readTime: string      # e.g. "6 min read"
premium: boolean      # matches the premium flag in src/lib/lessons.ts
summary: string       # one-sentence description
tags: string[]        # for retrieval/filtering
```

## How this corpus is used

1. **RAG knowledge base** — these files are the source documents for "Ask Orchestra-Core's" retrieval pipeline (Phase 1).
2. **Lesson detail pages** — eventually rendered in the app/website when a lesson card is opened.
3. **Content marketing** — each lesson doubles as a short-form script (the "content flywheel" described in `CLAUDE.md`).

## Writing guidelines

- Plain language, jargon explained the first time it's used.
- Kenya-specific examples (KES amounts, M-Pesa, SACCOs, NSE, payslips) wherever relevant.
- Smart Money lessons open with an explicit "education, not advice" framing and close with an "Ask Orchestra-Core" prompt that reinforces it.
- Avoid hard-coding numbers that change often (tax bands, fees, rates) — describe the structure and point to the authoritative current source instead.
- Original writing only — summarize ideas, never reproduce book text verbatim.
