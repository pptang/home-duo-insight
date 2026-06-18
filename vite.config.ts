import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    reactRouter(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: {
    // Bundle these into the SSR server build instead of leaving them as external
    // bare imports. Each ships its ESM entry as an ambiguous `.js` file (reached
    // via the "import" export condition) inside a package with no "type":"module"
    // and no nested dist/esm/package.json marker. Node's local loader applies ESM
    // syntax-detection and resolves the named exports, but Vercel's serverless
    // runtime loader does not — it treats the file as CommonJS and fails to see the
    // named exports, crashing every SSR route with e.g. "does not provide an export
    // named 'Helmet'". Bundling lets Vite resolve the interop at build time, removing
    // the runtime bare imports entirely.
    // (react-helmet-async is slated for removal in bead nae/p96.)
    noExternal: ["react-helmet-async", "lucide-react"],
  },
}));
