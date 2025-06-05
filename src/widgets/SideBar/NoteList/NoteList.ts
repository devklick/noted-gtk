import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import NoteListItem from "./NoteListItem";
// import ContextMenu from "../ContextMenu";
import NotesDir from "../../../core/fs/NotesDir";
import Gio from "@girs/gio-2.0";
import action from "../../../core/utils/action";
import GLib from "@girs/glib-2.0";
import ContentHeader from "../../Content/ContentHeader";
import NoteEditor from "../../Content/NoteEditor";

interface NoteListParams {
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
}

export default class NoteList extends Gtk.ScrolledWindow {
  static {
    GObject.registerClass({ GTypeName: "NoteList" }, this);
  }
  private _notesDir: Readonly<NotesDir>;
  private _listBox: Gtk.ListBox;
  private _listItems: Record<string, NoteListItem>;
  private _actionMap: Gio.ActionMap;

  constructor({ notesDir, actionMap }: NoteListParams) {
    super();
    this._notesDir = notesDir;
    this._actionMap = actionMap;
    this._listItems = {};
    this.defineActions();
    this.registerActionHandlers();

    this._listBox = new Gtk.ListBox({
      halign: Gtk.Align.FILL,
      hexpand: true,
      vexpand: true,
      cssClasses: ["navigation-sidebar"],
    });

    this.set_child(this._listBox);
    this.sync();
  }

  public sync() {
    this._listBox.remove_all();

    Object.entries(this._notesDir.list())
      .sort(([_a, a], [_b, b]) => b.updatedOn.getTime() - a.updatedOn.getTime())
      .forEach(([id, data]) => {
        this._listItems[id] = new NoteListItem({
          id,
          name: data.name,
          actionMap: this._actionMap,
        });
        this._listBox.append(this._listItems[id]);
      });
  }

  private defineActions() {
    action.create(this._actionMap, NoteListItem.Actions.PromptDelete, "string");
    action.create(this._actionMap, NoteListItem.Actions.PromptRename, "string");

    action.create(
      this._actionMap,
      NoteListItem.Actions.DoRename,
      GLib.VariantType.new("(ss)")
    );
    action.create(this._actionMap, NoteListItem.Actions.DoDelete, "string");
    action.create(this._actionMap, NoteListItem.Actions.DoSave);
    action.create(this._actionMap, NoteListItem.Actions.DoOpen, "string");
  }

  private registerActionHandlers() {
    action.handle(
      this._actionMap,
      ContentHeader.Actions.NewNote,
      action.VariantParser.None,
      () => this.newNote()
    );

    action.handle(
      this._actionMap,
      NoteListItem.Actions.PromptRename,
      action.VariantParser.String,
      (id) => this.promptRename(id)
    );

    action.handle(
      this._actionMap,
      NoteListItem.Actions.DoDelete,
      action.VariantParser.String,
      (id) => this.deleteNote(id)
    );

    action.handle(
      this._actionMap,
      NoteListItem.Actions.DoRename,
      (param) => param!.deepUnpack() as [string, string],
      ([id, name]) => this.doRename(id, name)
    );

    action.handle(
      this._actionMap,
      NoteEditor.Actions.EditorSaved,
      action.VariantParser.None,
      () => this.sync()
    );
  }

  private deleteNote(id: string) {
    this._notesDir.deleteNote(id);
    this.sync();
  }

  private promptRename(id: string) {
    this._listItems[id].promptRename();
  }

  private doRename(id: string, name: string) {
    this._notesDir.renameNote(id, name);
    this.sync();
  }

  private newNote() {
    const noteId = this._notesDir.newNote();
    this.sync();
    action.invoke(this._actionMap, NoteListItem.Actions.DoOpen, noteId);
  }
}
