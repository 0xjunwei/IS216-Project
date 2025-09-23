import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import prettier from "@vue/eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  prettier,
  {
    ignores: ["dist/**", "node_modules/**", "*.config.js"]
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-unused-vars": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "warn"
    }
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vue.parser,
      parserOptions: {
        parser: "@babel/eslint-parser",
        requireConfigFile: false
      }
    }
  }
];