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
import SideBarHeader from "../SideBarHeader";

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
  private static _actionsCreated = false;

  constructor({ notesDir, actionMap }: NoteListParams) {
    super();
    this.ensureActions();
    this._notesDir = notesDir;
    this._actionMap = actionMap;
    this._listItems = {};
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

  public sync(search: string | null = null) {
    this._listBox.remove_all();
    this._listItems = {};

    const lowerSearch = search?.toLowerCase();
    Object.entries(this._notesDir.list())
      .filter(
        ([_, { name }]) =>
          !lowerSearch || name.toLowerCase().includes(lowerSearch)
      )
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

  public static defineActions(actionMap: Gio.ActionMap) {
    action.create(actionMap, NoteListItem.Actions.PromptDelete, "string");
    action.create(actionMap, NoteListItem.Actions.PromptRename, "string");

    action.create(actionMap, NoteListItem.Actions.DoOpen, "string");
    action.create(actionMap, NoteListItem.Actions.DoSave);
    action.create(actionMap, NoteListItem.Actions.DoDelete, "string");
    action.create(
      actionMap,
      NoteListItem.Actions.DoRename,
      GLib.VariantType.new("(ss)")
    );

    NoteList._actionsCreated = true;
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

    action.handle(
      this._actionMap,
      SideBarHeader.Actions.SearchUpdated,
      action.VariantParser.String,
      (search) => this.sync(search)
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

  private ensureActions() {
    if (!NoteList._actionsCreated) {
      throw new Error(
        "NoteList.defineActions must be called before instantiation"
      );
    }
  }
}
