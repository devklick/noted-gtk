import Gtk from "@girs/gtk-4.0";
import icon from "../../../core/utils/icon";
import Gio from "@girs/gio-2.0";
import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";

interface BurgerMenuParams {}

export default class BurgerMenu extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "BurgerMenu" }, this);
  }

  public static Actions = {
    Preferences: "preferences",
    About: "about",
  } as const;

  private popover: Gtk.PopoverMenu;
  private menu: Gio.Menu;
  private menuButton: Gtk.MenuButton;

  constructor({}: BurgerMenuParams) {
    super();
    this.menu = new Gio.Menu();

    Object.entries(BurgerMenu.Actions).forEach(([label, action]) =>
      this.menu.append(label, `app.${action}`)
    );

    this.popover = new Gtk.PopoverMenu({ menuModel: this.menu });

    this.menuButton = new Gtk.MenuButton({
      iconName: icon.symbolic("open-menu"),
      popover: this.popover,
    });
    this.set_child(this.menuButton);
  }
}
