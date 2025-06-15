import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";

export default class EditorPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass({ GTypeName: "EditorPage" }, this);
  }

  constructor() {
    super();
  }

  /*
    TODO:
      - Allow auto-saving notes to be enabled/disabled
  */
}
