# AI Buyer Assistant Validation Report

Generated: 2026-06-24T02:50:31.613Z
Validation version: 1.0.0-alpha
Matrix scenarios: 720
Contradictory scenarios: 25

## Executive Summary

Overall readiness: **WARNING**

| Category | Score |
| --- | --- |
| Archetype Coverage | PASS |
| Budget Alignment | PASS |
| Contradictory Handling | PASS |
| Recommendation Diversity | WARNING |
| Narrative Quality | PASS |

- Total budget anomalies flagged: 0
- Vehicles never in strong matches: 1
- Contradictory scenarios with no recommendations: 0

## Archetype Coverage

### City Commuter

Focused scenario strong matches: 2
Focused scenario good alternatives: 12
Focused scenario weak fits: 1
Aggregate scenarios touching archetype: 528 (empty strong: 270)

Top strong matches (aggregate):
- byd-atto-3 (144)
- tata-curvv-ev (144)
- hyundai-creta-electric (144)
- maruti-e-vitara (144)
- tata-harrier-ev (144)
- tata-punch-ev (96)

### Family Buyer

Focused scenario strong matches: 8
Focused scenario good alternatives: 16
Focused scenario weak fits: 0
Aggregate scenarios touching archetype: 576 (empty strong: 252)

Top strong matches (aggregate):
- byd-atto-3 (216)
- tata-curvv-ev (216)
- hyundai-creta-electric (216)
- maruti-e-vitara (216)
- tata-harrier-ev (216)
- mahindra-be-6 (150)

### Highway Traveller

Focused scenario strong matches: 10
Focused scenario good alternatives: 15
Focused scenario weak fits: 0
Aggregate scenarios touching archetype: 336 (empty strong: 108)

Top strong matches (aggregate):
- byd-atto-3 (180)
- tata-curvv-ev (180)
- hyundai-creta-electric (180)
- maruti-e-vitara (180)
- tata-harrier-ev (180)
- mahindra-be-6 (120)

### Apartment Owner

Focused scenario strong matches: 2
Focused scenario good alternatives: 15
Focused scenario weak fits: 1
Aggregate scenarios touching archetype: 480 (empty strong: 220)

Top strong matches (aggregate):
- byd-atto-3 (168)
- tata-curvv-ev (168)
- hyundai-creta-electric (168)
- maruti-e-vitara (168)
- tata-harrier-ev (168)
- mahindra-be-6 (112)

### Budget Buyer

Focused scenario strong matches: 2
Focused scenario good alternatives: 12
Focused scenario weak fits: 0
Aggregate scenarios touching archetype: 288 (empty strong: 120)

Top strong matches (aggregate):
- byd-atto-3 (120)
- tata-curvv-ev (120)
- hyundai-creta-electric (120)
- maruti-e-vitara (120)
- tata-harrier-ev (120)
- hyundai-kona-electric (72)

### Premium Buyer

Focused scenario strong matches: 7
Focused scenario good alternatives: 1
Focused scenario weak fits: 0
Aggregate scenarios touching archetype: 288 (empty strong: 222)

Top strong matches (aggregate):
- bmw-ix1 (66)
- byd-seal (66)
- hyundai-ioniq-5 (66)
- kia-ev6 (66)
- mercedes-eqa (66)
- mercedes-eqb (66)

### First-time EV Buyer

Focused scenario strong matches: 7
Focused scenario good alternatives: 10
Focused scenario weak fits: 1
Aggregate scenarios touching archetype: 0 (empty strong: 0)

Top strong matches (aggregate):

## Budget Coverage

### <15L

- Scenarios: 180
- Avg strong matches: 4.2
- Empty strong buckets: 72
- Budget anomalies flagged: 0

### 15–20L

- Scenarios: 180
- Avg strong matches: 5.57
- Empty strong buckets: 72
- Budget anomalies flagged: 0

### 20–30L

- Scenarios: 180
- Avg strong matches: 7.37
- Empty strong buckets: 54
- Budget anomalies flagged: 0

### 30L+

- Scenarios: 180
- Avg strong matches: 1.87
- Empty strong buckets: 132
- Budget anomalies flagged: 0

