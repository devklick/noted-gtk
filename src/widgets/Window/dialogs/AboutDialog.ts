import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";

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
      version: "v0.0.3",
      developerName: "devklick",
      copyright: "© 2022-2025 devklick",
      issueUrl: "https://github.com/devklick/noted-gtk/issues",
      licenseType: Gtk.License.MIT_X11,
      applicationIcon: "io.github.devklick.noted",
      transient_for: parent,
      resizable: false,
    });

    if (autoPresent) {
      dialog.present();
    }
  }
}
