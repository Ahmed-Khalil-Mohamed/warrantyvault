import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  DomainError,
  type Data,
  type Entry,
  type Project,
} from "../src/contracts";
import { settlements } from "../src/settlements";
import { editData } from "../src/editing";

export class Store {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
 PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,name TEXT NOT NULL,demo INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS entries(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,app TEXT NOT NULL,version INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,data TEXT NOT NULL CHECK(json_valid(data)));
 CREATE INDEX IF NOT EXISTS entries_workspace ON entries(owner,app,created_at);
 CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,owner TEXT NOT NULL,app TEXT NOT NULL,entry_id TEXT,action TEXT NOT NULL,at TEXT NOT NULL,details TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS events_workspace ON events(owner,app,id);
 PRAGMA user_version=1;`);
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  addUser(email: string, password: string, name: string, demo = false) {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO users(id,email,password,name,demo) VALUES(?,?,?,?,?)",
      )
      .run(id, email, password, name, demo ? 1 : 0);
    return { id, email, name, demo };
  }
  userByEmail(email: string): any {
    return this.db.prepare("SELECT * FROM users WHERE email=?").get(email);
  }
  localUser() {
    return (
      this.userByEmail("local@desktop.invalid") ??
      this.addUser("local@desktop.invalid", "", "Local workspace")
    );
  }
  session(user: string) {
    const token = randomUUID() + randomUUID();
    this.db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
    this.db
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(this.hash(token), user, Date.now() + 86400000);
    return token;
  }
  hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
  who(token: string): any {
    return this.db
      .prepare(
        "SELECT u.id,u.email,u.name,u.demo FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
      )
      .get(this.hash(token), Date.now());
  }
  logout(token: string) {
    this.db.prepare("DELETE FROM sessions WHERE token=?").run(this.hash(token));
  }
  rows(owner: string, app: string): Entry[] {
    return this.db
      .prepare(
        "SELECT * FROM entries WHERE owner=? AND app=? ORDER BY created_at DESC,id",
      )
      .all(owner, app)
      .map((r: any) => this.entry(r));
  }
  entry(r: any): Entry {
    return {
      id: r.id,
      version: r.version,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      data: JSON.parse(r.data),
    };
  }
  get(owner: string, app: string, id: string): Entry {
    const r = this.db
      .prepare("SELECT * FROM entries WHERE id=? AND owner=? AND app=?")
      .get(id, owner, app);
    if (!r) throw new DomainError("not_found", 404);
    return this.entry(r);
  }
  event(
    owner: string,
    app: string,
    id: string,
    action: string,
    details: Data = {},
  ) {
    this.db
      .prepare(
        "INSERT INTO events(owner,app,entry_id,action,at,details) VALUES(?,?,?,?,?,?)",
      )
      .run(
        owner,
        app,
        id,
        action,
        new Date().toISOString(),
        JSON.stringify(details),
      );
  }
  history(owner: string, app: string) {
    return this.db
      .prepare(
        "SELECT id,entry_id,action,at,details FROM events WHERE owner=? AND app=? ORDER BY id DESC LIMIT 100",
      )
      .all(owner, app)
      .map((r: any) => ({ ...r, details: JSON.parse(r.details) }));
  }
  insert(owner: string, app: string, data: Data) {
    if (this.rows(owner, app).length >= 2000) throw new DomainError("too_many");
    const id = randomUUID(),
      now = new Date().toISOString();
    this.db
      .prepare("INSERT INTO entries VALUES(?,?,?,?,?,?,?)")
      .run(id, owner, app, 1, now, now, JSON.stringify(data));
    this.event(owner, app, id, "created");
    return this.get(owner, app, id);
  }
  create(owner: string, p: Project, input: unknown) {
    return this.transaction(() => {
      const data = p.create(p.schema.parse(input), new Date());
      if (
        p.id === "stockroom" &&
        this.rows(owner, p.id).some((x) => x.data.sku === data.sku)
      )
        throw new DomainError("duplicate");
      return this.insert(owner, p.id, data);
    });
  }
  seed(owner: string, p: Project) {
    return this.transaction(() => {
      if (this.rows(owner, p.id).length)
        throw new DomainError("not_empty", 409);
      for (const d of p.seed(new Date())) this.insert(owner, p.id, d);
      return this.rows(owner, p.id);
    });
  }
  action(
    owner: string,
    p: Project,
    id: string,
    version: number,
    action: string,
    payload: unknown,
  ) {
    return this.transaction(() => {
      const entry = this.get(owner, p.id, id);
      if (entry.version !== version) throw new DomainError("conflict", 409);
      const data = p.act(entry.data, action, payload, new Date());
      if (JSON.stringify(data).length > 200000)
        throw new DomainError("record_limit");
      this.db
        .prepare(
          "UPDATE entries SET data=?,version=version+1,updated_at=? WHERE id=? AND owner=?",
        )
        .run(JSON.stringify(data), new Date().toISOString(), id, owner);
      this.event(owner, p.id, id, action);
      return this.get(owner, p.id, id);
    });
  }
  edit(owner: string, p: Project, id: string, version: number, input: unknown) {
    return this.transaction(() => {
      const entry = this.get(owner, p.id, id);
      if (entry.version !== version) throw new DomainError("conflict", 409);
      const data = editData(p, entry.data, input);
      if (JSON.stringify(data).length > 200000)
        throw new DomainError("record_limit");
      this.db
        .prepare(
          "UPDATE entries SET data=?,version=version+1,updated_at=? WHERE id=? AND owner=?",
        )
        .run(JSON.stringify(data), new Date().toISOString(), id, owner);
      this.event(owner, p.id, id, "edited", { title: p.title(data) });
      return this.get(owner, p.id, id);
    });
  }
  remove(owner: string, app: string, id: string, version: number) {
    return this.transaction(() => {
      const entry = this.get(owner, app, id);
      if (entry.version !== version) throw new DomainError("conflict", 409);
      this.db
        .prepare("DELETE FROM entries WHERE id=? AND owner=?")
        .run(id, owner);
      this.event(owner, app, id, "deleted", {
        title: entry.data.title ?? entry.data.name ?? entry.data.question,
      });
    });
  }
  next(owner: string, p: Project) {
    return this.transaction(() => {
      const candidates = this.rows(owner, p.id)
        .filter((x) => x.data.status === "waiting")
        .sort(
          (a, b) =>
            (a.data.priority === "assistance" ? 0 : 1) -
              (b.data.priority === "assistance" ? 0 : 1) ||
            Date.parse(a.data.arrivedAt) - Date.parse(b.data.arrivedAt) ||
            a.id.localeCompare(b.id),
        );
      if (!candidates.length) throw new DomainError("queue_empty");
      const e = candidates[0];
      const data = p.act(e.data, "call", {}, new Date());
      this.db
        .prepare(
          "UPDATE entries SET data=?,version=version+1,updated_at=? WHERE id=?",
        )
        .run(JSON.stringify(data), new Date().toISOString(), e.id);
      this.event(owner, p.id, e.id, "call");
      return this.get(owner, p.id, e.id);
    });
  }
  settle(owner: string, from: string, to: string, amount: number) {
    return this.transaction(() => {
      const suggested = settlements(this.rows(owner, "fairshare"));
      if (
        !suggested.some(
          (s) => s.from === from && s.to === to && s.amount === amount,
        )
      )
        throw new DomainError("conflict", 409);
      return this.insert(owner, "fairshare", {
        title: `${from} → ${to}`,
        kind: "settlement",
        paidBy: from,
        people: [to],
        amount,
        date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    });
  }
  close() {
    this.db.close();
  }
}
