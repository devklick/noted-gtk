import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import {
  AppPrefs,
  BoolPreferenceKey,
} from "../../../../../core/PreferencesManager";
import icon from "../../../../../core/utils/icon";

interface CategoriesPageParams {
  prefs: AppPrefs;
}

export default class CategoriesPage extends Adw.PreferencesPage {
  static {
    GObject.registerClass({ GTypeName: "CategoriesPage" }, this);
  }

  private prefs: AppPrefs;

  constructor({ prefs }: CategoriesPageParams) {
    super({
      title: "Note Categories",
      iconName: icon.symbolic("user-bookmarks"),
    });
    this.prefs = prefs;

    const [categoriesGroup, toggleCategoriesGroup] =
      this.createCategoriesGroup();

    const [decorationsGroup, toggleDecorationsGroup] =
      this.createDecorationsGroup();

    // If categories are turned off, we'll turn decorations off too
    toggleCategoriesGroup.connect("notify::active", () => {
      if (!toggleCategoriesGroup.active) {
        toggleDecorationsGroup.set_active(false);
        toggleDecorationsGroup.set_sensitive(false);
      } else {
        toggleDecorationsGroup.set_sensitive(true);
      }
    });

    this.add(categoriesGroup);
    this.add(decorationsGroup);
  }

  private createCategoriesGroup() {
    const group = this.createToggleableGroup(
      "Note Categories",
      [
        "Allows easy categorisation of notes into a few pre-determined categories.",
        "Note that disabling categories will not remove the categories. If you disable and re-enable categories, all notes previously categories will remain categories",
      ],
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
    description: string | string[],
    toggleKey: BoolPreferenceKey
  ): [group: Adw.PreferencesGroup, toggle: Gtk.Switch] {
    const group = new Adw.PreferencesGroup({
      title,
      description:
        typeof description === "string"
          ? description
          : description.join("\n\n"),
    });

    const toggle = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this.prefs.get(toggleKey),
    });

    toggle.connect("notify::active", () => {
      this.prefs.set(toggleKey, toggle.active);
    });

    group.set_header_suffix(toggle);

    return [group, toggle];
  }

  /*
    TODO:
      - Allow each note category to be enabled/disabled individually
  */
}
