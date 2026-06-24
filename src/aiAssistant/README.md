# AI Buyer Assistant Foundation (Phase 15A)

Deterministic intelligence layer for a future EV buying assistant. **No LLM, no chat UI, no public routes** in this phase.

## Architecture

```
Conversation answers
        │
        ▼
buildQuestionFlow() ──► next question / progress
        │
        ▼
buildAssistantJourneyInput() ──► BuyerJourneyInput
        │
        ▼
getBuyerJourney() (read-only)
        │
        ├──► buildAssistantRecommendations()
        └──► buildFollowUpQuestions()
```

## Modules

| File | Role |
|------|------|
| `types.js` | Domain models (conversation state, questions, recommendations) |
| `constants.js` | Question definitions + answer → buyer journey mappings |
| `buildQuestionFlow.js` | Next question, remaining questions, completion progress |
| `buildAssistantJourneyInput.js` | Maps assistant answers to `BuyerJourneyInput` |
| `buildAssistantRecommendations.js` | Headline, summary, why matches, trade-offs, confidence |
| `buildFollowUpQuestions.js` | Deterministic follow-up prompts (compare, costs, alternatives) |
| `assistantRegistry.js` | `getAssistantResponse()`, `getConversationState()`, `listAssistantQuestions()` |

## Conversation stages

1. `budget` — &lt;15L, 15–20L, 20–30L, 30L+
2. `usage` — City, Mixed, Highway
3. `family` — Single, Couple, Family, Large Family
4. `charging` — Home, Apartment, Public
5. `priority` — Running Cost, Value, Family Practicality, Highway Capability, Premium Experience
6. `complete`

Daily distance is inferred from usage (not asked directly):

- City → &lt;30 km/day
- Mixed → 30–60 km/day
- Highway → 60–100 km/day

## Read-only dependencies

- **Score 2.0** — via buyer journey explanations
- **Recommendation Engine** — archetype fits and narratives
- **Compare Intelligence** — trade-off enrichment for top strong-match pairs
- **Buyer Journey Engine** — `getBuyerJourney()` buckets (no rankings, no winners)

## Internal playground

Route: `/playground/assistant`

- `noindex,nofollow`
- Not in navbar or sitemap
- Left: conversation answer selectors
- Right: deterministic assistant response

## Smoke test

```bash
npm run assistant:smoke
```

## Analytics

- `assistant_playground_view`
- `assistant_recommendation_generated`

## Future phases

| Phase | Scope |
|-------|--------|
| **15B** | Conversational UI |
| **15C** | Compare Conversations |
| **15D** | Ownership Conversations |
| **16** | AI Advisor Surfaces |
| **17** | Semi-Autonomous Advisor |
