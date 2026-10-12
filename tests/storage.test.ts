import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../server/store";
import { projects } from "../src/projects";

test("The database persists on disk and keeps workspaces separate", () => {
  const dir = mkdtempSync(join(tmpdir(), projects[0].id + "-db-"));
  let db: Store | undefined;
  try {
    const file = join(dir, "workspace.sqlite");
    db = new Store(file);
    const a = db.addUser("a@test.invalid", "", "A"),
      b = db.addUser("b@test.invalid", "", "B");
    const rows = db.seed(a.id, projects[0]);
    assert.deepEqual(db.rows(b.id, projects[0].id), []);
    const session = db.session(a.id);
    assert.notEqual(
      db.db.prepare("SELECT token FROM sessions").get()!.token,
      session,
    );
    db.close();
    db = undefined;
    db = new Store(file);
    assert.deepEqual(db.rows(a.id, projects[0].id), rows);
    assert.equal(db.who(session).id, a.id);
    db.logout(session);
    assert.equal(db.who(session), undefined);
  } finally {
    db?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
