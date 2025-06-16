import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import widget from "../../../../core/utils/widget";
import {
  AppShortcuts,
  ShortcutKeys,
  ShortcutType,
} from "../../../../core/ShortcutManager";

interface BindKeyDialogParams {
  parent: Gtk.Window;
  shortcut: ShortcutType;
  shortcutKeys: Readonly<ShortcutKeys>;
  onConfirm(shortcutKeys: Readonly<ShortcutKeys>): void;
  shortcuts: AppShortcuts;
}

/**
 * A dialog that allows users to enter a new key combination
 * to use as the binding for the specified shortcut.
 */
export default class BindKeyDialog extends Adw.Window {
  static {
    GObject.registerClass({ GTypeName: "BindKeyDialog" }, this);
  }

  private _pendingShortcut: ShortcutKeys;

  constructor({
    parent,
    shortcutKeys: _shortcutKeys,
    onConfirm,
    shortcuts,
    shortcut,
  }: BindKeyDialogParams) {
    super({ transientFor: parent, modal: true });
    this._pendingShortcut = { ..._shortcutKeys };

    const error = widget.label.new(null, { cssClasses: ["error"] });
    const shortcutLabel = new Gtk.ShortcutLabel({
      accelerator: Gtk.accelerator_name(
        this._pendingShortcut.key,
        this._pendingShortcut.modifier
      ),
      halign: Gtk.Align.CENTER,
    });
    const confirm = widget.button.new({
      actionType: "suggested",
      label: "Confirm",
    });
    confirm.connect("clicked", () => {
      onConfirm(this._pendingShortcut);
      this.close();
    });

    const cancel = widget.button.new({
      actionType: "destructive",
      label: "Cancel",
    });
    cancel.connect("clicked", () => this.close());

    const buttonRow = widget.box.h({
      spacing: 4,
      hAlign: "CENTER",
      children: [confirm, cancel],
    });

    const header = widget.header.new({
      title: `Bind ${shortcuts.getLabel(shortcut)}`,
    });
    header.titleWidget.add_css_class("title-2");
    const content = widget.box.v({
      margin: 10,
      spacing: 10,
      children: [error, shortcutLabel, buttonRow],
    });
    const view = widget.toolbarView.new({
      topBar: header,
      content: content,
    });

    this.set_content(view);

    const keyController = new Gtk.EventControllerKey();
    keyController.connect("key-pressed", (_, key, _keycode, state) => {
      const modMask = Gtk.accelerator_get_default_mod_mask();
      this._pendingShortcut = {
        key,
        modifier: state & modMask,
      };

      shortcutLabel.set_accelerator(
        Gtk.accelerator_name(
          this._pendingShortcut.key,
          this._pendingShortcut.modifier
        )
      );
      const existing = shortcuts.check(this._pendingShortcut);
      if (existing && existing != shortcut) {
        error.set_label(`Conflicts with ${shortcuts.getLabel(existing)}`);
        confirm.set_sensitive(false);
      } else {
        error.set_label("");
        confirm.set_sensitive(true);
      }
    });
    this.add_controller(keyController);
    this.grab_focus();
    this.present();
  }
}
