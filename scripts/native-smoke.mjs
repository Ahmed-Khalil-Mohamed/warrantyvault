import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const names = ["WarrantyVault"];
for (const name of names) {
  const data = await mkdtemp(join(tmpdir(), "impact-native-"));
  try {
    const child = spawn(
      resolve("release", name, name + ".exe"),
      ["--smoke-test"],
      {
        env: {
          ...process.env,
          IMPACT_DATA_DIR: data,
          IMPACT_SCREENSHOT_DIR: resolve("docs/screenshots"),
        },
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    child.stdout.on("data", (x) => (output += x));
    child.stderr.on("data", (x) => (output += x));
    const code = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", resolve);
    });
    if (
      code !== 0 ||
      !output.includes("DESKTOP_SMOKE " + name.toLowerCase()) ||
      !output.includes('"desktop":true') ||
      !output.includes('"icon":true') ||
      !output.includes('"splashClosed":true') ||
      !output.includes('"splash":true') ||
      !output.includes(name + " | ")
    )
      throw Error(name + " failed: " + output);
    console.log(output.trim());
  } finally {
    await rm(data, { recursive: true, force: true });
  }
}
