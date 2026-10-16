import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /content\/products\/products\.json$/,
        replacement: path.join(root, "tests/fixtures/products.json"),
      },
      // #4287: el dialog vendorizado vive en registry/dialog; al instalar es @components/ui/dialog.tsx.
      {
        find: /^@\/components\/ui\/dialog$/,
        replacement: path.join(root, "registry/dialog/dialog.tsx"),
      },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
