import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import { AppShortcuts } from "../../../../core/ShortcutManager";
import pages from "./pages";
import { AppPrefs } from "../../../../core/PreferencesManager";

interface PreferencesDialogParams {
  parent: Gtk.Window;
  autoPresent?: boolean;
  shortcuts: AppShortcuts;
  prefs: AppPrefs;
}

/**
 * A dialog to allow users to configure the applications behaviors.
 */
export default class PreferencesDialog extends Adw.PreferencesDialog {
  static {
    GObject.registerClass({ GTypeName: "PreferencesDialog" }, this);
  }

  constructor({
    parent,
    shortcuts,
    prefs,
    autoPresent = true,
  }: PreferencesDialogParams) {
    super({});

    this.add(new pages.KeyBindingsPage({ parentWindow: parent, shortcuts }));
    this.add(new pages.CategoriesPage({ prefs }));
    this.add(new pages.EditorPage());

    if (autoPresent) {
      this.present(parent);
    }
  }
}
