import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // tsconfig'da `jsx: "preserve"` (Next.js talabi), shuning uchun .tsx fayllarni
  // sinovda import qilish uchun JSX ni plugin o'giradi.
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
