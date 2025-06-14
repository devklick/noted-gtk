import Application from "./widgets/Application";

export function main() {
  Application.run(imports.system.programInvocationName, ...ARGV);
}
