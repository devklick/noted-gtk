import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

interface SideBarHeaderParams {
  actionMap: Gio.ActionMap;
}

export default class SideBarHeader extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "SideBarHeader" }, this);
  }

  private _actionMap: Gio.ActionMap;

  constructor({ actionMap }: SideBarHeaderParams) {
    super();
    this._actionMap = actionMap;
    const label = new Gtk.Label({ label: "Noted" });
    label.get_style_context().add_class("title");

    const focusController = new Gtk.EventControllerFocus();
    const searchBox = new Gtk.SearchEntry();
    searchBox.add_controller(focusController);

    const searchButton = new Gtk.Button({
      iconName: "system-search-symbolic",
    });

    const header = new Adw.HeaderBar();
    header.pack_start(searchButton);
    header.set_title_widget(label);

    function restoreHeader() {
      header.set_title_widget(label);
      searchButton.show();
    }

    searchButton.connect("clicked", () => {
      header.set_title_widget(searchBox);
      searchButton.hide();
      // addNoteButton.hide();
      searchBox.grab_focus();
    });

    searchBox.connect("stop-search", restoreHeader);
    focusController.connect("leave", () => {
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        restoreHeader();
        return GLib.SOURCE_REMOVE;
      });
    });

    this.set_child(header);
  }
}
