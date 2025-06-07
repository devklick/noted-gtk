import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import GLib from "@girs/glib-2.0";
import { debounce } from "../../core/utils/timing";

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
  private _showContextMenu: (x: number, y: number) => void;

  constructor({ actions, parent }: ContextMenuParams<Actions>) {
    super();
    this._menu = new Gio.Menu();

    actions.forEach(({ key, label }) => this._menu.append(label, key));
    this.set_menu_model(this._menu);
    this.set_has_arrow(false);

    if (parent) {
      this.set_parent(parent);
    }

    this.ensureCleanup();
  }

  public static fromObject<
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

  public popupAt(x: number, y: number) {
    const width = 115; // dont ask
    const rect = new Gdk.Rectangle({ x, y, height: 1, width });
    this.set_pointing_to(rect);
    this.popup();
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
