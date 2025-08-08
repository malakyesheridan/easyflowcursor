import nextConfig from "eslint-config-next";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextConfig,
  {
    ignores: [],
  },
  {
    files: ["src/lib/supabase/server.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
