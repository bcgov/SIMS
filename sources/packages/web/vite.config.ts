import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({

  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  resolve: {
    extensions: [
      ".mjs",
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
      ".vue",
      ".scss",
      ".svg",
    ],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        outputStyle: "compressed",
      },
    },
    devSourcemap: true,
  },
  define: {
    "process.env": process.env,
  },
  optimizeDeps: {
    include: ["vuetify", "@formio/js"],
    exclude: ["vuetify/lib/labs/components.mjs"],
  },
  server: {
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          group1: ["@bcgov/bc-sans", "@formio/js", "@mdi/font", "@mdi/js"],
          group2: ["vue", "vue-router", "vuex", "vuetify"],
        },
      },
    },
  },
});
