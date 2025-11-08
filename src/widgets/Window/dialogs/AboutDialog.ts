import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import GLib from "@girs/glib-2.0";

interface AboutDialogParams {
  appName: string;
  parent: Gtk.Window;
  autoPresent?: boolean;
}
export default class AboutDialog extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "AboutDialog" }, this);
  }

  constructor({ appName, parent, autoPresent = true }: AboutDialogParams) {
    super();

    // TODO: Load from package.json
    const dialog = new Adw.AboutWindow({
      applicationName: appName,
      version: this.getVersion(),
      developerName: "devklick",
      copyright: "© 2025 devklick",
      issueUrl: "https://github.com/devklick/noted-gtk/issues",
      licenseType: Gtk.License.GPL_3_0_ONLY,
      applicationIcon: "io.github.devklick.noted",
      transient_for: parent,
      resizable: false,
    });

    if (autoPresent) {
      dialog.present();
    }
  }

  private getVersion() {
    const isDev = GLib.getenv("NOTED_DEV") === "1";

    // When running under in prod (flatpak), the imports.package.version is set.
    // This gets set at build time in meson.build, then is
    if (!isDev) return imports.package.version;

    // When running in dev, imports.package.version doesnt get set, because the main.js
    // module is executed directly.
    // There's probably a way to get the version, but it's proving to be hassle, 
    // and it's not worth inesting time in. Return a stubbed value.
    return 'dev-local';
  }
}
