import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";

import SideBar from "../SideBar";
import Content from "../Content";
import action from "../../core/utils/action";
import NoteListItem from "../SideBar/NoteList/NoteListItem";
import NotesDir from "../../core/fs/NotesDir";

interface WindowParams {
  notesDir: Readonly<NotesDir>;
  appName: string;
}

export default class Window extends Adw.ApplicationWindow {
  static {
    GObject.registerClass({ GTypeName: "Window" }, this);
  }

  private _notesDir: Readonly<NotesDir>;
  private _sideBar: SideBar;
  private _content: Content;

  constructor({ notesDir, appName }: WindowParams) {
    super({ name: "main-window", defaultHeight: 600, defaultWidth: 600 });
    this._notesDir = notesDir;
    this.defineActions();

    const splitView = new Adw.OverlaySplitView();

    this._sideBar = new SideBar({
      onToggleOpen: (open) => splitView.set_show_sidebar(open),
      notesDir,
      actionMap: this,
      appName,
    });

    this._content = new Content({
      sideBar: this._sideBar,
      actionMap: this,
      notesDir: notesDir,
    });

    splitView.set_sidebar(this._sideBar);
    splitView.set_content(this._content);

    this.set_content(splitView);

    this.registerActionHandlers();
  }

  private defineActions() {
    Content.defineActions(this);
    SideBar.defineActions(this);
  }

  private registerActionHandlers() {
    action.handle(
      this,
      NoteListItem.Actions.PromptDelete,
      action.VariantParser.String,
      (id) => this.buildDeleteDialog(id)
    );
  }
  private buildDeleteDialog(noteId: string) {
    const name = this._notesDir.metaFile.getNoteMetadata(noteId).name;
    const dialog = new Adw.AlertDialog({});
    dialog.set_heading(`Delete note ${name}`);
    dialog.add_response("cancel", "Cancel");
    dialog.add_response("delete", "Delete");
    dialog.set_response_appearance(
      "delete",
      Adw.ResponseAppearance.DESTRUCTIVE
    );
    dialog.set_default_response("delete");
    dialog.connect("response", (_, response) => {
      if (response === "delete") {
        action.invoke(this, NoteListItem.Actions.DoDelete, noteId);
      }
    });
    dialog.present(this);
  }
}
