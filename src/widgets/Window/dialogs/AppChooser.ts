import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

interface AppChooserDialogParams {
  autoShow?: boolean;
  parent: Gtk.Window;
  type: "application/json" | "inode/directory";
  onChosen(appInfo: Gio.AppInfo): void;
}

export default class AppChooserDialog extends Gtk.AppChooserDialog {
  static {
    GObject.registerClass({ GTypeName: "AppChoserDialog" }, this);
  }

  constructor({
    parent,
    type,
    autoShow = true,
    onChosen,
  }: AppChooserDialogParams) {
    super({
      transientFor: parent,
      contentType: type,
      modal: true,
    });

    this.connect("response", (dialog, response) => {
      if (response === Gtk.ResponseType.OK) {
        const appInfo = dialog.get_app_info();
        if (appInfo) {
          onChosen(appInfo);
        }
      }
      dialog.destroy();
    });

    if (autoShow) {
      this.show();
    }
  }
}
