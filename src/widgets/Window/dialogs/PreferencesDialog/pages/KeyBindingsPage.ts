import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import BindKeyDialog from "../BindKeyDialog";
import {
  AppShortcuts,
  ShortcutGroupType,
  Shortcuts,
  ShortcutType,
} from "../../../../../core/ShortcutManager";
import icon from "../../../../../core/utils/icon";

import widget from "../../../../../core/utils/widget";

interface KeyBindingsPageParams {
  shortcuts: AppShortcuts;
  parentWindow: Gtk.Window;
}

export default class KeyBindingsPage extends Adw.PreferencesPage {
  private shortcuts: AppShortcuts;
  private _parentWindow: Gtk.Window;
  static {
    GObject.registerClass({ GTypeName: "KeyBindingsPage" }, this);
  }
  constructor({ shortcuts, parentWindow }: KeyBindingsPageParams) {
    super({ title: "Key Bindings", iconName: icon.symbolic("input-keyboard") });
    this.shortcuts = shortcuts;
    this._parentWindow = parentWindow;

    const prefGroups: Partial<Record<ShortcutGroupType, Adw.PreferencesGroup>> =
      {};

    shortcuts.getAll().forEach((shortcut) => {
      const groupType = shortcut.group.type;
      // prettier-ignore
      const prefsGroup = prefGroups[groupType] ?? new Adw.PreferencesGroup({
        title: shortcut.group.label,
        description: shortcut.group.description,
      });

      prefGroups[groupType] = prefsGroup;

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
        parentWindow: this._parentWindow,
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
      color: "accent",
      icon_name: icon.symbolic("document-edit"),
      tooltip_text: "Edit binding",
    });
    const resetButton = widget.button.new({
      color: "error",
      icon_name: icon.symbolic("view-refresh"),
      tooltip_text: "Reset binding",
    });

    const shortcutKeys = this.shortcuts.get(shortcut);

    const shortcutLabel = new Gtk.ShortcutLabel({
      accelerator: Gtk.accelerator_name(
        shortcutKeys.key,
        shortcutKeys.modifier
      ),
      hexpand: false,
    });

    const buttons = widget.box.h({
      linked: true,
      children: [changeButton, resetButton],
    });

    const content = widget.box.h({
      spacing: 10,
      children: [shortcutLabel, buttons],
      vexpand: false,
      vAlign: "CENTER",
    });

    return { changeButton, resetButton, shortcutKeys, shortcutLabel, content };
  }
}
