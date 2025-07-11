import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable this rule due to ESLint v9 compatibility issues with TypeScript ESLint v6
      "@typescript-eslint/no-unsafe-declaration-merging": "off"
    }
  }
];

export default eslintConfig;
