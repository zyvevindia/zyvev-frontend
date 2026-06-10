# LLM Extraction Benchmark Report

Generated: 2026-06-09T05:47:28.609Z

## Provider Comparison

| Metric | Heuristic | OpenAI | Anthropic |
|--------|-----------|--------|-----------|
| Field Accuracy | 64.8% | 23.7% | — |
| Price Accuracy | 75% | 35.8% | — |
| Variant Accuracy | 0% | 62.3% | — |
| Feature Accuracy | 62.5% | 1.8% | — |
| Coverage | 50.7% | 17.7% | — |
| Hallucination Rate | 0% | 29.3% | — |
| Gate Pass Rate | 0% | 0% | — |

## Latency & Review Time

| Provider | Avg Latency (ms) | Avg Review (min) |
|----------|------------------|------------------|
| heuristic | 1 | 3 |
| openai | 18491 | 3 |
| anthropic | — | — |

## Cost Analysis (USD / INR)

| Provider | Per Vehicle | Per 100 Vehicles | Monthly Refresh (25) |
|----------|-------------|------------------|----------------------|
| heuristic | $0 / ₹0 | $0 / ₹0 | $0 / ₹0 |
| openai | $0.0008 / ₹0.07 | $0.08 / ₹6.84 | $0.02 / ₹1.71 |

## Recommendation

**Default provider: `heuristic`**
 (model: heuristic-v1-enhanced)

Best balance of accuracy (51%), variant handling (0%), cost, and latency. no LLM cost (fallback only).

### Scores

- **heuristic**: composite 0.552 — accuracy 50.6%, variant 0%, cost score 1.00, latency score 1.00
- **openai**: composite 0.29 — accuracy 30.9%, variant 62.3%, cost score 0.20, latency score 0.00