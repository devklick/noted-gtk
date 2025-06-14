import GLib from "@girs/glib-2.0";
import Application from "./widgets/Application";

export function main() {
  Application.run(imports.system.programInvocationName, ...ARGV);
}

if (GLib.getenv("NOTED_DEV") === "1") {
  main();
}
