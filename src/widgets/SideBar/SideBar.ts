import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";

import SideBarHeader from "./SideBarHeader";
import NoteList from "./NoteList";
import NotesDir from "../../core/fs/NotesDir";

import action from "../../core/utils/action";
import NoteListItem from "./NoteList/NoteListItem";
import widget from "../../core/utils/widget";

interface SideBarProps {
  onToggleOpen(open: boolean): void;
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
  appName: string;
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
  private _noteList: NoteList;
  private _actionMap: Gio.ActionMap;

  constructor({ onToggleOpen, notesDir, actionMap, appName }: SideBarProps) {
    super();

    this._onToggleOpen = onToggleOpen;
    this._notesDir = notesDir;
    this._actionMap = actionMap;

    this._noteList = new NoteList({ notesDir, actionMap });
    const header = new SideBarHeader({ actionMap, appName });
    const view = widget.toolbarView.new({
      topBar: header,
      content: this._noteList,
    });
    this.set_child(view);
  }

  public toggleOpen() {
    this.isOpen = !this.isOpen;
    this._onToggleOpen(this.isOpen);
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
