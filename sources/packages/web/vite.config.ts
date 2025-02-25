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
  define: {
    "process.env": process.env,
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
  server: {
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1600,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
});
