# `@guaso` blocks registry

Public [shadcn registry](https://ui.shadcn.com/docs/registry) for Guaso schema-bound blocks.

[![license](https://img.shields.io/github/license/guaso-ai/guaso-blocks.svg)](./LICENSE)

**Source of truth:** this repo (`guaso-ai/guaso-blocks`).  
**Content data plane:** [`@guaso-ai/content`](https://github.com/guaso-ai/guaso-content) (npm) — not UI.

## Install

In your Next app `components.json`:

```json
{
  "registries": {
    "@guaso": "https://raw.githubusercontent.com/guaso-ai/guaso-blocks/main/r/{name}.json"
  }
}
```

Smoke (UI kit — **always add together**; zone-alone without renderers is unsupported). Does **not** install `@guaso-ai/content`:

```bash
npx shadcn@latest add @guaso/block-zone @guaso/rich-section @guaso/cta @guaso/gallery @guaso/cards @guaso/testimonials
```

Adapter (maps a Content SDK `getEntry` result to `blocks[]`). This is the item that installs **`@guaso-ai/content@^0.3.0`** (package name — not `@guaso/content`):

```bash
npx shadcn@latest add @guaso/blocks-from-entry
```

Fallback without namespace: `guaso-ai/guaso-blocks/block-zone`.

## Peer matrix

| Peer | Version |
|------|---------|
| Next.js | 15.x \|\| 16.x (apps Guaso = 16; templates fleet = 15.5.x) |
| React | 19.x |
| Tailwind | semantic tokens (`@guaso/tailwind-config` or equivalent CSS vars) |

npm of the **adapter** item (`@guaso/blocks-from-entry`): **`@guaso-ai/content@^0.3.0`**. The UI kit (`block-zone` + skins) has no content npm dependency. `BlockZone` receives `blocks` already mapped.

## Post-install layout

`files[].target` keeps a sibling tree under the project's components alias (e.g. `src/components/`):

```
components/
  block-zone/
    block-zone.tsx
    registry.ts
    types.ts
    blocks-from-entry.ts   # from @guaso/blocks-from-entry, not from block-zone
  rich-section/
    rich-section.tsx
  cta/
    cta.tsx
  gallery/
    gallery.tsx
  cards/
    cards.tsx
  testimonials/
    testimonials.tsx
```

Relative imports (`./types`, `../gallery/gallery`, `../block-zone/types`) resolve after `shadcn add`. ⛔ do not flatten into `lib/`.

## Canonical block types

| Registry item | `type` (PascalCase) |
|---------------|---------------------|
| `@guaso/rich-section` | `RichSection` |
| `@guaso/gallery` | `Gallery` |
| `@guaso/cards` | `Cards` |
| `@guaso/testimonials` | `Testimonials` |
| `@guaso/cta` | `CTA` |

Plus `@guaso/block-zone` (zone + map; receives `blocks`). Adapter `@guaso/blocks-from-entry` (`blocksFromEntry`). Unknown `type` → ignored (forward-compat).

## Usage sketch

`createClient` is host + the **adapter** add (npm). `BlockZone` does not install the SDK.

```tsx
import { createClient } from "@guaso-ai/content";
import { blocksFromEntry } from "@/components/block-zone/blocks-from-entry";
import BlockZone from "@/components/block-zone/block-zone";

const entry = await createClient({…}).getEntry("pages/home");
const blocks = blocksFromEntry(entry);
// entry.empty → blocks null → BlockZone renders nothing (no hardcoded sections)
return <BlockZone blocks={blocks} isOwner={false} />;
```

Unknown `type` → ignored (forward-compat). Empty enabled list → `null`.

## Develop

```bash
npm install
npm run registry:validate
npm run registry:build   # writes r/*.json (commit output)
npm test
npm run assert-no-hex
```

## Docs

- `CROSS_TEMPLATE.md` — what is unified vs template skin (#3065)
- `llms.txt` — machine-readable kit index (5 types + adapter)
- Issue: guaso-ai/guaso-app#3091 (kit complete) · #3063 (v1 partial) · fleet adoption: #3065 · adapter npm: #3579

## Disclaimers

- This repo distributes **UI source** via the shadcn registry (copied into your app). It is not a hosted Guaso service.
- Data plane is separate: use `@guaso-ai/content` + a Guaso-issued content token. This registry does **not** grant Neon access or HTTP write APIs. Adding BlockZone does **not** connect your site to content.
- Block `data` must match Guaso’s canonical content schema. ⛔ invent props outside that schema / hardcode sections as a substitute for content.
- Software is provided **AS IS**, without warranty or SLA for the registry or installed components.
- “Guaso” is a trademark; nominative use is OK and does not imply endorsement.
- The MIT license of this repository is **not** Guaso’s Terms of Service or the Guaso Content capability contract. See https://guaso.link/legal.

## License

MIT — see `LICENSE` and `NOTICE`.
