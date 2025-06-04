import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";

export type ContextMenuActions = ReadonlyArray<
  Readonly<{ label: string; key: string }>
>;

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

  private _menu: Gio.Menu;

  constructor({ actions, parent }: ContextMenuParams<Actions>) {
    super();
    this._menu = new Gio.Menu();

    actions.forEach(({ key, label }) => this._menu.append(label, key));
    this.set_menu_model(this._menu);
    this.set_has_arrow(false);

    if (parent) {
      this.set_parent(parent);
    }
  }

  public popupAt(x: number, y: number) {
    const width = 115; // dont ask
    const rect = new Gdk.Rectangle({ x, y, height: 1, width });
    this.set_pointing_to(rect);
    this.popup();
  }

  static fromObject<
    T extends Readonly<Record<string, string>>,
    S extends "win" | "app"
  >(
    obj: T,
    { parent, scope }: { scope?: S; parent?: Gtk.Widget } = {}
  ): ContextMenu<
    Array<{ label: keyof T & string; key: `${S}.${T[keyof T]}` }>
  > {
    const actions = Object.entries(obj).map(([label, key]) => ({
      label,
      key: scope ? [scope, key].join(".") : key,
    })) as Array<{
      label: keyof T & string;
      key: `${S}.${T[keyof T]}`;
    }>;

    return new ContextMenu({ actions, parent });
  }
}
