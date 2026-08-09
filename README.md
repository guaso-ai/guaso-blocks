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

Smoke (v1 trio — **always add together**; zone-alone without renderers is unsupported):

```bash
npx shadcn@latest add @guaso/block-zone @guaso/rich-section @guaso/cta
```

Fallback without namespace: `guaso-ai/guaso-blocks/block-zone`.

## Peer matrix

| Peer | Version |
|------|---------|
| Next.js | 15.x |
| React | 19.x |
| Tailwind | semantic tokens (`@guaso/tailwind-config` or equivalent CSS vars) |

npm dependency of `block-zone`: **`@guaso-ai/content`** (package name — not `@guaso/content`).

## Post-install layout

`files[].target` keeps a sibling tree under the project's components alias (e.g. `src/components/`):

```
components/
  block-zone/
    block-zone.tsx
    registry.ts
    types.ts
    blocks-from-entry.ts
  rich-section/
    rich-section.tsx
  cta/
    cta.tsx
```

Relative imports (`./types`, `../rich-section/rich-section`, `../block-zone/types`) resolve after `shadcn add`. ⛔ do not flatten into `lib/`.

## Usage sketch

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
- Issue: guaso-ai/guaso-app#3063 · fleet adoption: #3065

## Disclaimers

- This repo distributes **UI source** via the shadcn registry (copied into your app). It is not a hosted Guaso service.
- Data plane is separate: use `@guaso-ai/content` + a Guaso-issued content token. This registry does **not** grant Neon access or HTTP write APIs.
- Block `data` must match Guaso’s canonical content schema. ⛔ invent props outside that schema / hardcode sections as a substitute for content.
- Software is provided **AS IS**, without warranty or SLA for the registry or installed components.
- “Guaso” is a trademark; nominative use is OK and does not imply endorsement.
- The MIT license of this repository is **not** Guaso’s Terms of Service or the Guaso Content capability contract. See https://guaso.link/legal.

## License

MIT — see `LICENSE` and `NOTICE`.
