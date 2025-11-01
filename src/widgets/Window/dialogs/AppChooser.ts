import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import { AppPrefs } from "../../../core/PreferencesManager";
import obj from "../../../core/utils/obj";

const Targets = obj.freezeDeep({
  NotesDir: {
    settingsKey: "default-app-notes-folder",
    contentType: "inode/directory",
  },
  MetaFile: {
    settingsKey: "default-app-notes-meta-file",
    contentType: "application/json",
  },
} as const);

type TargetName = keyof typeof Targets;

type OnChosenFn = (appInfo: Gio.AppInfo) => void;
interface AppChooserDialogParams {
  autoShow?: boolean;
  parent: Gtk.Window;
  target: TargetName;
  onChosen: OnChosenFn;
  appPrefs: AppPrefs;
}

/**
 * @deprecated in Gtk 4.10 as per docs.
 * https://docs.gtk.org/gtk4/class.AppChooserDialog.html
 */
export default class AppChooserDialog extends Gtk.AppChooserDialog {
  static {
    GObject.registerClass({ GTypeName: "AppChoserDialog" }, this);
  }

  static Targets = Targets;

  private onChosen: OnChosenFn;
  private appPrefs: AppPrefs;
  private target: TargetName;

  constructor({
    parent,
    target,
    appPrefs,
    autoShow = true,
    onChosen,
  }: AppChooserDialogParams) {
    super({
      transientFor: parent,
      contentType: AppChooserDialog.Targets[target].contentType,
      modal: true,
    });

    this.onChosen = onChosen;
    this.appPrefs = appPrefs;
    this.target = target;

    this.connect("response", (dialog, response) =>
      this.handleResponse(dialog, response)
    );

    if (!this.tryAutoChoose()) {
      autoShow && this.show();
    }
  }

  private handleResponse(dialog: this, response: number): void {
    if (response === Gtk.ResponseType.OK) {
      const appInfo = dialog.get_app_info();
      const appId = appInfo?.get_id();

      if (appInfo && appId) {
        this.appPrefs.set(Targets[this.target].settingsKey, appId);
        this.onChosen(appInfo);
      }
    }
    dialog.destroy();
  }

  private tryAutoChoose(): boolean {
    const prefsKey = Targets[this.target].settingsKey;
    const appId = this.appPrefs.get(prefsKey);
    if (appId) {
      const appInfo = Gio.AppInfo.get_all().find((a) => a.get_id() === appId);
      if (appInfo) {
        this.onChosen(appInfo);
        return true;
      } else {
        console.log("Error - app not found:", appId);
        this.appPrefs.set(prefsKey, "");
      }
    }
    return false;
  }
}
