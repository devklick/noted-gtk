import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import icon from "../../../core/utils/icon";
import Gtk from "@girs/gtk-4.0";

interface AppPreferencesDialogParams {
  parent: Gtk.Window;
  autoPresent?: boolean;
}

export default class AppPreferencesDialog extends Adw.PreferencesWindow {
  static {
    GObject.registerClass({ GTypeName: "AppPreferencesDialog" }, this);
  }
  constructor({ parent, autoPresent = true }: AppPreferencesDialogParams) {
    super({ resizable: false, transientFor: parent });
    this.addKeyBindingsPage();

    if (autoPresent) {
      this.present();
    }
  }

  // TODO: Allow keybindings to be configured by user
  private addKeyBindingsPage() {
    const page = new Adw.PreferencesPage({
      title: "Key Bindings",
      iconName: icon.symbolic("input-keyboard"),
    });

    this.addAppKeyBindings(page);
    this.addEditorKeyBindings(page);

    this.add(page);
  }

  private addAppKeyBindings(page: Adw.PreferencesPage) {
    const group = new Adw.PreferencesGroup({
      title: "Application",
      description: "Key bindings to interact with the core application",
    });

    const addNoteRow = new Adw.ActionRow({
      title: "New note",
      subtitle: "Create a new note and open it in the editor",
    });
    const toggleSideBarRow = new Adw.ActionRow({
      title: "Toggle Sidebar",
      subtitle: "Toggle (show/hide) the sidebar",
    });

    group.add(addNoteRow);
    group.add(toggleSideBarRow);
    page.add(group);
  }

  private addEditorKeyBindings(page: Adw.PreferencesPage) {
    const group = new Adw.PreferencesGroup({
      title: "Editor",
      description:
        "Key bindings to interact with the note currently open in the editor",
    });

    const saveRow = new Adw.ActionRow({
      title: "Save",
      subtitle: "Save the current contents of the note",
    });
    const deleteRow = new Adw.ActionRow({
      title: "Delete",
      subtitle: "Delete the currently-opened note",
    });

    group.add(saveRow);
    group.add(deleteRow);
    page.add(group);
  }
}
