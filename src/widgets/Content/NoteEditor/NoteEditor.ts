import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";

import NotesDir from "../../../core/fs/NotesDir";
import NoteListItem from "../../SideBar/NoteList/NoteListItem";

import action from "../../../core/utils/action";
import Gdk from "@girs/gdk-4.0";
import GLib from "@girs/glib-2.0";

// TODO: Add spell checking when better supported within the Gtk4 ecosystem

interface NoteEditorParams {
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
}

export default class NoteEditor extends Gtk.ScrolledWindow {
  static {
    GObject.registerClass({ GTypeName: "NoteEditor" }, this);
  }

  private static _actionsCreated = false;

  public static Actions = {
    EditorClosed: "editor-closed",
    EditorOpened: "editor-opened",
    EditorDirty: "editor-is-dirty",
    EditorSaved: "editor-saved",
  } as const;

  private _noteId: string | null = null;
  private _savedText: string | null = null;

  private _notesDir: Readonly<NotesDir>;
  private _textView: Gtk.TextView;
  private _actionMap: Gio.ActionMap;
  private _buffer: Gtk.TextBuffer;
  private _textViewKeyController: Gtk.EventControllerKey;

  private get bufferStart() {
    return this._buffer.get_start_iter();
  }
  private get bufferEnd() {
    return this._buffer.get_end_iter();
  }

  private get bufferText(): string {
    return this._buffer.get_text(this.bufferStart, this.bufferEnd, true);
  }

  private set bufferText(text: string | null) {
    this._buffer.set_text(text ?? "", -1);
  }

  private get _isDirty(): boolean {
    const start = this._buffer.get_start_iter();
    const end = this._buffer.get_end_iter();
    const currentText = this._buffer.get_text(start, end, true);
    return currentText !== this._savedText;
  }

  constructor({ notesDir, actionMap }: NoteEditorParams) {
    super({ hexpand: true, vexpand: true });
    this.ensureActions();

    this._notesDir = notesDir;
    this._actionMap = actionMap;

    this._textViewKeyController = new Gtk.EventControllerKey();
    this._textView = new Gtk.TextView({
      left_margin: 12,
      right_margin: 12,
      top_margin: 12,
      bottomMargin: 12,
      visible: false,
    });
    this._textView.add_controller(this._textViewKeyController);

    this._buffer = this._textView.get_buffer();
    this._buffer.connect("changed", () => this.handleTextChanged());

    this.set_child(this._textView);
    this.registerActionHandlers(actionMap);
  }

  public load(id: string) {
    if (this._noteId === id) return;
    this.save();
    this.unload();
    this._noteId = id;
    this._savedText = this._notesDir.loadNote(id);
    this.bufferText = this._savedText;
    this._textView.visible = true;
    action.invoke(this._actionMap, NoteEditor.Actions.EditorDirty, false);
    action.invoke(this._actionMap, NoteEditor.Actions.EditorOpened, id);
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      this._textView.grab_focus();
      return GLib.SOURCE_REMOVE;
    });
  }

  public save() {
    if (!this._noteId || !this._isDirty) return;
    this._notesDir.updateNote(this._noteId, this.bufferText);
    action.invoke(this._actionMap, NoteEditor.Actions.EditorDirty, false);
    action.invoke(
      this._actionMap,
      NoteEditor.Actions.EditorSaved,
      this._noteId
    );
  }

  public unload(): void {
    if (!this._noteId) return;
    const oldNoteId = this._noteId;
    this._noteId = null;
    this.bufferText = null;
    this._textView.visible = false;
    action.invoke(this._actionMap, NoteEditor.Actions.EditorClosed, oldNoteId);
    action.invoke(this._actionMap, NoteEditor.Actions.EditorDirty, false);
  }

  public static defineActions(actionMap: Gio.ActionMap) {
    action.create(actionMap, NoteEditor.Actions.EditorClosed, "string");
    action.create(actionMap, NoteEditor.Actions.EditorDirty, "bool");
    action.create(actionMap, NoteEditor.Actions.EditorSaved, "string");
    action.create(actionMap, NoteEditor.Actions.EditorOpened, "string");
    NoteEditor._actionsCreated = true;
  }

  private registerActionHandlers(actionMap: Gio.ActionMap) {
    action.handle(actionMap, NoteListItem.Actions.DoDelete, "string", (id) =>
      this.handleNotDeleted(id)
    );

    action.handle(actionMap, NoteListItem.Actions.DoOpen, "string", (id) =>
      this.load(id)
    );

    action.handle(actionMap, NoteListItem.Actions.DoSave, action.p.none, () =>
      this.save()
    );

    this._textViewKeyController.connect(
      "key-pressed",
      (_, keyval, _keycode, state) => {
        const ctrl = state & Gdk.ModifierType.CONTROL_MASK;
        const shift = state & Gdk.ModifierType.SHIFT_MASK;

        if (ctrl && (keyval === Gdk.KEY_S || keyval === Gdk.KEY_s)) {
          this.save();
          return Gdk.EVENT_STOP;
        }
        if (ctrl && shift && (keyval === Gdk.KEY_X || keyval === Gdk.KEY_x)) {
          action.invoke(
            this._actionMap,
            NoteListItem.Actions.PromptDelete,
            this._noteId
          );
          return Gdk.EVENT_STOP;
        }
      }
    );
  }

  private handleNotDeleted(id: string): void {
    if (this._noteId === id) {
      this.unload();
    }
  }

  private handleTextChanged() {
    action.invoke(
      this._actionMap,
      NoteEditor.Actions.EditorDirty,
      this._isDirty
    );
  }

  private ensureActions() {
    if (!NoteEditor._actionsCreated) {
      throw new Error(
        "NoteEditor.defineActions must be called before instantiation"
      );
    }
  }
}
