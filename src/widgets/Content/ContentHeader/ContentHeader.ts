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

  private _openNoteId: string | null = null;

  constructor({ actionMap, sideBar, notesDir }: ContentHeaderParams) {
    super({ name: "header-wrapper" });
    this.ensureActions();
    this._titleWidget = new ContentHeaderTitle();
    this._adwHeader = new Adw.HeaderBar({
      name: "header",
      titleWidget: this._titleWidget,
    });
    this._actionMap = actionMap;
    this._notesDir = notesDir;

    const burgerMenu = new BurgerMenu({});
    this._adwHeader.pack_end(burgerMenu);

    this.set_child(this._adwHeader);

    this.registerActionHandlers();

    ({ saveNotButton: this._saveButton, deleteNoteButton: this._deleteButton } =
      this.createLeftIcons(sideBar));
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
      (dirty) => this._titleWidget.setDirty(dirty)
    );
  }

  private handleNoteOpened(noteId: string) {
    this._openNoteId = noteId;
    const note = this._notesDir.metaFile.getNoteMetadata(noteId);
    this._titleWidget.setTitle(note.name);
    this._saveButton.set_sensitive(true);
    this._deleteButton.set_sensitive(true);
  }

  private handleNoteDeleted(id: string) {
    if (this._openNoteId === id) {
      this._openNoteId = null;
      this._titleWidget.clearTitle();
      this._saveButton.set_sensitive(false);
      this._deleteButton.set_sensitive(false);
    }
  }

  private createLeftIcons(sideBar: ICollapsable) {
    const toggleSidebar = new Gtk.Button({ iconName: "pan-start-symbolic" });

    toggleSidebar.connect("clicked", () => {
      const nowOpen = !sideBar.isOpen;
      sideBar.setIsOpen(nowOpen);
      const iconName = icon.name(nowOpen ? "pan-start" : "pan-end", "symbolic");
      toggleSidebar.set_icon_name(iconName);
    });

    const buttonContainer = widget.box.h({ spacing: 6 });

    const noteButtonGroup = widget.box.h({ cssClasses: ["linked"] });
    const addNoteButton = new Gtk.Button({
      iconName: icon.name("list-add", "symbolic"),
      tooltip_text: "New Note",
    });
    addNoteButton.connect("clicked", () => {
      action.invoke(this._actionMap, ContentHeader.Actions.NewNote);
    });
    const saveNotButton = new Gtk.Button({
      iconName: icon.name("document-save", "symbolic"),
      tooltip_text: "Save Note",
      sensitive: false,
    });
    saveNotButton.connect("clicked", () => {
      action.invoke(this._actionMap, NoteListItem.Actions.DoSave);
    });
    const deleteNoteButton = new Gtk.Button({
      iconName: icon.name("edit-delete", "symbolic"),
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
