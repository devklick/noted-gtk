import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import PreferencesPageBase from "./PreferencesPageBase";
import { AppPrefs } from "../../../../../core/PreferencesManager";
import Gtk from "@girs/gtk-4.0";
import icon from "../../../../../core/utils/icon";

interface DefaultAppsPageParams {
  prefs: AppPrefs;
  parent: Gtk.Window;
}
export default class DefaultAppsPage extends PreferencesPageBase {
  static {
    GObject.registerClass({ GTypeName: "DefaultAppsPage" }, this);
  }

  constructor({ parent, prefs }: DefaultAppsPageParams) {
    super({
      title: "Default Apps",
      iconName: icon.symbolic("applications-system"),
      parent,
      prefs,
    });

    const group = new Adw.PreferencesGroup({
      title: "Default Apps",
      description:
        "The applications that will be used to when opening folders/files externally",
    });

    const [notesDirRow] = this.createAppPickerRow(
      "Notes Folder",
      "The application to open the Noted notes folder with",
      "inode/directory",
      prefs.get("default-app-notes-folder"),
      (app) => prefs.set("default-app-notes-folder", app.get_id() ?? "")
    );
    group.add(notesDirRow);

    const [metaFileRow] = this.createAppPickerRow(
      "Meta File",
      "The application to open the Noted meta file with",
      "application/json",
      prefs.get("default-app-notes-meta-file"),
      (app) => prefs.set("default-app-notes-meta-file", app.get_id() ?? "")
    );
    group.add(metaFileRow);

    this.add(group);
  }
}
