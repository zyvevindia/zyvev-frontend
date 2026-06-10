# Extraction Calibration & Evidence Grounding

Improves LLM extraction quality without catalog schema or acquisition changes.

## Approach

### Two-pass extraction (OpenAI & Anthropic default)

1. **Pass 1 — Evidence discovery** (`groundedExtractionPrompt.js`)
   - Find verbatim snippets only
   - No normalization or inference

2. **Pass 2 — Normalize** (`groundedExtractionPrompt.js`)
   - Map evidence to schema fields
   - Every field requires `value`, `confidence`, `sourceSnippet`, `sourceType`

3. **Programmatic rejection** (`evidenceGrounding.js`)
   - Reject fields without `sourceSnippet`
   - Reject snippets not found in source content
   - Variants grounded per sub-field

### Hallucination rejection

Fields failing snippet verification are dropped before evidence records are created.

### Benchmark failure classification

Per-field failures classified as:

| Type | Meaning |
|------|---------|
| `missing_extraction` | Golden value not extracted |
| `wrong_extraction` | Value present but incorrect |
| `hallucination` | No evidence or rejected by grounding |
| `mapping_error` | Wrong numeric normalization |

Reports in `failureDiagnostics` on each benchmark run.

## Modules

| File | Role |
|------|------|
| `ai/groundedExtractionPrompt.js` | Pass 1 & 2 prompts |
| `ai/evidenceGrounding.js` | Snippet verification & rejection |
| `ai/groundedExtraction.js` | Two-pass orchestrator |
| `ai/providers/openai.js` | Grounded extraction (default) |
| `ai/providers/anthropic.js` | Grounded extraction (default) |
| `benchmark/failureClassification.js` | Failure taxonomy |

## Disable grounding (legacy single-pass)

Pass `grounded: false` in provider config or set `CATALOG_AI_GROUNDED=0` when calling providers directly.

## Re-benchmark

```bash
npm run catalog-import:llm-benchmark
```
