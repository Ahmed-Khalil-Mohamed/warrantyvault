import express from "express";
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { resolve } from "node:path";
import { z, ZodError } from "zod";
import { findProject, projects } from "../src/projects";
import { DomainError, money, text } from "../src/contracts";
import { Store } from "./store";
const derive = promisify(scrypt);
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${((await derive(password, salt, 64)) as Buffer).toString("hex")}`;
}
async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = (await derive(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const credentials = z.object({
  email: z
    .string()
    .email()
    .max(200)
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(12).max(128),
});
const requestAction = z
  .object({
    version: z.number().int().positive(),
    action: text,
    payload: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export function makeApp(
  store: Store,
  options: {
    desktopToken?: string;
    desktopApp?: string;
    production?: boolean;
    staticDir?: string;
    allowDemo?: boolean;
  } = {},
) {
  const app = express();
  const cookieName = `${projects[0].id}_session`;
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY);
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
    if (options.production)
      res.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      );
    next();
  });
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD"].includes(req.method)) {
      if (req.get("X-Requested-With") !== "warrantyvault")
        return res.status(403).json({ error: "request_origin" });
      const origin = req.get("Origin");
      if (origin && origin !== `${req.protocol}://${req.get("host")}`)
        return res.status(403).json({ error: "request_origin" });
    }
    next();
  });
  app.use(express.json({ limit: "256kb" }));
  const attempts = new Map<string, { count: number; until: number }>();
  app.use("/api/auth", (req, res, next) => {
    const now = Date.now();
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    const key = req.ip ?? "local";
    const item = attempts.get(key) ?? { count: 0, until: now + 600000 };
    item.count++;
    attempts.set(key, item);
    if (item.count > 30) return res.status(429).json({ error: "rate_limit" });
    next();
  });
  const cookie = (req: express.Request) => {
    const value = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(cookieName + "="));
    return value?.slice(cookieName.length + 1) ?? "";
  };
  const setSession = (res: express.Response, id: string) =>
    res.cookie(cookieName, store.session(id), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 86400000,
      path: "/",
    });
  const publicUser = (u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    demo: !!u.demo,
    desktop: !!options.desktopToken,
  });
  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.post("/api/auth/register", async (req, res) => {
    const input = credentials.extend({ name: text }).strict().parse(req.body);
    if (store.userByEmail(input.email))
      throw new DomainError("email_exists", 409);
    const hash = await hashPassword(input.password);
    if (store.userByEmail(input.email))
      throw new DomainError("email_exists", 409);
    const user = store.addUser(input.email, hash, input.name);
    setSession(res, user.id);
    res.status(201).json(publicUser(user));
  });
  app.post("/api/auth/login", async (req, res) => {
    const input = credentials.strict().parse(req.body);
    const u = store.userByEmail(input.email);
    const fallback = "00000000000000000000000000000000:" + "0".repeat(128);
    const valid = await verifyPassword(input.password, u?.password || fallback);
    if (!u || !valid || u.demo) throw new DomainError("invalid_login", 401);
    setSession(res, u.id);
    res.json(publicUser(u));
  });
  app.post("/api/auth/demo", (req, res) => {
    if (options.allowDemo === false)
      throw new DomainError("demo_disabled", 403);
    const u = store.addUser(
      `demo-${randomUUID()}@example.invalid`,
      "",
      "Demo workspace",
      true,
    );
    setSession(res, u.id);
    res.status(201).json(publicUser(u));
  });
  app.post("/api/auth/logout", (req, res) => {
    store.logout(cookie(req));
    res.clearCookie(cookieName, { path: "/" });
    res.json({ ok: true });
  });
  app.use("/api", (req, res, next) => {
    let u;
    if (options.desktopToken) {
      const supplied = req.get("X-Desktop-Token") ?? "";
      const x = Buffer.from(supplied),
        y = Buffer.from(options.desktopToken);
      if (x.length === y.length && timingSafeEqual(x, y)) u = store.localUser();
    } else u = store.who(cookie(req));
    if (!u) return res.status(401).json({ error: "unauthorized" });
    res.locals.user = u;
    next();
  });
  app.get("/api/me", (_req, res) => res.json(publicUser(res.locals.user)));
  app.param("appId", (req, res, next, id) => {
    const p = findProject(id);
    if (!p || (options.desktopApp && id !== options.desktopApp))
      return res.status(404).json({ error: "not_found" });
    res.locals.project = p;
    next();
  });
  app.get("/api/:appId/entries", (_req, res) =>
    res.json(store.rows(res.locals.user.id, res.locals.project.id)),
  );
  app.get("/api/:appId/events", (_req, res) =>
    res.json(store.history(res.locals.user.id, res.locals.project.id)),
  );
  app.post("/api/:appId/entries", (req, res) =>
    res
      .status(201)
      .json(store.create(res.locals.user.id, res.locals.project, req.body)),
  );
  app.post("/api/:appId/seed", (_req, res) =>
    res.status(201).json(store.seed(res.locals.user.id, res.locals.project)),
  );
  app.post("/api/:appId/entries/:id/action", (req, res) => {
    const { version, action, payload } = requestAction.parse(req.body);
    res.json(
      store.action(
        res.locals.user.id,
        res.locals.project,
        req.params.id as string,
        version,
        action,
        payload,
      ),
    );
  });
  app.patch("/api/:appId/entries/:id", (req, res) => {
    const { version, input } = z
      .object({
        version: z.number().int().positive(),
        input: z.record(z.string(), z.unknown()),
      })
      .strict()
      .parse(req.body);
    res.json(
      store.edit(
        res.locals.user.id,
        res.locals.project,
        req.params.id as string,
        version,
        input,
      ),
    );
  });
  app.delete("/api/:appId/entries/:id", (req, res) => {
    const { version } = z
      .object({ version: z.number().int().positive() })
      .strict()
      .parse(req.body);
    store.remove(
      res.locals.user.id,
      res.locals.project.id,
      req.params.id as string,
      version,
    );
    res.json({ ok: true });
  });
  app.post("/api/:appId/next", (_req, res) => {
    if (res.locals.project.id !== "queuewise")
      throw new DomainError("not_found", 404);
    res.json(store.next(res.locals.user.id, res.locals.project));
  });
  app.post("/api/:appId/settle", (req, res) => {
    if (res.locals.project.id !== "fairshare")
      throw new DomainError("not_found", 404);
    const { from, to, amount } = z
      .object({ from: text, to: text, amount: money })
      .strict()
      .parse(req.body);
    res.status(201).json(store.settle(res.locals.user.id, from, to, amount));
  });
  app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof ZodError)
        return res.status(400).json({
          error: "invalid_input",
          fields: err.issues.map((i) => i.path.join(".")),
        });
      if (err instanceof DomainError)
        return res.status(err.status).json({ error: err.code });
      if (err.type === "entity.parse.failed")
        return res.status(400).json({ error: "invalid_input" });
      if (err.type === "entity.too.large")
        return res.status(413).json({ error: "too_many" });
      console.error("Request failed:", err?.name);
      return res.status(500).json({ error: "server_error" });
    },
  );
  if (options.staticDir) {
    app.use(express.static(options.staticDir));
    app.get("/{*path}", (_req, res) =>
      res.sendFile(resolve(options.staticDir!, "index.html")),
    );
  }
  return app;
}
