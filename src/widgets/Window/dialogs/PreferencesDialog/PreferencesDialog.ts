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

/*
  TODO: Replace PreferencesWindow with PreferencesDialog. 
  PreferencesWindow has been deprecated in Adwaita 1.6
  However, I initially used a PreferencesDialog and switch to PreferencesWindow
  due to issues with the dialog approach.
  I dont want to swicth to a basic Window as it doesnt offer preference search functionality
  Need to consider options
*/

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
    prefs,
    autoPresent = true,
  }: PreferencesDialogParams) {
    super({ resizable: false, transientFor: parent });

    this.add(new pages.KeyBindingsPage({ parent: this, shortcuts }));
    this.add(new pages.CategoriesPage({ prefs }));
    this.add(new pages.EditorPage());

    if (autoPresent) {
      this.present();
    }
  }
}
