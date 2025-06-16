import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";

import SideBar from "../SideBar";
import Content from "../Content";
import NotesDir from "../../core/fs/NotesDir";
import action from "../../core/utils/action";
import { AppShortcuts } from "../../core/ShortcutManager";
import { AppPrefs } from "../../core/PreferencesManager";

interface LayoutParams {
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
  appName: string;
  shortcuts: AppShortcuts;
  prefs: AppPrefs;
}

export default class Layout extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "Layout" }, this);
  }
  private static _actionsCreated = false;

  public static Actions = {
    ShowSidebarChanged: "sidebar-show-changed",
  } as const;

  private _sideBar: SideBar;
  private _content: Content;
  private _actionMap: Gio.ActionMap;
  private _splitView: Adw.OverlaySplitView;

  constructor({
    actionMap,
    appName,
    notesDir,
    shortcuts,
    prefs,
  }: LayoutParams) {
    super();
    this._actionMap = actionMap;
    this.ensureActions();

    this._splitView = new Adw.OverlaySplitView();

    this._sideBar = new SideBar({
      onToggleOpen: (open) => this._splitView.set_show_sidebar(open),
      notesDir,
      actionMap,
      appName,
      prefs,
    });

    this._content = new Content({
      sideBar: this._sideBar,
      actionMap,
      notesDir,
      shortcuts,
    });

    this._splitView.set_sidebar(this._sideBar);
    this._splitView.set_content(this._content);

    this.set_child(this._splitView);

    this.registerActionHandlers();
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    action.create(actionMap, Layout.Actions.ShowSidebarChanged, "bool");
    Layout._actionsCreated = true;
  }

  public toggleSideBar() {
    this._sideBar.toggleOpen();
    action.invoke(
      this._actionMap,
      Layout.Actions.ShowSidebarChanged,
      this._sideBar.isOpen
    );
  }

  private registerActionHandlers() {
    action.handle(
      this._actionMap,
      Layout.Actions.ShowSidebarChanged,
      "bool",
      (show) => this._splitView.set_show_sidebar(show)
    );
  }

  private ensureActions() {
    if (!Layout._actionsCreated) {
      throw new Error(
        "Layout.defineActions must be called before instantiation"
      );
    }
  }
}
