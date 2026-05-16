# Media quality checklist

Use before marking a variant `governance.status: published`.

## Authenticity

- [ ] Hero shows **correct brand, model generation, and body style**
- [ ] Trim-specific wheels, grille, and lighting match variant name
- [ ] No ICE-only or international-spec visuals
- [ ] No watermarks from press sites or dealers
- [ ] No AI-generated or heavily altered body lines

## Technical

- [ ] Minimum 1600px on long edge (hero); 1200px for thumbs
- [ ] JPEG or WebP, sRGB, &lt; 350 KB per listing asset (hero &lt; 500 KB)
- [ ] Sharp at 16:10 crop (listing) — vehicle centered, roof not clipped
- [ ] Consistent lighting (daylight exterior preferred for listing)

## Set completeness

- [ ] `hero.jpg`
- [ ] `listing-thumb.jpg` (or verified alias of hero crop)
- [ ] `compare-thumb.jpg`
- [ ] `og.jpg` (1200×630, text-safe margins)
- [ ] `exterior-1..3.jpg`
- [ ] `interior-1.jpg` (dashboard / screen if tech-focused)
- [ ] `charging-port.jpg` (CCS2 visible for India)

## CDN

- [ ] Uploaded to `cdn.evsavari.com/catalog/{slug}/`
- [ ] URLs return HTTP 200 in incognito
- [ ] `node audit-media.mjs` passes

## Sign-off

- [ ] Content lead
- [ ] Engineering spot-check on staging listing + compare + detail OG
