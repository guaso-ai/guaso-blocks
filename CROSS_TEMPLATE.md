# Cross-template diff — registry baseline vs fleet skins

Source of truth for what this kit unifies vs what stays in `guaso-template-*` (#3065).

| Área | Unificado en registry | Queda skin (#3065 / templates) |
|------|----------------------|--------------------------------|
| `registry.ts` | byte-idéntico lookup + unknown→undefined | — |
| `types.ts` / fields | = `_CANONICAL_BLOCKS` + `safeHref` | comentarios locales |
| `BlockZone` | filter enabled + ignore unknown; `isOwner` prop (no `draftMode`) | import `Block` desde `@/lib/products` (store) vs content; draftMode wrapper |
| RichSection | title/body/cta/align/image + empty guard | TitleWithAccent, hairline, eyebrow, radii/sombras por vertical |
| CTA | headline/subtext/button + safeHref + empty (unión clinic/store) | mesh-hero, grain, orbs, Smile/lucide, bg treatments |

## Aesthetic tokens (intersección)

Allowed utility tokens only: `text-foreground`, `text-primary`, `bg-primary`, `font-heading`, `border-border`, `bg-card`, `text-muted-foreground`, `text-primary-foreground`.

⛔ `TitleWithAccent`, `grain-overlay`, `mesh-hero`, `hairline`, orbs, hex literals, hardcoded eyebrow (“Sobre nosotros”), store/clinic-only looks.
