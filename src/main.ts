import GLib from "@girs/glib-2.0";

import Application from "./widgets/Application";

const isDev = GLib.getenv("NOTED_DEV") === "1";

// When running in prod (under flatpak), main.js file is wrapped in build-assets/io.github.devklick.noted.js,
// which expects an exported function called `main` that runs the application.
// However in dev, main.js is simply executed with gjs, so we need to auto-run the main function
export function main() {
  Application.run({ isDev }, imports.system.programInvocationName, ...ARGV);
}

if (isDev) {
  main();
}
