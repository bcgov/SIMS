import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { fileURLToPath } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false,
          tags: {
            img: ["src"],
            "v-img": ["src"],
          },
        },
      },
    }),
    vuetify({
      autoImport: true,
      styles: {
        configFile: "src/assets/css/global-style-variables.scss",
      },
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
    ],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "~assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "~@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "sass:math";
        `,
        charset: false,
        includePaths: [
          "src/assets/css",
          "node_modules/@formio/js/dist/formio.full.css",
        ],
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
