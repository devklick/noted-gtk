import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import icon from "../../../core/utils/icon";
import Gtk from "@girs/gtk-4.0";
import widget from "../../../core/utils/widget";
import { AppShortcuts, ShortcutType } from "../../../core/ShortcutManager";
import BindKeyDialog from "./BindKeyDialog";

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
    addNoteRow.add_suffix(this.createSuffix("new-note"));
    const toggleSideBarRow = new Adw.ActionRow({
      title: "Toggle Sidebar",
      subtitle: "Toggle (show/hide) the sidebar",
    });
    toggleSideBarRow.add_suffix(this.createSuffix("toggle-sidebar"));

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

    saveRow.add_suffix(this.createSuffix("save-note"));

    const deleteRow = new Adw.ActionRow({
      title: "Delete",
      subtitle: "Delete the currently-opened note",
    });

    deleteRow.add_suffix(this.createSuffix("delete-note"));

    const renameRow = new Adw.ActionRow({
      title: "Rename",
      subtitle: "Rename the currently-opened note",
    });

    renameRow.add_suffix(this.createSuffix("rename-note"));

    group.add(saveRow);
    group.add(deleteRow);
    group.add(renameRow);
    page.add(group);
  }

  private createSuffix(shortcut: ShortcutType) {
    const { changeButton, resetButton, content, shortcutKeys, shortcutLabel } =
      this.createSuffixWidgets(shortcut);

    changeButton.connect("clicked", () => {
      new BindKeyDialog({
        shortcut,
        shortcutKeys,
        shortcuts: this.shortcuts,
        parent: this,
        onConfirm: ({ key, modifier }) => {
          this.shortcuts.set(shortcut, { key, modifier });
          shortcutLabel.set_accelerator(Gtk.accelerator_name(key, modifier));
        },
      });
    });

    resetButton.connect("clicked", () => {
      this.shortcuts.reset(shortcut);
      const { key, modifier } = this.shortcuts.get(shortcut);
      shortcutLabel.set_accelerator(Gtk.accelerator_name(key, modifier));
    });

    return content;
  }

  private createSuffixWidgets(shortcut: ShortcutType) {
    const changeButton = widget.button.new({
      actionType: "suggested",
      icon_name: icon.symbolic("document-edit"),
      marginTop: 10,
      marginBottom: 10,
      tooltip_text: "Edit binding",
    });
    const resetButton = widget.button.new({
      actionType: "destructive",
      icon_name: icon.symbolic("view-refresh"),
      marginTop: 10,
      marginBottom: 10,
      tooltip_text: "Reset binding",
    });

    const shortcutKeys = this.shortcuts.get(shortcut);

    const shortcutLabel = new Gtk.ShortcutLabel({
      accelerator: Gtk.accelerator_name(
        shortcutKeys.key,
        shortcutKeys.modifier
      ),
      marginTop: 10,
      marginBottom: 10,
    });

    const content = widget.box.h({
      spacing: 10,
      children: [shortcutLabel, changeButton, resetButton],
    });

    return { changeButton, resetButton, shortcutKeys, shortcutLabel, content };
  }
}
