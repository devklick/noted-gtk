import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";

interface AppAboutDialogParams {
  appName: string;
  parent: Gtk.Window;
  autoPresent?: boolean;
}
export default class AppAboutDialog extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "AppAboutDialog" }, this);
  }

  constructor({ appName, parent, autoPresent = true }: AppAboutDialogParams) {
    super();

    // TODO: Load from package.json
    const dialog = new Adw.AboutWindow({
      applicationName: appName,
      version: "1.0.0",
      developerName: "devklick",
      copyright: "© 2022-2025 devklick",
      issueUrl: "https://github.com/devklick/noted-gtk/issues",
      licenseType: Gtk.License.MIT_X11,
      applicationIcon: "emblem-documents", // TODO: Replace with custom icon
      transient_for: parent,
      resizable: false,
    });

    if (autoPresent) {
      dialog.present();
    }
  }
}
