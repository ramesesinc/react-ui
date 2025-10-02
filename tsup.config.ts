import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/utils.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  shims: false,
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".mjs",
    };
  },
});
