import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";

import { ICollapsable } from "../SideBar/SideBar";
import ContentHeader from "./ContentHeader";
import NotesDir from "../../core/fs/NotesDir";
import NoteEditor from "./NoteEditor";

interface ContentParams {
  sideBar: ICollapsable;
  actionMap: Gio.ActionMap;
  notesDir: Readonly<NotesDir>;
}

export default class Content extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "ContentWindow" }, this);
  }
  private _noteEditor: NoteEditor;
  private _header: ContentHeader;

  constructor({ sideBar, actionMap, notesDir }: ContentParams) {
    super();

    this._noteEditor = new NoteEditor({ notesDir, actionMap });
    this._header = new ContentHeader({ actionMap, sideBar, notesDir });

    const view = new Adw.ToolbarView();
    view.add_top_bar(this._header);
    view.set_content(this._noteEditor);

    this.set_child(view);
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    ContentHeader.defineActions(actionMap);
    NoteEditor.defineActions(actionMap);
  }
}
