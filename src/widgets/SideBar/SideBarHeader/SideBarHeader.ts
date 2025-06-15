import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";

import icon from "../../../core/utils/icon";
import action from "../../../core/utils/action";
import widget from "../../../core/utils/widget";
import Layout from "../../Layout";

interface SideBarHeaderParams {
  actionMap: Gio.ActionMap;
  appName: string;
}

export default class SideBarHeader extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "SideBarHeader" }, this);
  }

  private static _actionsCreated = false;

  private _actionMap: Gio.ActionMap;
  private _searchEntry: Gtk.SearchEntry;
  private _focusController: Gtk.EventControllerFocus;
  private _keyController: Gtk.EventControllerKey;
  private _header: Adw.HeaderBar;
  private _label: Gtk.Label;
  private _searchButton: Gtk.Button;

  public static Actions = {
    SearchUpdated: "sidebar-search-updated",
    FocusSearch: "sidebar-focus-search",
  } as const;

  constructor({ actionMap, appName }: SideBarHeaderParams) {
    super();
    this.ensureActions();
    this._actionMap = actionMap;
    this._label = new Gtk.Label({ label: appName });
    this._label.get_style_context().add_class("title");

    this._keyController = new Gtk.EventControllerKey();
    this._focusController = new Gtk.EventControllerFocus();
    this._searchEntry = new Gtk.SearchEntry();
    this._searchEntry.add_controller(this._focusController);
    this._searchEntry.add_controller(this._keyController);
    this._searchEntry.connect("search-changed", () =>
      this.handleSearchChanged()
    );

    this._searchButton = new Gtk.Button({
      iconName: icon.name("system-search", "symbolic"),
    });

    this._header = widget.header.new({
      start: this._searchButton,
      title: this._label,
    });
    this.set_child(this._header);

    this.registerActionHandlers();
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    action.create(actionMap, SideBarHeader.Actions.SearchUpdated, "string");
    action.create(actionMap, SideBarHeader.Actions.FocusSearch);
    SideBarHeader._actionsCreated = true;
  }

  private handleSearchChanged() {
    const search = this._searchEntry.get_text();
    action.invoke(this._actionMap, SideBarHeader.Actions.SearchUpdated, search);

    // There's an issue when we have text in the search box, move focus elsewhere (e.g. note editor),
    // then click the clear search button. The search text gets cleared and all notes are shown again,
    // but the search box continues to fill the header.
    // So if we have no search and the search box isnt in focus, restore the default header.
    if (!search && !this._searchEntry.hasFocus) {
      this.restoreHeader();
    }
  }

  private restoreHeader(force: boolean = false) {
    // We want to persist the search bar in the header if there's text in it,
    // so the user can understand why only a subset of notes are being shown.
    if (force || !this._searchEntry.get_text()) {
      this._searchEntry.set_text("");
      this._header.set_title_widget(this._label);
      this._searchButton.show();
      // If we remove the header when it's in focus, focus drops to the next child,
      // which is the first node in the list. so that node becomes selected.
      // This means it seem like that note is open, when it's not.
      // We can work around this by reverting focus to the search button
      this._searchButton.grab_focus();
    }
  }

  private openSearchInHeader() {
    this._header.set_title_widget(this._searchEntry);
    this._searchButton.hide();
    this._searchEntry.grab_focus();
  }

  private registerActionHandlers() {
    // Expand the search box to fill the header when the search button is clicked
    this._searchButton.connect("clicked", () => this.openSearchInHeader());

    // Restore the header back to default when we're done searching.
    // This fires when we hit ESC or input has stopped.
    this._searchEntry.connect("stop-search", () => this.restoreHeader());

    // Similarly, when focus leaves the search box, we close it
    this._focusController.connect("leave", () => {
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        this.restoreHeader();
        return GLib.SOURCE_REMOVE;
      });
    });

    // if the ESC key is pressed while search box is in focus, we cancel
    // the search and restore the header.
    // We cant rely on stop-search because that could happen when the user stops/pauses typing.
    this._keyController.connect("key-pressed", (_, key) => {
      if (key === Gdk.KEY_Escape) {
        this.restoreHeader(true);
      }
    });

    action.handle(
      this._actionMap,
      SideBarHeader.Actions.FocusSearch,
      null,
      () => {
        action.invoke(this._actionMap, Layout.Actions.ShowSidebarChanged, true);
        this.openSearchInHeader();
      }
    );
  }
  private ensureActions() {
    if (!SideBarHeader._actionsCreated) {
      throw new Error(
        "SideBarHeader.defineActions must be called before instantiation"
      );
    }
  }
}
