import {
  readdir,
  lstat,
  realpath,
  mkdir,
  link,
  unlink,
  readFile,
  writeFile,
  rename,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { resolve, join, extname, dirname, basename } from "node:path";
export interface SortRule {
  extensions: string;
  folder: string;
  status: string;
}
export interface PlannedFile {
  name: string;
  folder: string;
  size: number;
  hash: string;
  duplicate: boolean;
}
export interface Plan {
  id: string;
  root: string;
  files: PlannedFile[];
  skipped: number;
}
export interface Receipt {
  root: string;
  files: (PlannedFile & {
    state: "pending" | "moved" | "undone" | "skipped";
    error?: string;
  })[];
  at: string;
}
async function hash(path: string) {
  const digest = createHash("sha256");
  for await (const part of createReadStream(path)) digest.update(part);
  return digest.digest("hex");
}
const safeFolder = (name: string) =>
  /^[\p{L}\p{N} _-]{1,60}$/u.test(name) &&
  !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(name);
async function safePaths(root: string, file: PlannedFile, create = false) {
  if (basename(file.name) !== file.name || !safeFolder(file.folder))
    throw Error("Unsafe file path");
  const currentRoot = await realpath(root);
  if (currentRoot !== root) throw Error("Root directory changed");
  const dir = join(root, file.folder);
  if (create) await mkdir(dir, { recursive: true });
  const info = await lstat(dir);
  if (
    info.isSymbolicLink() ||
    !info.isDirectory() ||
    (await realpath(dir)) !== resolve(root, file.folder)
  )
    throw Error("Unsafe target folder");
  return { source: join(root, file.name), target: join(dir, file.name) };
}
export async function makePlan(
  directory: string,
  rules: SortRule[],
): Promise<Plan> {
  const root = await realpath(directory),
    children = await readdir(root, { withFileTypes: true });
  if (children.length > 2000)
    throw Error("Select a folder with at most 2,000 direct entries.");
  const files: PlannedFile[] = [];
  let skipped = 0;
  for (const child of children) {
    if (!child.isFile() || child.isSymbolicLink()) {
      skipped++;
      continue;
    }
    const rule = rules.find(
      (r) =>
        r.status === "enabled" &&
        r.extensions
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .includes(extname(child.name).slice(1).toLowerCase()),
    );
    if (!rule || !safeFolder(rule.folder)) {
      skipped++;
      continue;
    }
    const path = join(root, child.name),
      info = await lstat(path);
    if (
      info.isSymbolicLink() ||
      !info.isFile() ||
      info.size > 100 * 1024 * 1024
    ) {
      skipped++;
      continue;
    }
    files.push({
      name: child.name,
      folder: rule.folder,
      size: info.size,
      hash: await hash(path),
      duplicate: false,
    });
  }
  const counts = new Map<string, number>();
  for (const f of files) counts.set(f.hash, (counts.get(f.hash) ?? 0) + 1);
  for (const f of files) f.duplicate = counts.get(f.hash)! > 1;
  return { id: randomUUID(), root, files, skipped };
}
async function save(receiptPath: string, receipt: Receipt) {
  await mkdir(dirname(receiptPath), { recursive: true });
  const tmp = receiptPath + ".tmp";
  await writeFile(tmp, JSON.stringify(receipt, null, 2), "utf8");
  await rename(tmp, receiptPath);
}
export async function applyPlan(
  plan: Plan,
  receiptPath: string,
): Promise<Receipt> {
  try {
    const prior = JSON.parse(await readFile(receiptPath, "utf8")) as Receipt;
    await save(receiptPath + "." + randomUUID() + ".json", prior);
  } catch (e: any) {
    if (e.code !== "ENOENT") throw e;
  }
  const receipt: Receipt = {
    root: plan.root,
    at: new Date().toISOString(),
    files: plan.files.map((f) => ({ ...f, state: "pending" })),
  };
  await save(receiptPath, receipt);
  for (const file of receipt.files) {
    try {
      const { source, target } = await safePaths(plan.root, file, true);
      const info = await lstat(source);
      if (
        info.isSymbolicLink() ||
        !info.isFile() ||
        (await hash(source)) !== file.hash
      )
        throw Error("Source changed; skipped");
      await link(source, target);
      try {
        await unlink(source);
      } catch (e) {
        await unlink(target);
        throw e;
      }
      file.state = "moved";
    } catch (e: any) {
      file.state = "skipped";
      file.error =
        e.code === "EEXIST" ? "A destination file already exists." : e.message;
    }
    await save(receiptPath, receipt);
  }
  return receipt;
}
export async function undoPlan(receiptPath: string): Promise<Receipt> {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as Receipt;
  for (const file of receipt.files) {
    if (file.state !== "moved" && file.state !== "pending") continue;
    try {
      const { source, target } = await safePaths(receipt.root, file);
      const info = await lstat(target);
      if (
        info.isSymbolicLink() ||
        !info.isFile() ||
        (await hash(target)) !== file.hash
      )
        throw Error("Moved file changed; kept in place");
      await link(target, source);
      await unlink(target);
      file.state = "undone";
      delete file.error;
    } catch (e: any) {
      file.error =
        e.code === "EEXIST"
          ? "Original name is occupied; kept both files."
          : e.message;
    }
    await save(receiptPath, receipt);
  }
  return receipt;
}
