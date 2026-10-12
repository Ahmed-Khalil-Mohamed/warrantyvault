import { app, BrowserWindow, ipcMain, dialog, nativeImage } from "electron";
import { randomBytes } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { makeApp } from "../server/app";
import { Store } from "../server/store";
import { findProject } from "../src/projects";
import { makePlan, applyPlan, undoPlan, type Plan } from "./organizer";
import type { AddressInfo } from "node:net";
async function boot() {
  const here = join(
    app.isPackaged ? app.getAppPath() : process.cwd(),
    "dist-electron",
  );
  const requested = "warrantyvault";
  const project = findProject(requested);
  if (!project || project.kind !== "desktop")
    throw Error(
      "Choose filenest, warrantyvault, stockroom, fairshare or recall.",
    );
  app.setName(project.name);
  app.setAppUserModelId("portfolio.warrantyvault");
  const userDir =
    process.env.IMPACT_DATA_DIR ?? join(app.getPath("appData"), project.name);
  mkdirSync(userDir, { recursive: true });
  app.setPath("userData", userDir);
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  await app.whenReady();
  const store = new Store(join(userDir, "workspace.sqlite"));
  const token = randomBytes(32).toString("hex");
  const staticDir = resolve(here, "../dist");
  const api = makeApp(store, {
    desktopToken: token,
    desktopApp: project.id,
    production: true,
    staticDir,
    allowDemo: false,
  });
  const server = api.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  let plan: Plan | undefined;
  const receiptPath = join(userDir, "last-move.json");
  let busy = false;
  const smoke = process.argv.includes("--smoke-test");
  const usesSplash = true;
  const iconPath = join(staticDir, "app-icon.ico");
  if (nativeImage.createFromPath(iconPath).isEmpty())
    throw Error("Application icon is missing");
  let startupReady: Promise<void>;
  let splash: BrowserWindow | undefined;
  function createWindow() {
    const startedAt = Date.now();
    let splashLoaded: Promise<void> = Promise.resolve();
    if (usesSplash) {
      splash = new BrowserWindow({
        width: 620,
        height: 340,
        frame: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        show: false,
        skipTaskbar: true,
        backgroundColor: "#203b48",
        icon: iconPath,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      splash.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      splash.webContents.on("will-navigate", (event) => event.preventDefault());
      splash.once("ready-to-show", () => {
        if (!smoke && !splash?.isDestroyed()) splash?.show();
      });
      const splashPainted = new Promise<void>((resolve) =>
        splash!.once("ready-to-show", () => resolve()),
      );
      splashLoaded = Promise.all([
        splash.loadFile(join(staticDir, "splash.html")),
        splashPainted,
      ]).then(() => undefined);
    }

    const win = new BrowserWindow({
      width: 1360,
      height: 900,
      minWidth: 760,
      minHeight: 640,
      title: project!.name,
      show: false,
      icon: iconPath,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(here, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });
    win.webContents.session.webRequest.onBeforeSendHeaders(
      { urls: [origin + "/*"] },
      (details, callback) =>
        callback({
          requestHeaders: {
            ...details.requestHeaders,
            "X-Desktop-Token": token,
          },
        }),
    );
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (event, url) => {
      if (new URL(url).origin !== origin) event.preventDefault();
    });
    win.webContents.session.setPermissionRequestHandler(
      (_wc, _permission, callback) => callback(false),
    );
    const painted = new Promise<void>((resolve) =>
      win.once("ready-to-show", () => resolve()),
    );
    startupReady = (async () => {
      await Promise.all([
        win.loadURL(`${origin}/${project!.id}`),
        splashLoaded,
        painted,
      ]);
      if (
        smoke &&
        process.env.IMPACT_SCREENSHOT_DIR &&
        splash &&
        !splash.isDestroyed()
      ) {
        mkdirSync(process.env.IMPACT_SCREENSHOT_DIR, { recursive: true });
        writeFileSync(
          join(process.env.IMPACT_SCREENSHOT_DIR, "splash.png"),
          (
            await splash.webContents.capturePage(undefined, {
              stayHidden: true,
              stayAwake: true,
            })
          ).toPNG(),
        );
      }
      if (usesSplash && !smoke)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, 900 - (Date.now() - startedAt))),
        );
      if (!win.isDestroyed() && !smoke) win.show();
      if (splash && !splash.isDestroyed()) splash.destroy();
    })();
    startupReady.catch((error) => {
      console.error(error);
      app.exit(1);
    });
    return win;
  }
  const win = createWindow();
  app.on("second-instance", () => {
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  ipcMain.handle("files:operation", async (event, operation: unknown) => {
    if (
      project.id !== "filenest" ||
      event.sender !== win.webContents ||
      event.senderFrame?.url !== `${origin}/filenest` ||
      busy
    )
      throw Error("File operation unavailable");
    if (!["preview", "apply", "undo"].includes(String(operation)))
      throw Error("Unknown operation");
    busy = true;
    try {
      if (operation === "preview") {
        const selection = await dialog.showOpenDialog(win, {
          properties: ["openDirectory"],
          title: "Select a folder to organize",
        });
        if (selection.canceled) return null;
        const rules = store
          .rows(store.localUser().id, "filenest")
          .map((e) => e.data);
        plan = await makePlan(selection.filePaths[0], rules as any);
        return { kind: "preview", ...plan };
      }
      if (operation === "apply") {
        if (!plan) throw Error("Preview a folder first");
        const result = await applyPlan(plan, receiptPath);
        plan = undefined;
        return { kind: "receipt", ...result };
      }
      return { kind: "receipt", ...(await undoPlan(receiptPath)) };
    } finally {
      busy = false;
    }
  });
  if (process.argv.includes("--smoke-test")) {
    win.webContents.once("did-finish-load", async () => {
      try {
        const result = await win.webContents.executeJavaScript(
          `Promise.all([fetch('/api/me').then(r=>r.json()),fetch('/api/${project.id}/entries').then(r=>r.json())]).then(([user,entries])=>({desktop:user.desktop,entries:Array.isArray(entries),title:document.title}))`,
        );
        await startupReady;
        await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{
          const deadline=Date.now()+6000;
          const check=()=>{if(document.querySelector('.workspace-body')&&!document.querySelector('.empty-state[role="status"]'))resolve(true);else if(Date.now()>deadline)reject(Error('Workspace did not render'));else setTimeout(check,50)};check();
        }).then(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));})`);
        const branding = {
          splash: usesSplash,
          splashClosed: !splash || splash.isDestroyed(),
          icon: !nativeImage.createFromPath(iconPath).isEmpty(),
          framelessSplash: usesSplash,
        };
        if (process.env.IMPACT_SCREENSHOT_DIR) {
          mkdirSync(process.env.IMPACT_SCREENSHOT_DIR, { recursive: true });
          writeFileSync(
            join(process.env.IMPACT_SCREENSHOT_DIR, "native.png"),
            (
              await win.webContents.capturePage(undefined, {
                stayHidden: true,
                stayAwake: true,
              })
            ).toPNG(),
          );
        }
        console.log(
          "DESKTOP_SMOKE",
          project.id,
          JSON.stringify({ ...result, ...branding }),
        );
        if (!branding.icon || !branding.splashClosed) process.exitCode = 1;
        if (!result.desktop || !result.entries) process.exitCode = 1;
      } catch (e) {
        console.error(e);
        process.exitCode = 1;
      }
      app.quit();
    });
    setTimeout(() => {
      console.error("Desktop smoke test timed out");
      app.exit(1);
    }, 20000).unref();
  }
  let quitting = false;
  app.on("window-all-closed", () => {
    if (!quitting) app.quit();
  });
  app.on("before-quit", (event) => {
    if (quitting) return;
    event.preventDefault();
    quitting = true;
    for (const window of BrowserWindow.getAllWindows()) window.destroy();
    server.close(() => {
      store.close();
      app.exit(Number(process.exitCode ?? 0));
    });
    setTimeout(() => server.closeAllConnections(), 1000).unref();
  });
}
boot().catch((error) => {
  console.error(error);
  app.exit(1);
});
