import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";

export default class CategoriesPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass({ GTypeName: "CategoriesPage" }, this);
  }

  constructor() {
    super();
  }

  /*
    TODO:
      - Allow each note category to be enabled/disabled individually
      - Allow all note categories to be enabled/disabled globally
  */
}
