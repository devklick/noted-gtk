import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";

import SideBarHeader from "./SideBarHeader";
import NoteList from "./NoteList";
import NotesDir from "../../core/fs/NotesDir";

import widget from "../../core/utils/widget";
import action from "../../core/utils/action";
import SideBarContent from "./SideBarContent/SideBarContent";
import { AppPrefs } from "../../core/PreferencesManager";

interface SideBarProps {
  onToggleOpen(open: boolean): void;
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
  appName: string;
  prefs: AppPrefs;
}

export interface ICollapsable {
  isOpen: boolean;
  toggleOpen(): void;
  setIsOpen(isOpen: boolean): void;
}

export default class SideBar extends Adw.Bin implements ICollapsable {
  static {
    GObject.registerClass({ GTypeName: "SideBar" }, this);
  }
  private static _actionsCreated = false;

  public isOpen: boolean = true;
  private _onToggleOpen: (open: boolean) => void;
  private _notesDir: Readonly<NotesDir>;
  private _actionMap: Gio.ActionMap;

  constructor({
    onToggleOpen,
    notesDir,
    actionMap,
    appName,
    prefs,
  }: SideBarProps) {
    super();
    this.ensureActions();

    this._onToggleOpen = onToggleOpen;
    this._notesDir = notesDir;
    this._actionMap = actionMap;

    const content = new SideBarContent({ actionMap, notesDir, prefs });
    const header = new SideBarHeader({ actionMap, appName });
    const view = widget.toolbarView.new({
      topBar: header,
      content: content,
    });
    this.set_child(view);
  }

  public toggleOpen() {
    this.isOpen = !this.isOpen;
    this.setIsOpen(this.isOpen);
  }

  public setIsOpen(isOpen: boolean) {
    this.isOpen = isOpen;
    this._onToggleOpen(this.isOpen);
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    SideBarHeader.defineActions(actionMap);
    NoteList.defineActions(actionMap);
    SideBar._actionsCreated = true;
  }

  private ensureActions() {
    if (!SideBar._actionsCreated) {
      throw new Error(
        "SideBar.defineActions must be called before instantiation"
      );
    }
  }
}
