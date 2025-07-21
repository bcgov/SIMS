import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import { fileURLToPath, URL } from "url";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue({
        template: { transformAssetUrls },
      }),
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
      "process.env.NODE_ENV": JSON.stringify(mode),
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
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    optimizeDeps: {
      exclude: ["vuetify"],
    },
  };
});
