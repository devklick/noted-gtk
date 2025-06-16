import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import widget from "../../../../../core/utils/widget";
import Gtk from "@girs/gtk-4.0";
import {
  AppPrefs,
  BoolPreferenceKey,
  PreferenceKey,
} from "../../../../../core/PreferencesManager";
import GLib from "@girs/glib-2.0";

interface CategoriesPageParams {
  prefs: AppPrefs;
}

export default class CategoriesPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass({ GTypeName: "CategoriesPage" }, this);
  }

  private prefs: AppPrefs;

  constructor({ prefs }: CategoriesPageParams) {
    super();
    this.prefs = prefs;

    this.add(this.createCategoriesGroup());
    this.add(this.createDecorationsGroup());
  }

  private createCategoriesGroup() {
    const group = this.createToggleableGroup(
      "Note Categories",
      "Allows easy categorisation of notes into a few pre-determined categories",
      "enable-categories"
    );

    return group;
  }

  private createDecorationsGroup() {
    const group = this.createToggleableGroup(
      "Category Decorations",
      "When decorations are enabled, decorations can be shown against each note in the note list to indicate which categories it's part of",
      "enable-category-decorations"
    );
    return group;
  }

  private createToggleableGroup(
    title: string,
    description: string,
    toggleKey: BoolPreferenceKey
  ) {
    const group = new Adw.PreferencesGroup({ title, description });

    const toggle = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this.prefs.get(toggleKey),
    });

    toggle.connect("notify::active", () => {
      this.prefs.set(toggleKey, toggle.active);
    });

    group.set_header_suffix(toggle);

    return group;
  }

  /*
    TODO:
      - Allow each note category to be enabled/disabled individually
      - Allow all note categories to be enabled/disabled globally
  */
}
