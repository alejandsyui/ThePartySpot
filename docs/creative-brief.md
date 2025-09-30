# Creative Brief & Asset Guidance

## Brand positioning
- **Business**: The Party Spot – multi-use event venue hosting kids birthdays, adult celebrations, corporate mixers, and community gatherings.
- **Experience promise**: Energetic, polished, stress-free; the venue handles logistics while guests focus on celebrating.
- **Visual vibe**: Vibrant neon accents balanced with upscale lighting, playful decor, candid smiles, and immersive room setups that feel premium yet approachable.

## Stock imagery direction (temporary placeholders)
Use high-resolution photography (minimum 4000×2500) until the team replaces assets with official shoots. Prioritize images with authentic expressions, diverse guests, and good lighting.

| Scene | What to look for | Suggested search keywords |
| --- | --- | --- |
| Kids birthday takeover | Colorful balloon installs, dessert tables, cake cutting, parents interacting. | `kids birthday party venue`, `balloon garland celebration`, `family party indoors` |
| Teen glow/LED party | Blacklight effects, neon wristbands, DJ booth, dance floor energy. | `neon party dance floor`, `LED event venue`, `teen dance party lights` |
| Adult milestone (30th/40th) | Champagne toasts, lounge seating, marquee numbers, classy decor. | `birthday celebration venue upscale`, `champagne toast event`, `balloon numbers party` |
| Corporate mixer/workshop | Team-building, catering spreads, projection screens, professional-yet-fun vibe. | `corporate event space modern`, `networking event happy hour`, `team workshop celebration` |
| Seasonal/holiday | Festive lighting, themed centerpieces, group shots with seasonal colors. | `holiday party venue`, `winter celebration lights`, `summer party rooftop indoor` |
| Add-on highlights | Photo booth strips, cotton candy cart, bounce house, arcade machines. | `event add-on photo booth`, `cotton candy station party`, `indoor bounce house party` |

### Recommended free stock libraries
- **Unsplash** – Curated, natural lighting; search terms above produce high-quality options.
- **Pexels** – Larger catalog for party and corporate imagery; filter by orientation and size.
- **Pixabay** – Supplemental for add-on props (photo booths, concessions) when others lack options.

When downloading, favor RAW or highest JPEG quality. Store interim assets under `apps/web/public/images/placeholders/` with descriptive names (e.g., `kids-birthday-balloons.jpg`). Keep a spreadsheet noting source URL and license for attribution records.

## Content control implications
These placeholder assets will be swappable through the planned Admin Control Center gallery module:
1. **Media Library** – Admin uploads venue photos, assign tags (e.g., `kids`, `corporate`, `add-on`).
2. **Page Builder Blocks** – Each hero/section references tagged images; updating a tag updates live pages instantly.
3. **Add-on Catalog** – Distinct image slot per add-on card to showcase rentals and upsells.

## Immediate creative to-dos
- Create `apps/web/public/images/placeholders/` and populate with 6–8 curated stock photos.
- Draft design wireframes for homepage hero, booking CTA strip, and gallery carousel using placeholders.
- Define color grading preset in Tailwind (`brand` palette already started) to ensure consistent overlays.
- Schedule venue-specific photo shoot once admin media library is ready (deliver shot list based on sections above).

## Long-term asset workflow
1. Upload new photos via admin desktop app (media module enforces min resolution and aspect ratios).
2. Generate responsive crops and WebP versions during upload (Supabase storage + Edge Function).
3. Auto-invalidate Astro static pages via webhook to refresh with latest images.
4. Archive retired assets while keeping analytics on which images drive conversions.
