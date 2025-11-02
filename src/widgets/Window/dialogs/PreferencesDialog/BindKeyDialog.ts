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
  parentWindow: Gtk.Window;
  shortcut: ShortcutType;
  shortcutKeys: Readonly<ShortcutKeys>;
  onConfirm(shortcutKeys: Readonly<ShortcutKeys>): void;
  shortcuts: AppShortcuts;
}

/**
 * A dialog that allows users to enter a new key combination
 * to use as the binding for the specified shortcut.
 *
 * Note that this is an Adw.Window instance acting as a Adw.Dialog, rather than
 * being an actual Adw.Dialog instance. This is becuase it seems linke key events
 * don't get captured inside a Adw.Dialog.
 */
export default class BindKeyDialog extends Adw.Window {
  static {
    GObject.registerClass({ GTypeName: "BindKeyDialog" }, this);
  }

  private _pendingShortcut: ShortcutKeys;

  constructor({
    parentWindow: parentWindow,
    shortcutKeys: _shortcutKeys,
    onConfirm,
    shortcuts,
    shortcut,
  }: BindKeyDialogParams) {
    super({ transientFor: parentWindow, modal: true });
    this._pendingShortcut = { ..._shortcutKeys };

    const error = widget.label.new(null, {
      color: "error",
      cssClasses: ["italic"],
    });

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
      title: `Bind ${shortcuts.getMeta(shortcut).label}`,
    });
    header.titleWidget.add_css_class("title-2");
    const content = widget.box.v({
      margin: 10,
      spacing: 10,
      children: [shortcutLabel, error, buttonRow],
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
        error.set_label(`Conflicts with ${shortcuts.getMeta(existing).label}`);
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
