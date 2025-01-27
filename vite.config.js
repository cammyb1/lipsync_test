import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["wlipsync"],
    esbuildOptions: {
      supported: {
        "top-level-await": true,
      },
    },
  },
});
