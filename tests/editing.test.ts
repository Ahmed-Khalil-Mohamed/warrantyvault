import { test } from "node:test";
import assert from "node:assert/strict";
import { projects } from "../src/projects";
import { Store } from "../server/store";
import { editFields } from "../src/editing";

for (const p of projects) {
  test(`${p.name}: editing persists descriptions, preserves history and rejects stale or unsafe writes`, () => {
    const db = new Store(":memory:");
    try {
      const a = db.addUser("a@edit.test", "", "A"),
        b = db.addUser("b@edit.test", "", "B");
      const entry = db.seed(a.id, p)[0];
      const input = Object.fromEntries(
        editFields(p).map((field) => [field.key, entry.data[field.key] ?? ""]),
      );
      const titleKey =
        p.id === "queuewise"
          ? "name"
          : p.id === "recall"
            ? "question"
            : "title";
      input[titleKey] = "Corrected description";
      const updated = db.edit(a.id, p, entry.id, entry.version, input);
      assert.equal(p.title(updated.data), "Corrected description");
      assert.equal(updated.version, entry.version + 1);
      for (const key of Object.keys(entry.data).filter(
        (key) => !(key in input),
      ))
        assert.deepEqual(updated.data[key], entry.data[key]);
      assert.equal(db.history(a.id, p.id)[0].action, "edited");
      assert.throws(
        () => db.edit(a.id, p, entry.id, entry.version, input),
        (e: any) => e.code === "conflict",
      );
      assert.throws(
        () => db.edit(b.id, p, entry.id, updated.version, input),
        (e: any) => e.status === 404,
      );
      assert.throws(() =>
        db.edit(a.id, p, entry.id, updated.version, {
          ...input,
          status: "forged",
          amount: 0,
          quantity: -1,
        }),
      );
      assert.throws(() =>
        db.edit(a.id, p, entry.id, updated.version, {
          ...input,
          [titleKey]: "",
        }),
      );
      assert.equal(db.get(a.id, p.id, entry.id).version, updated.version);
    } finally {
      db.close();
    }
  });
}
