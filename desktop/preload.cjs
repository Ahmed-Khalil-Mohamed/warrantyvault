const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "desktop",
  Object.freeze({
    files: (operation) => {
      if (!["preview", "apply", "undo"].includes(operation))
        return Promise.reject(new Error("Unsupported operation"));
      return ipcRenderer.invoke("files:operation", operation);
    },
  }),
);
