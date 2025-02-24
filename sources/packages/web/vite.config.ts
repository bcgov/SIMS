import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
  ],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".vue", ".scss"],
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
    exclude: [
      "vuetify",
      "vuetify/lib/labs/components.mjs",
      "@formio/js",
      "vue-router",
      "vuex",
    ],
  },
  server: {
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          group1: ["@formio/js"],
          group2: ["vue", "vue-router", "vuex", "vuetify"],
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
