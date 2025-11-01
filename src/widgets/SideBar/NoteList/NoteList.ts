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
import { AppPrefs } from "../../../core/PreferencesManager";

// TODO: Consider allowing multiple rows to be selected.
// It's a bit of a pain trying to delete multiple notes at the moment.

interface NoteListParams {
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
  prefs: AppPrefs;
}

export default class NoteList extends Gtk.ScrolledWindow {
  static {
    GObject.registerClass({ GTypeName: "NoteList" }, this);
  }

  private readonly _prefs: AppPrefs;
  private readonly _notesDir: Readonly<NotesDir>;
  private readonly _listBox: Gtk.ListBox;
  private _listItems: Record<string, NoteListItem>;
  private readonly _actionMap: Gio.ActionMap;
  private _openNoteId: string | null = null;
  private _search: string | null = null;
  private _currentCategory: NoteCategory = "all";
  private showListContextMenu: (x: number, y: number, noteId: string) => void;

  constructor({ notesDir, actionMap, prefs }: NoteListParams) {
    super();
    this._notesDir = notesDir;
    this._actionMap = actionMap;
    this._prefs = prefs;
    this._listItems = {};
    this.registerActionHandlers();

    this._listBox = new Gtk.ListBox({
      halign: Gtk.Align.FILL,
      hexpand: true,
      vexpand: true,
      cssClasses: ["navigation-sidebar"],
    });

    this.showListContextMenu = debounce(
      50,
      (x: number, y: number, noteId: string) =>
        this.buildContextMenu(noteId).popupAt(x, y)
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

  private sync() {
    this._listBox.remove_all();
    this._listItems = {};

    // TODO: Refactor
    let selected: string | null = null;
    const lowerSearch = this._search?.toLowerCase();
    Object.entries(this._notesDir.list())
      .filter(([_, { name, starred, locked, hidden }]) => {
        if (lowerSearch && !name.toLowerCase().includes(lowerSearch)) {
          return false;
        }
        if (!this._prefs.categoriesEnabled) {
          return true;
        }
        return (
          (this._currentCategory === "all" && !hidden) ||
          (this._currentCategory === "favourite" && starred) ||
          (this._currentCategory === "locked" && locked) ||
          (this._currentCategory === "hidden" && hidden)
        );
      })
      .sort(([_a, a], [_b, b]) => b.updatedOn.getTime() - a.updatedOn.getTime())
      .forEach(([id, data]) => {
        const note = new NoteListItem({
          id,
          name: data.name,
          actionMap: this._actionMap,
          locked: data.locked,
          starred: data.starred,
          hidden: data.hidden,
          prefs: this._prefs,
        });
        note.connect(
          NoteListItem.Signals.ContextMenuRequested.name,
          (_, noteId, x, y) => this.showListContextMenu(x, y, noteId)
        );

        if (id === this._openNoteId) {
          selected = id;
        }
        this._listItems[id] = note;
        this._listBox.append(note);
      });

    if (selected) {
      this._listBox.select_row(this._listItems[selected]);
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
      GLib.idle_add(GLib.PRIORITY_HIGH, () => {
        this.sync();
        return GLib.SOURCE_REMOVE;
      })
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

    action.handle(
      this._actionMap,
      NoteListItem.Actions.ToggleHide,
      (param) => param!.deepUnpack() as [string, boolean],
      ([noteId, hidden]) => this.handleToggleHidden(noteId, hidden)
    );
    action.handle(
      this._actionMap,
      NoteListItem.Actions.ToggleLocked,
      (param) => param!.deepUnpack() as [string, boolean],
      ([noteId, locked]) => this.handleToggleLocked(noteId, locked)
    );
    action.handle(
      this._actionMap,
      NoteListItem.Actions.ToggleStarred,
      (param) => param!.deepUnpack() as [string, boolean],
      ([noteId, starred]) => this.handleToggleStarred(noteId, starred)
    );
  }
  private handleToggleHidden(noteId: string, hidden: boolean): void {
    this._notesDir.metaFile.setHidden(noteId, hidden);
    this.sync();
  }
  private handleToggleStarred(noteId: string, starred: boolean): void {
    this._notesDir.metaFile.setStarred(noteId, starred);
    this.sync();
  }
  private handleToggleLocked(noteId: string, locked: boolean): void {
    this._notesDir.metaFile.setLocked(noteId, locked);
    this.sync();
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

  private buildContextMenu(noteId: string) {
    const { starred, hidden, locked } = this._listItems[noteId];

    const builder = ContextMenu.builder()
      .add("Open", "win", NoteListItem.Actions.DoOpen, noteId)
      .add("Rename", "win", NoteListItem.Actions.PromptRename, noteId)
      .add("Delete", "win", NoteListItem.Actions.PromptDelete, noteId)
      .add("Rename", "win", NoteListItem.Actions.PromptRename, noteId);

    if (this._prefs.get("enable-categories")) {
      // prettier-ignore
      builder
        .add(starred ? 'Unstar' : 'Star', 'win', NoteListItem.Actions.ToggleStarred, ['(sb)', [noteId, !starred]])
        .add(locked ? 'Unlock' : 'Lock', 'win', NoteListItem.Actions.ToggleLocked, ['(sb)', [noteId, !locked]])
        .add(hidden ? 'Unhide' : 'Hide', 'win', NoteListItem.Actions.ToggleHide, ['(sb)', [noteId, !hidden]])
    }

    return builder.parent(this._listItems[noteId]).build();
  }
}
