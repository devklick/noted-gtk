import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import NoteListItem from "./NoteListItem";
import NotesDir from "../../../core/fs/NotesDir";
import ContentHeader from "../../Content/ContentHeader";
import NoteEditor from "../../Content/NoteEditor";
import SideBarHeader from "../SideBarHeader";

import action from "../../../core/utils/action";
import Layout from "../../Layout";
import { debounce } from "../../../core/utils/timing";
import ContextMenu from "../../ContextMenu";
import { NoteCategory } from "../SideBarContent/NoteCategories";

// TODO: Consider allowing multiple rows to be selected.
// It's a bit of a pain trying to delete multiple notes at the moment.

interface NoteListParams {
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
}

export default class NoteList extends Gtk.ScrolledWindow {
  static {
    GObject.registerClass({ GTypeName: "NoteList" }, this);
  }

  private readonly _notesDir: Readonly<NotesDir>;
  private readonly _listBox: Gtk.ListBox;
  private _listItems: Record<string, NoteListItem>;
  private readonly _actionMap: Gio.ActionMap;
  private _openNoteId: string | null = null;
  private _search: string | null = null;
  private _contextMenu: ContextMenu;
  private _currentCategory: NoteCategory = "all";
  private showListContextMenu: (x: number, y: number, noteId: string) => void;

  constructor({ notesDir, actionMap }: NoteListParams) {
    super();
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

    this._contextMenu = ContextMenu.fromObject(
      {
        Open: NoteListItem.Actions.DoOpen,
        Rename: NoteListItem.Actions.PromptRename,
        Delete: NoteListItem.Actions.PromptDelete,
      },
      { parent: this, scope: "win" }
    );

    // Probably wont need this debounce now that I'm hooking into the button release event
    this.showListContextMenu = debounce(
      0,
      (x: number, y: number, noteId: string) => {
        this._contextMenu.popupAt(x, y, noteId, this._listItems[noteId]);
      }
    );

    this.set_child(this._listBox);
    this.sync();
  }

  public search(searchTerm: string | null) {
    this._search = searchTerm;
    this.sync();
  }

  public filterCategory(category: NoteCategory) {
    this._currentCategory = category;
    this.sync();
  }

  public sync() {
    this._listBox.remove_all();
    this._listItems = {};

    // TODO: Refactor
    let selected: string | null = null;
    const lowerSearch = this._search?.toLowerCase();
    Object.entries(this._notesDir.list())
      .filter(
        ([_, { name, starred, archived }]) =>
          (!lowerSearch || name.toLowerCase().includes(lowerSearch)) &&
          (this._currentCategory === "all" ||
            (this._currentCategory === "favourite" && starred) ||
            (this._currentCategory === "archive" && archived))
      )
      .sort(([_a, a], [_b, b]) => b.updatedOn.getTime() - a.updatedOn.getTime())
      .forEach(([id, data]) => {
        const note = new NoteListItem({
          id,
          name: data.name,
          actionMap: this._actionMap,
          archived: data.archived,
          starred: data.starred,
        });
        note.connect("note-context-menu-requested", (_, noteId, x, y) =>
          this.showListContextMenu(x, y, noteId)
        );

        if (id === this._openNoteId) {
          selected = id;
        }
        this._listItems[id] = note;
        this._listBox.append(note);
      });

    if (selected) {
      this._listBox.select_row(this._listItems[selected]);
      this._listItems[selected].grab_focus();
    } else {
      this._listBox.unselect_all();
    }
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    NoteListItem.defineActions(actionMap);
  }

  private registerActionHandlers() {
    action.handle(this._actionMap, ContentHeader.Actions.NewNote, null, () =>
      this.newNote()
    );

    action.handle(
      this._actionMap,
      NoteListItem.Actions.PromptRename,
      "string",
      (id) => this.promptRename(id)
    );

    action.handle(
      this._actionMap,
      NoteListItem.Actions.DoDelete,
      "string",
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
      NoteListItem.Actions.PromptRenameCurrent,
      null,
      () => this.handlePromptRenameCurrent()
    );

    action.handle(this._actionMap, NoteEditor.Actions.EditorSaved, null, () =>
      this.sync()
    );

    action.handle(
      this._actionMap,
      SideBarHeader.Actions.SearchUpdated,
      "string",
      (search) => this.search(search)
    );

    action.handle(
      this._actionMap,
      NoteEditor.Actions.EditorClosed,
      "string",
      (id) => this.handleNoteClosed(id)
    );
    action.handle(
      this._actionMap,
      NoteEditor.Actions.EditorOpened,
      "string",
      (id) => this.handleNoteOpened(id)
    );
  }

  private deleteNote(id: string) {
    if (id === this._openNoteId) {
      this.grab_focus();
    }
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
    this._openNoteId = this._notesDir.newNote();
    this.sync();
    action.invoke(
      this._actionMap,
      NoteListItem.Actions.DoOpen,
      this._openNoteId
    );
  }

  private handleNoteClosed(id: string) {
    if (this._openNoteId === id) {
      this._openNoteId = null;
    }
  }

  private handleNoteOpened(id: string) {
    this._openNoteId = id;
  }

  private handlePromptRenameCurrent() {
    if (!this._openNoteId) return;
    action.invoke(this._actionMap, Layout.Actions.ShowSidebarChanged, true);
    this.promptRename(this._openNoteId);
  }
}
