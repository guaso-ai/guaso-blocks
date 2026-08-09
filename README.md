# `@guaso` blocks registry

Public [shadcn registry](https://ui.shadcn.com/docs/registry) for Guaso schema-bound blocks.

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

## Usage sketch

```tsx
import { createClient } from "@guaso-ai/content";
import { blocksFromEntry } from "@/components/block-zone/blocks-from-entry"; // path after add
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