## Contradictory Scenario Results

| Scenario | Strong | Good | Flags | Top strong |
| --- | ---: | ---: | --- | --- |
| Budget <15L + Large Family + Highway + Public + Premium | 0 | 14 | no_strong_matches | — |
| Budget 30L+ + Single + City + Home + Running Cost | 0 | 8 | no_strong_matches | — |
| Apartment + Highway + Family + <15L | 10 | 4 | — | BYD Atto 3, Curvv EV, Hyundai Creta Electric, Hyundai Kona Electric, Mahindra XUV400 |
| Premium priority on budget band <15L | 0 | 14 | no_strong_matches | — |
| Large family on 30L+ with running-cost priority | 0 | 8 | no_strong_matches | — |
| Highway usage with apartment charging and value focus | 10 | 7 | — | BE 6, BYD Atto 3, Citroen eC3, Curvv EV, Hyundai Creta Electric |
| City commuter profile with 30L+ budget | 0 | 8 | no_strong_matches | — |
| Public charging + premium + large family + 20–30L | 0 | 25 | no_strong_matches | — |
| Highway capability on <15L with single buyer | 7 | 7 | — | BYD Atto 3, Citroen eC3, Curvv EV, Hyundai Creta Electric, Maruti Suzuki e Vitara |
| Running cost priority with premium budget and highway | 0 | 8 | no_strong_matches | — |
| Value focus with large family and 30L+ budget | 0 | 8 | no_strong_matches | — |
| Family practicality on <15L with city usage | 0 | 14 | no_strong_matches | — |
| Highway capability with 30L+ and apartment charging | 0 | 8 | no_strong_matches | — |
| Premium experience on 20–30L with public charging | 7 | 18 | — | Bmw iX1, BYD Seal, Ioniq 5, Kia EV6, Mercedes-Benz EQA |
| Large family value seeker on 15–20L | 8 | 9 | — | BE 6, BYD Atto 3, Curvv EV, Hyundai Creta Electric, Mahindra XEV 9e |
| Single city buyer with 30L+ and family practicality | 0 | 8 | no_strong_matches | — |
| Couple highway traveller on <15L budget | 7 | 7 | — | BYD Atto 3, Citroen eC3, Curvv EV, Hyundai Creta Electric, Maruti Suzuki e Vitara |
| Apartment + premium + <15L | 0 | 14 | no_strong_matches | — |
| Public charging running-cost buyer on 30L+ | 0 | 8 | no_strong_matches | — |
| Mixed usage large family on 30L+ with value priority | 0 | 8 | no_strong_matches | — |
| Highway premium on 15–20L with home charging | 0 | 17 | no_strong_matches | — |
| City large family on 20–30L with running cost | 0 | 25 | no_strong_matches | — |
| Couple mixed usage premium on <15L | 0 | 14 | no_strong_matches | — |
| Mixed usage with premium priority on 20–30L | 7 | 18 | — | Bmw iX1, BYD Seal, Ioniq 5, Kia EV6, Mercedes-Benz EQA |
| Single highway on 20–30L with apartment charging | 10 | 15 | — | BE 6, BYD Atto 3, Citroen eC3, Curvv EV, Hyundai Creta Electric |

## Recommendation Diversity


