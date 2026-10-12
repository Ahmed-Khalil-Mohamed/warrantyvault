import { readFile } from "node:fs/promises";
import { rcedit } from "rcedit";
import { cp, mkdir, writeFile, rename, access } from "node:fs/promises";
import { resolve, join } from "node:path";
const names = { warrantyvault: "WarrantyVault" };
if (process.platform !== "win32")
  throw Error("Build Windows portable folders on a Windows host.");
await access("dist-electron/main.cjs");
for (const [id, name] of Object.entries(names)) {
  const target = resolve("release", name);
  await mkdir(target, { recursive: true });
  await cp("node_modules/electron/dist", target, { recursive: true });
  const appDir = join(target, "resources", "app");
  await mkdir(appDir, { recursive: true });
  await cp("dist", join(appDir, "dist"), { recursive: true });
  await cp("dist-electron", join(appDir, "dist-electron"), { recursive: true });
  await mkdir(join(appDir, "licenses"), { recursive: true });
  await cp("LICENSE", join(appDir, "licenses", "WarrantyVault-MIT.txt"));
  await cp("THIRD-PARTY-NOTICES.md", join(appDir, "THIRD-PARTY-NOTICES.md"));
  await cp(
    "node_modules/@fontsource-variable/manrope/LICENSE",
    join(appDir, "licenses", "Manrope-OFL.txt"),
  );
  await cp(
    "node_modules/@fontsource-variable/noto-sans-arabic/LICENSE",
    join(appDir, "licenses", "Noto-Sans-Arabic-OFL.txt"),
  );
  await writeFile(
    join(appDir, "package.json"),
    JSON.stringify(
      {
        name: id,
        productName: name,
        version: "1.1.0",
        main: "dist-electron/main.cjs",
      },
      null,
      2,
    ),
  );
  await rename(join(target, "electron.exe"), join(target, `${name}.exe`));
  await rcedit(join(target, `${name}.exe`), {
    icon: resolve("public/app-icon.ico"),
    "version-string": {
      ProductName: name,
      FileDescription: `${name} desktop application`,
      OriginalFilename: `${name}.exe`,
    },
    "file-version": "1.1.0",
    "product-version": "1.1.0",
  });
  // Validate the actual executable resources, independent of Explorer's icon cache.
  const executable = await readFile(join(target, `${name}.exe`));
  const icon = await readFile(resolve("public/app-icon.ico"));
  for (let i = 0; i < icon.readUInt16LE(4); i++) {
    const entry = 6 + i * 16,
      length = icon.readUInt32LE(entry + 8),
      offset = icon.readUInt32LE(entry + 12);
    if (executable.indexOf(icon.subarray(offset, offset + length)) < 0)
      throw Error("Executable icon resource missing");
  }
  console.log(`${name}: all 7 custom icon resources verified`);
  await writeFile(
    join(target, "READ-ME.txt"),
    `${name} for Windows x64\r\n\r\nRun ${name}.exe from this folder. Keep every included file beside it.\r\nYour SQLite database is stored in %APPDATA%\\${name}.\r\nClose the app before backing up that directory.\r\nThis local build is unsigned. Source, tests, and limitations are in the repository.\r\nNo internet connection is needed to use this application.\r\n`,
  );
  console.log(`${name}: ${target}`);
}
