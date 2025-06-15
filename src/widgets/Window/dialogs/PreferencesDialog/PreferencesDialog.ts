import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import { AppShortcuts } from "../../../../core/ShortcutManager";
import pages from "./pages";

interface PreferencesDialogParams {
  parent: Gtk.Window;
  autoPresent?: boolean;
  shortcuts: AppShortcuts;
}

/**
 * A dialog to allow users to configure the applications behaviors.
 */
export default class PreferencesDialog extends Adw.PreferencesWindow {
  static {
    GObject.registerClass({ GTypeName: "PreferencesDialog" }, this);
  }

  constructor({
    parent,
    shortcuts,
    autoPresent = true,
  }: PreferencesDialogParams) {
    super({ resizable: false, transientFor: parent });

    this.add(new pages.KeyBindingsPage({ parent: this, shortcuts }));
    this.add(new pages.CategoriesPage());
    this.add(new pages.EditorPage());

    if (autoPresent) {
      this.present();
    }
  }
}
