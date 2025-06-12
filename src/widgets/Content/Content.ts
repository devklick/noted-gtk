import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";

import { ICollapsable } from "../SideBar/SideBar";
import ContentHeader from "./ContentHeader";
import NotesDir from "../../core/fs/NotesDir";
import NoteEditor from "./NoteEditor";
import widget from "../../core/utils/widget";
import { AppShortcuts } from "../../core/ShortcutManager";

interface ContentParams {
  sideBar: ICollapsable;
  actionMap: Gio.ActionMap;
  notesDir: Readonly<NotesDir>;
  shortcuts: AppShortcuts;
}

export default class Content extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "ContentWindow" }, this);
  }
  private static _actionsCreated = false;
  private _noteEditor: NoteEditor;
  private _header: ContentHeader;

  constructor({ sideBar, actionMap, notesDir, shortcuts }: ContentParams) {
    super();
    this.ensureActions();

    this._noteEditor = new NoteEditor({ notesDir, actionMap, shortcuts });
    this._header = new ContentHeader({ actionMap, sideBar, notesDir });

    const view = widget.toolbarView.new({
      topBar: this._header,
      content: this._noteEditor,
    });

    this.set_child(view);
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    ContentHeader.defineActions(actionMap);
    NoteEditor.defineActions(actionMap);
    Content._actionsCreated = true;
  }

  private ensureActions() {
    if (!Content._actionsCreated) {
      throw new Error(
        "Content.defineActions must be called before instantiation"
      );
    }
  }
}
