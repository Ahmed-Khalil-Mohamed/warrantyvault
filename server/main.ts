import { resolve } from "node:path";
import { Store } from "./store";
import { makeApp } from "./app";
const production =
  process.argv[1]?.endsWith(".js") || process.env.NODE_ENV === "production";
const store = new Store(
  resolve(process.env.DATA_DIR ?? "data", "warrantyvault.sqlite"),
);
const app = makeApp(store, {
  production,
  staticDir: production ? resolve("dist") : undefined,
  allowDemo: process.env.ALLOW_DEMO !== "false",
});
if (!production) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT ?? 4317);
const server = app.listen(port, process.env.HOST ?? "127.0.0.1", () =>
  console.log(`WarrantyVault ready at http://localhost:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    server.close(() => {
      store.close();
      process.exit(0);
    });
  });
