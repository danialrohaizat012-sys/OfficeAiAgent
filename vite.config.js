import { defineConfig } from "vite";

export default defineConfig({
  // three.js memang besar (~155 KB gzip); itu normal untuk dashboard 3D.
  build: { chunkSizeWarningLimit: 800 },
});
