// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const stripReactQuerySourceMap = (): Plugin => ({
  name: "strip-react-query-sourcemap",
  transform(code, id) {
    if (id.includes("@tanstack/react-query/build/modern/useMutationState.js")) {
      return code.replace(/\/\/\# sourceMappingURL=.*$/gm, "");
    }
    return null;
  },
});

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    optimizeDeps: {
      exclude: ["canvg", "@tanstack/react-query"],
      esbuildOptions: {
        target: "ES2022",
      },
    },
    build: {
      sourcemap: false,
    },
    plugins: [stripReactQuerySourceMap()],
  },
  tanstackStart: {},
});
