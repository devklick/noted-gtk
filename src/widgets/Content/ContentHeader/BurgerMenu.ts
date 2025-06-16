import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";

import icon from "../../../core/utils/icon";

interface BurgerMenuParams {}

export default class BurgerMenu extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "BurgerMenu" }, this);
  }

  public static Actions = {
    Preferences: "preferences",
    About: "about",
    Open: {
      ["Notes Folder"]: "open-notes-folder",
      ["Notes Meta File"]: "open-notes-meta-file",
    },
  } as const;

  private popover: Gtk.PopoverMenu;
  private menuButton: Gtk.MenuButton;
  private menu: Gio.Menu = this.buildMenu(BurgerMenu.Actions);

  constructor({}: BurgerMenuParams = {}) {
    super();

    this.popover = new Gtk.PopoverMenu({ menuModel: this.menu });

    this.menuButton = new Gtk.MenuButton({
      iconName: icon.symbolic("open-menu"),
      popover: this.popover,
    });
    this.set_child(this.menuButton);
  }

  private buildMenu(actions: object) {
    const menu = new Gio.Menu();

    Object.entries(actions).forEach(([label, action]) => {
      if (typeof action === "object") {
        menu.append_submenu(label, this.buildMenu(action));
      } else if (typeof action === "string") {
        menu.append(label, `app.${action}`);
      }
    });

    return menu;
  }
}
