import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import PreferencesPageBase from "./PreferencesPageBase";
import { AppPrefs } from "../../../../../core/PreferencesManager";
import icon from "../../../../../core/utils/icon";

interface NoteListPageParams {
  prefs: AppPrefs;
  parent: Gtk.Window;
}

export default class NoteListPage extends PreferencesPageBase {
  static {
    GObject.registerClass({ GTypeName: "NoteListPage" }, this);
  }

  constructor({ prefs, parent }: NoteListPageParams) {
    super({
      title: "Note List",
      iconName: icon.symbolic("view-list"),
      parent,
      prefs,
    });
    this.prefs = prefs;

    this.add(this.createCategoriesGroup());
  }

  private createCategoriesGroup() {
    const [categoriesGroup, categoriesToggle] = this.createToggleGroup(
      "Note Categories",
      [
        "Allows easy categorisation of notes into a few pre-determined categories.",
        "Note that disabling categories will not remove the categories. If you disable and re-enable categories, all notes previously categories will remain categories",
      ],
      "enable-categories"
    );

    const [decorationsRow, decorationsToggle] = this.createToggleRow(
      "Decorations",
      "When decorations are enabled, decorations can be shown against each note in the note list to indicate which categories it's part of",
      "enable-category-decorations"
    );

    categoriesGroup.add(decorationsRow);

    categoriesToggle.connect("notify::active", () => {
      if (!categoriesToggle.active) {
        decorationsToggle.set_active(false);
        decorationsToggle.set_sensitive(false);
      } else {
        decorationsToggle.set_sensitive(true);
      }
    });

    return categoriesGroup;
  }
}
