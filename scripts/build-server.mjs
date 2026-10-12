import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
await build({
  entryPoints: ["server/main.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: "dist-server/main.js",
  sourcemap: true,
});
await build({
  entryPoints: ["desktop/main.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
  outfile: "dist-electron/main.cjs",
  sourcemap: true,
});
await mkdir("dist-electron", { recursive: true });
await copyFile("desktop/preload.cjs", "dist-electron/preload.cjs");
