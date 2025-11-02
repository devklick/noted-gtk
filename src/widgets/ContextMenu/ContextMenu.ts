import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import GLib from "@girs/glib-2.0";

export type ContextMenuActions = Array<{
  label: string;
  action: string;
  param: GLib.Variant;
}>;

interface ContextMenuParams<Actions extends ContextMenuActions> {
  actions: Actions;
  parent?: Gtk.Widget;
}

export default class ContextMenu<
  Actions extends ContextMenuActions = ContextMenuActions
> extends Gtk.PopoverMenu {
  static {
    GObject.registerClass({ GTypeName: "ContextMenu" }, this);
  }

  public actions: Actions;

  private _menu: Gio.Menu;

  constructor({ actions, parent }: ContextMenuParams<Actions>) {
    super();
    this._menu = new Gio.Menu();
    this.actions = actions;

    this.actions.forEach(({ action, label, param }) => {
      const menuItem = new Gio.MenuItem();
      menuItem.set_label(label);
      menuItem.set_attribute_value("action", GLib.Variant.new_string(action));
      menuItem.set_attribute_value("target", param);
      this._menu.append_item(menuItem);
    });
    this.set_menu_model(this._menu);
    this.set_has_arrow(false);

    if (parent) {
      this.set_parent(parent);
    }

    this.ensureCleanup();
  }

  public static builder() {
    return new ContextMenuBuilder();
  }

  public popupAt(x: number, y: number) {
    const width = 115; // dont ask
    const rect = new Gdk.Rectangle({ x, y, height: 1, width });
    this.set_pointing_to(rect);
    this.popup();
    return GLib.SOURCE_REMOVE;
  }

  private ensureCleanup() {
    // GJS seems to have a problem disposing of the context menu when it closes.
    // It's probably more an issue to do with my code, but either way, this is
    // trying to safely dispose of the context menu when it gets closed.
    this.connect("closed", () => {
      // Wait for the main loop to be free, to ensure actions have been invoked
      // We dont want to dispose of the context menu (and as such, the actions),
      // before the actions have fired.
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        if (!this.get_mapped()) return GLib.SOURCE_REMOVE;

        if (this.get_parent()) {
          // This following is to get rid of an error that pops up now and then:
          //    gdk_surface_set_device_cursor: assertion 'GDK_IS_SURFACE (surface)' failed
          //    _gtk_widget_find_at_coords: assertion 'GDK_IS_SURFACE (surface)' failed
          // I'm sure if this will actually fix the problem, but I dont think it'll do harm
          this.hide();
          this.set_position(null);

          // This seems to be crucial to allow GJS to get rid of the context menu.
          // Without this, it's left hanging around in the widget tree dispite
          // disappearing from view, probably leading to a memory leak.
          this.unparent();
        }
        return GLib.SOURCE_REMOVE;
      });
    });
  }
}

/**
 * Builder class to try and simplify the somewhat over-complicated
 * process of creating a context menu (Popover + Gio.Menu).
 */
class ContextMenuBuilder {
  private _actions: Array<{
    label: string;
    action: string;
    param: GLib.Variant;
  }> = [];

  private _parent: Gtk.Widget | undefined = undefined;

  public add(
    label: string,
    prefix: string,
    action: string,
    param: string | [type: string, value: unknown]
  ): this {
    const type = typeof param === "string" ? "s" : param[0];
    const value = typeof param === "string" ? param : param[1];
    this._actions.push({
      label,
      action: `${prefix}.${action}`,
      param: GLib.Variant.new(type, value),
    });
    return this;
  }

  public parent(widget: Gtk.Widget): this {
    this._parent = widget;
    return this;
  }

  public build() {
    return new ContextMenu({
      actions: this._actions,
      parent: this._parent,
    });
  }
}
