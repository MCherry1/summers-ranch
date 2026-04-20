import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://mrsummersranch.com",
  trailingSlash: "never",
  // "server" means every route is SSR by default. Public pages
  // opt back into prerender via `export const prerender = true` in
  // their frontmatter. Keeps admin routes reliably session-checked
  // while letting the public herd list stay cacheable.
  output: "server",
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "passthrough",
  }),
  build: {
    format: "directory",
  },
  vite: {
    resolve: {
      alias: {
        "~": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
