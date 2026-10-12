import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { makeApp } from "../server/app";
import { Store } from "../server/store";
import { projects } from "../src/projects";
import { editFields } from "../src/editing";
const p = projects[0];

test("HTTP sessions, private records, CSRF, edits and competing writes", async () => {
  const db = new Store(":memory:"),
    server = makeApp(db).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const req = (
    path: string,
    method = "GET",
    data?: unknown,
    cookie = "",
    headers = {},
  ) =>
    fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "warrantyvault",
        cookie,
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  try {
    assert.equal((await req(`/${p.id}/entries`)).status, 401);
    assert.equal(
      (
        await req("/auth/demo", "POST", {}, "", {
          Origin: "https://other.invalid",
        })
      ).status,
      403,
    );
    const registration = await req("/auth/register", "POST", {
      name: "Test owner",
      email: "TEST@example.com",
      password: "test-only-long-password",
    });
    assert.equal(registration.status, 201);
    const cookie = registration.headers.get("set-cookie")!.split(";")[0];
    assert.ok(cookie.startsWith(p.id + "_session="));
    assert.match(registration.headers.get("set-cookie")!, /HttpOnly/);
    assert.match(registration.headers.get("set-cookie")!, /SameSite=Strict/);
    const seeded = await req(`/${p.id}/seed`, "POST", {}, cookie);
    assert.equal(seeded.status, 201);
    const row = (await seeded.json())[0];
    const input = Object.fromEntries(
      editFields(p).map((f) => [f.key, row.data[f.key] ?? ""]),
    );
    const titleKey =
      p.id === "queuewise" ? "name" : p.id === "recall" ? "question" : "title";
    input[titleKey] = "HTTP corrected title";
    const other = (await req("/auth/demo", "POST", {})).headers
      .get("set-cookie")!
      .split(";")[0];
    assert.deepEqual(
      await (await req(`/${p.id}/entries`, "GET", undefined, other)).json(),
      [],
    );
    assert.equal(
      (
        await req(
          `/${p.id}/entries/${row.id}`,
          "PATCH",
          { version: 1, input },
          other,
        )
      ).status,
      404,
    );
    const writes = await Promise.all(
      [1, 2].map(() =>
        req(
          `/${p.id}/entries/${row.id}`,
          "PATCH",
          { version: 1, input },
          cookie,
        ),
      ),
    );
    assert.deepEqual(writes.map((r) => r.status).sort(), [200, 409]);
    assert.equal(
      (
        await req(
          `/${p.id}/entries/${row.id}`,
          "PATCH",
          { version: 2, input: { ...input, paid: 0, quantity: -1 } },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (await req("/not-this-project/entries", "GET", undefined, cookie)).status,
      404,
    );
    assert.equal((await req("/auth/logout", "POST", {}, cookie)).status, 200);
    assert.equal((await req("/me", "GET", undefined, cookie)).status, 401);
    assert.equal(
      (
        await req("/auth/login", "POST", {
          email: "test@example.com",
          password: "test-only-long-password",
        })
      ).status,
      200,
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  }
});

test("Desktop API accepts only the private token and the selected application", async () => {
  const db = new Store(":memory:"),
    server = makeApp(db, {
      desktopToken: "test-private-token",
      desktopApp: p.id,
    }).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  try {
    assert.equal((await fetch(base + "/me")).status, 401);
    assert.equal(
      (await fetch(base + "/me", { headers: { "X-Desktop-Token": "wrong" } }))
        .status,
      401,
    );
    const headers = { "X-Desktop-Token": "test-private-token" };
    assert.equal(
      (await fetch(base + `/${p.id}/entries`, { headers })).status,
      200,
    );
    assert.equal(
      (await fetch(base + "/different/entries", { headers })).status,
      404,
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  }
});
