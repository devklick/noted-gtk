import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import { AppShortcuts } from "../../../../core/ShortcutManager";
import { AppPrefs } from "../../../../core/PreferencesManager";
import pages from "./pages";

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

    this.add(new pages.KeyBindingsPage({ parent, prefs, shortcuts }));
    this.add(new pages.NoteListPage({ parent, prefs }));

    if (autoPresent) {
      this.present(parent);
    }
  }
}
