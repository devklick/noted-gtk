import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import icon from "../../../core/utils/icon";
import Gtk from "@girs/gtk-4.0";
import widget from "../../../core/utils/widget";
import { AppShortcuts } from "../../../core/ShortcutManager";

interface AppPreferencesDialogParams {
  parent: Gtk.Window;
  autoPresent?: boolean;
  shortcuts: AppShortcuts;
}

export default class AppPreferencesDialog extends Adw.PreferencesWindow {
  static {
    GObject.registerClass({ GTypeName: "AppPreferencesDialog" }, this);
  }

  private shortcuts: AppShortcuts;
  constructor({
    parent,
    shortcuts,
    autoPresent = true,
  }: AppPreferencesDialogParams) {
    super({ resizable: false, transientFor: parent });
    this.shortcuts = shortcuts;
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
    const [key, mode] = this.shortcuts.get("delete-note")!;
    const label = Gtk.accelerator_name(key, mode);
    const change = new Gtk.Button({
      child: new Gtk.ShortcutLabel({
        accelerator: label,
      }),
    });
    change.connect("clicked", () => {
      const dialog = new Adw.Window({ transientFor: this, modal: true });
      const header = widget.header.new({ title: "Keys" });
      const label = new Gtk.Label({ label: "test" });
      const box = widget.box.v();

      box.append(header);
      box.append(label);
      dialog.set_content(box);

      const keyController = new Gtk.EventControllerKey();
      keyController.connect("key-pressed", (_, keyval, keycode, state) => {
        console.log(keyval, keycode, state);
      });
      dialog.add_controller(keyController);
      dialog.grab_focus();
      dialog.present();
    });
    saveRow.add_suffix(change);
    const deleteRow = new Adw.ActionRow({
      title: "Delete",
      subtitle: "Delete the currently-opened note",
    });

    group.add(saveRow);
    group.add(deleteRow);
    page.add(group);
  }
}
