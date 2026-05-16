# Mobile Experience Validation

**Goal:** Real buyer usability — not a visual redesign sprint.

## Automated signals

```bash
cd zyvev-backend
npm run ops:mobile-readiness
```

## Manual QA matrix (375px + 390px)

| Flow | Pass criteria |
|------|----------------|
| Homepage | Catalog cards readable; no horizontal scroll |
| Vehicle detail | Trust block + ownership panels scroll; CTA visible |
| Compare | 2–3 vehicles readable; trust panel not clipped |
| SEO guide | Intro + recommendations readable; link to detail works |
| Lead form | Fields tappable; submit success/error clear |

## Performance spot-check

- First load on 4G throttling: home < 5s interactive (subjective)
- SEO guide: single JSON fetch acceptable
- Images: fallback when CDN miss (broken image icon only)

## Real-device matrix (Week 1)

| Device / condition | Detail | Pass |
|--------------------|--------|------|
| Android Chrome | Pixel or Samsung, Chrome latest | ☐ |
| 375px width | iPhone SE class viewport | ☐ |
| Slow 4G (DevTools) | Home + detail interactive < 8s subjective | ☐ |
| Compare 2 vehicles | No horizontal scroll; trust panel readable | ☐ |
| Lead form | Keyboard does not hide submit | ☐ |
| SEO guide | Scroll + CTA to detail | ☐ |

## Sign-off before traffic scale

- [ ] Compare manual pass  
- [ ] Lead submit manual pass  
- [ ] Trust block readable without zoom  
- [ ] Android Chrome pass  
