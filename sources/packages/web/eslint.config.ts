import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig(
  ...pluginVue.configs["flat/strongly-recommended"],
  ...vueTsEslintConfig(),
  {
    files: ["**/*.ts", "**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/valid-attribute-name": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Prettier config must be last to disable conflicting formatting rules.
  eslintConfigPrettier,
);
