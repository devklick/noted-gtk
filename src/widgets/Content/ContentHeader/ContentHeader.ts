import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import { ICollapsable } from "../../SideBar/SideBar";
import NotesDir from "../../../core/fs/NotesDir";
import action from "../../../core/utils/action";
import NoteListItem from "../../SideBar/NoteList/NoteListItem";
import GLib from "@girs/glib-2.0";

import NoteEditor from "../NoteEditor";
import ContentHeaderTitle from "./ContentHeaderTitle";
import widget from "../../../core/utils/widget";
import icon from "../../../core/utils/icon";
import BurgerMenu from "./BurgerMenu";
import Layout from "../../Layout";

interface ContentHeaderParams {
  sideBar: ICollapsable;
  actionMap: Gio.ActionMap;
  notesDir: Readonly<NotesDir>;
}

export default class ContentHeader extends Adw.Bin {
  static {
    GObject.registerClass({ GTypeName: "ContentHeader" }, this);
  }

  private static _actionsCreated = false;

  public static Actions = {
    NewNote: "note-add",
  } as const;

  private readonly _adwHeader: Adw.HeaderBar;
  private readonly _actionMap: Gio.ActionMap;
  private readonly _notesDir: Readonly<NotesDir>;
  private readonly _titleWidget: ContentHeaderTitle;
  private readonly _saveButton: Gtk.Button;
  private readonly _deleteButton: Gtk.Button;
  private readonly _toggleSidebar: Gtk.Button;
  private readonly _addNoteButton: Gtk.Button;

  private _openNoteId: string | null = null;
  private _sidebarOpen: boolean = true;

  constructor({ actionMap, sideBar, notesDir }: ContentHeaderParams) {
    super({ name: "header-wrapper" });
    this.ensureActions();
    this._actionMap = actionMap;
    this._notesDir = notesDir;

    this._titleWidget = new ContentHeaderTitle();
    this._adwHeader = widget.header.new({
      name: "header",
      title: this._titleWidget,
      end: new BurgerMenu(),
    });

    this.set_child(this._adwHeader);
    this.registerActionHandlers();
    ({
      saveNotButton: this._saveButton,
      deleteNoteButton: this._deleteButton,
      toggleSidebar: this._toggleSidebar,
      addNoteButton: this._addNoteButton,
    } = this.createLeftIcons(sideBar));
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    action.create(actionMap, ContentHeader.Actions.NewNote);
    ContentHeader._actionsCreated = true;
  }

  private registerActionHandlers() {
    action.handle(
      this._actionMap,
      NoteListItem.Actions.DoOpen,
      "string",
      (id) => this.handleNoteOpened(id)
    );
    action.handle(
      this._actionMap,
      NoteListItem.Actions.DoRename,
      (param) => param?.deepUnpack() as [string, string],
      ([_, name]) => this._titleWidget.setTitle(name)
    );

    action.handle(
      this._actionMap,
      NoteEditor.Actions.EditorClosed,
      "string",
      (id) => this.handleNoteDeleted(id)
    );

    action.handle(
      this._actionMap,
      NoteEditor.Actions.EditorDirty,
      "bool",
      (dirty) => this.handleEditorDirty(dirty)
    );

    action.handle(
      this._actionMap,
      Layout.Actions.ShowSidebarChanged,
      "bool",
      (show) => this.handleShowSideBar(show)
    );
  }

  private handleEditorDirty(dirty: boolean): void {
    this._titleWidget.setDirty(dirty);
    this._saveButton.set_sensitive(dirty);
  }

  private handleShowSideBar(show: boolean) {
    this._sidebarOpen = show;
    const iconName = icon.name(show ? "pan-start" : "pan-end", "symbolic");
    this._toggleSidebar.set_icon_name(iconName);
    this.toggleNewNoteSuggested();
  }

  private handleNoteOpened(noteId: string) {
    this._openNoteId = noteId;
    const note = this._notesDir.metaFile.getNoteMetadata(noteId);
    this._titleWidget.setTitle(note.name);
    this._saveButton.set_sensitive(false);
    this._deleteButton.set_sensitive(true);
    this.toggleNewNoteSuggested();
  }

  private handleNoteDeleted(id: string) {
    if (this._openNoteId === id) {
      this._openNoteId = null;
      this._titleWidget.clearTitle();
      this._saveButton.set_sensitive(false);
      this._deleteButton.set_sensitive(false);
      this.toggleNewNoteSuggested();
    }
  }

  private toggleNewNoteSuggested() {
    const suggested = !this._sidebarOpen && !this._openNoteId;
    const action = suggested ? "add" : "remove";
    this._addNoteButton[`${action}_css_class`]("suggested-action");
  }

  private createLeftIcons(sideBar: ICollapsable) {
    const toggleSidebar = new Gtk.Button({ iconName: "pan-start-symbolic" });

    toggleSidebar.connect("clicked", () => {
      const nowOpen = !sideBar.isOpen;
      sideBar.setIsOpen(nowOpen);
      this.handleShowSideBar(nowOpen);
    });

    const buttonContainer = widget.box.h({ spacing: 6 });

    const noteButtonGroup = widget.box.h({ cssClasses: ["linked"] });
    const addNoteButton = new Gtk.Button({
      iconName: icon.symbolic("list-add"),
      tooltip_text: "New Note",
    });
    addNoteButton.connect("clicked", () => {
      action.invoke(this._actionMap, ContentHeader.Actions.NewNote);
    });
    const saveNotButton = new Gtk.Button({
      iconName: icon.symbolic("media-floppy"),
      tooltip_text: "Save Note",
      sensitive: false,
    });
    saveNotButton.connect("clicked", () => {
      action.invoke(this._actionMap, NoteListItem.Actions.DoSave);
    });
    const deleteNoteButton = new Gtk.Button({
      iconName: icon.symbolic("edit-delete"),
      tooltip_text: "Delete Note",
      sensitive: false,
    });
    deleteNoteButton.connect("clicked", () => {
      action.invoke(
        this._actionMap,
        NoteListItem.Actions.PromptDelete,
        this._openNoteId
      );
    });

    noteButtonGroup.append(addNoteButton);
    noteButtonGroup.append(new Gtk.Separator());
    noteButtonGroup.append(saveNotButton);
    noteButtonGroup.append(new Gtk.Separator());
    noteButtonGroup.append(deleteNoteButton);

    buttonContainer.append(toggleSidebar);
    buttonContainer.append(noteButtonGroup);

    this._adwHeader.pack_start(buttonContainer);

    return { addNoteButton, deleteNoteButton, saveNotButton, toggleSidebar };
  }

  private ensureActions() {
    if (!ContentHeader._actionsCreated) {
      throw new Error(
        "ContentHeader.defineActions must be called before instantiation"
      );
    }
  }
}