| Vehicle | Strong | Good | Worth | Weak | Insufficient |
| --- | ---: | ---: | ---: | ---: | ---: |
| BYD Atto | 252 | 288 | 180 | 0 | 0 |
| Curvv EV | 252 | 288 | 180 | 0 | 0 |
| Hyundai Creta Electric | 252 | 288 | 180 | 0 | 0 |
| Maruti Vitara | 252 | 288 | 180 | 0 | 0 |
| Tata Harrier EV | 252 | 288 | 180 | 0 | 0 |
| BE 6 | 168 | 192 | 360 | 0 | 0 |
| Mahindra Xev 9e | 168 | 192 | 360 | 0 | 0 |
| Nexon EV | 168 | 192 | 360 | 0 | 0 |
| Hyundai Kona Electric | 144 | 396 | 180 | 0 | 0 |
| Mahindra Xuv400 | 144 | 396 | 180 | 0 | 0 |
| MG Windsor EV | 144 | 396 | 180 | 0 | 0 |
| MG Zs EV | 144 | 396 | 180 | 0 | 0 |
| Tata Tigor EV | 144 | 396 | 180 | 0 | 0 |
| Bmw Ix1 | 96 | 264 | 360 | 0 | 0 |
| BYD Seal | 96 | 264 | 360 | 0 | 0 |
| Ioniq 5 | 96 | 264 | 360 | 0 | 0 |
| Kia Ev6 EV | 96 | 264 | 360 | 0 | 0 |
| Mercedes Eqa | 96 | 264 | 360 | 0 | 0 |
| Mercedes Eqb | 96 | 264 | 360 | 0 | 0 |
| Tata Punch EV | 96 | 444 | 180 | 0 | 0 |
| Volvo Ex40 | 96 | 264 | 360 | 0 | 0 |
| Citroen Ec3 | 72 | 468 | 180 | 0 | 0 |
| Tiago EV | 72 | 468 | 180 | 0 | 0 |
| Comet EV | 24 | 492 | 170 | 34 | 0 |
| Mini Cooper Se | 0 | 360 | 276 | 84 | 0 |

Never in strong matches:
- mini-cooper-se

## Narrative Quality Findings

- Missing strengths: 0 recommendation rows
- Missing trade-offs: 0 recommendation rows

Repetitive headlines:
- (6480×) Strong choice for families.
- (2640×) Capable choice for regular highway travel.
- (2160×) Excellent choice for families.
- (1728×) A workable option for family buyers.
- (1224×) Limited premium appeal for discerning buyers.
- (768×) Excellent value for budget-conscious buyers.
- (732×) Limited value at this price point.
- (576×) Strong value for budget-conscious buyers.

Repetitive summaries:
- (9072×) This EV aligns with buyers focused on practicality. Broad service support and family-friendly packaging make it a compel…
- (2280×) This EV aligns with buyers focused on range + charging. Range confidence and highway usability make it a sensible option…
- (1344×) This EV aligns with buyers focused on purchase value. Sensible purchase value and ownership economics make it a thoughtf…
- (1008×) This EV aligns with buyers focused on luxury + performance. Premium buyers may want to compare refinement and ownership …
- (636×) This EV aligns with buyers focused on purchase value. Budget-focused buyers should compare purchase price and ownership …
- (432×) The BE 6 balances practicality with highway usability. Broad service support and family-friendly packaging make it a com…
- (432×) The BYD Seal delivers premium comfort, strong range, and confident long-distance capability. Broad service support and f…
- (432×) The Nexon EV balances practicality with highway usability. Broad service support and family-friendly packaging make it a…

## Anomalies Found

- Budget <15L + Large Family + Highway + Public + Premium: no_strong_matches
- Budget 30L+ + Single + City + Home + Running Cost: no_strong_matches
- Premium priority on budget band <15L: no_strong_matches
- Large family on 30L+ with running-cost priority: no_strong_matches
- City commuter profile with 30L+ budget: no_strong_matches
- Public charging + premium + large family + 20–30L: no_strong_matches
- Running cost priority with premium budget and highway: no_strong_matches
- Value focus with large family and 30L+ budget: no_strong_matches
- Family practicality on <15L with city usage: no_strong_matches
- Highway capability with 30L+ and apartment charging: no_strong_matches
- Single city buyer with 30L+ and family practicality: no_strong_matches
- Apartment + premium + <15L: no_strong_matches
- Public charging running-cost buyer on 30L+: no_strong_matches
- Mixed usage large family on 30L+ with value priority: no_strong_matches
- Highway premium on 15–20L with home charging: no_strong_matches
- City large family on 20–30L with running cost: no_strong_matches
- Couple mixed usage premium on <15L: no_strong_matches

## Suggested Improvements

- Review 1 tier-1 vehicle(s) that never appear in strong matches across the full matrix.
- Add headline variation or scenario-aware phrasing in a future narrative polish pass.

## Recommendation Readiness Score


**WARNING** — ready for Phase 15B when overall is PASS or bounded WARNING with no FAIL categories.
