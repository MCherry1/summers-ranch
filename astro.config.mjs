import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://mrsummersranch.com",
  trailingSlash: "never",
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
