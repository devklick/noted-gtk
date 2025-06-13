import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import BindKeyDialog from "../BindKeyDialog";
import {
  AppShortcuts,
  ShortcutGroup,
  Shortcuts,
  ShortcutType,
} from "../../../../../core/ShortcutManager";
import icon from "../../../../../core/utils/icon";

import widget from "../../../../../core/utils/widget";

const groupDescriptions: Record<ShortcutGroup, string> = {
  Application: "Key bindings to interact with the core application",
  Editor: "Key bindings to interact with the note currently open in the editor",
};

interface KeyBindingsPageParams {
  shortcuts: AppShortcuts;
  parent: Adw.PreferencesWindow;
}

export default class KeyBindingsPage extends Adw.PreferencesPage {
  private shortcuts: AppShortcuts;
  private _parent: Adw.PreferencesWindow;
  static {
    GObject.registerClass({ GTypeName: "KeyBindingsPage" }, this);
  }
  constructor({ shortcuts, parent }: KeyBindingsPageParams) {
    super({ title: "Key Bindings", iconName: icon.symbolic("input-keyboard") });
    this.shortcuts = shortcuts;
    this._parent = parent;

    const prefGroups: Partial<Record<ShortcutGroup, Adw.PreferencesGroup>> = {};

    shortcuts.getAll().forEach((shortcut) => {
      const prefsGroup =
        prefGroups[shortcut.group.label] ??
        new Adw.PreferencesGroup({
          title: shortcut.group.label,
          description: shortcut.group.description,
        });
      prefGroups[shortcut.group.label] = prefsGroup;

      const row = new Adw.ActionRow({
        title: shortcut.label,
        subtitle: shortcut.description,
      });

      prefsGroup.add(row);
      row.add_suffix(this.createSuffix(shortcut.type));
    });

    Object.values(prefGroups).forEach((group) => this.add(group));
  }

  private createSuffix(shortcut: ShortcutType) {
    const { changeButton, resetButton, content, shortcutKeys, shortcutLabel } =
      this.createSuffixWidgets(shortcut);

    changeButton.connect("clicked", () => {
      new BindKeyDialog({
        shortcut,
        shortcutKeys,
        shortcuts: this.shortcuts,
        parent: this._parent,
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
