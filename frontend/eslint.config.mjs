import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "react-compiler/react-compiler": "off",
      "@next/next/no-assign-module-variable": "off",
      "react-hooks/set-state-in-effect": "off"
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
