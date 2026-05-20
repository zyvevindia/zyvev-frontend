# Founder live QA — EVSavari

**Duration:** ~20 minutes · **When:** After every production deploy  
**Device:** Desktop + one phone (375px width)

---

## Before you start

1. Confirm Vercel production deploy is green (latest `main` commit).
2. Hard-refresh `https://evsavari.com` (Ctrl+Shift+R).
3. Optional: Admin → **Launch status** (`/admin/launch-status`) → Run launch validation.

---

## Core buyer flows

| # | Flow | Pass |
|---|------|------|
| 1 | Homepage loads — curated sections visible, no pagination controls | ☐ |
| 2 | `/cars/tata-nexon-ev` — hero image is Cloudinary (not grey SVG placeholder) | ☐ |
| 3 | `/cars/mg-comet-ev` — variant switcher works, price updates | ☐ |
| 4 | EMI widget — sliders move, metrics update, **Get Finance Help** scrolls to dealer | ☐ |
| 5 | Dealer section — **Request callback** opens lead modal | ☐ |
| 6 | Submit test lead (use `[QA]` in name) — appears in Admin → Leads | ☐ |
| 7 | Compare — add 2 EVs from listing, `/compare` shows equal-height cards | ☐ |
| 8 | Compare — **Get expert help** / WhatsApp CTA (if number configured) | ☐ |
| 9 | One SEO guide (e.g. `/best-evs/budget-evs`) — loads, vehicle links work | ☐ |

---

## Mobile spot-check (375px)

| # | Check | Pass |
|---|-------|------|
| 10 | Homepage sections stack cleanly | ☐ |
| 11 | Car detail — sticky action bar usable | ☐ |
| 12 | Compare page — no overlapping cards | ☐ |
| 13 | Lead modal — form fields readable, submit works | ☐ |

---

## Ops / CRM

| # | Check | Pass |
|---|-------|------|
| 14 | Admin login works | ☐ |
| 15 | Launch status — API + Cloudinary probes green | ☐ |
| 16 | Media QA — tier-1 families show Cloudinary URLs | ☐ |
| 17 | Delete or mark QA test leads | ☐ |

---

## Sign-off

| Field | Value |
|-------|-------|
| Date | |
| Deploy SHA | |
| Tester | |
| Result | PASS / FAIL |
| Notes | |

If any item fails, see `critical-issue-playbook.md` and `rollback-checklist.md`.
