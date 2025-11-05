import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import GLib from "@girs/glib-2.0";

import NotesDir from "../../../core/fs/NotesDir";
import StylesToolbar from "./StylesToolbar";
import NoteListItem from "../../SideBar/NoteList/NoteListItem";
import { AppShortcuts, ShortcutType } from "../../../core/ShortcutManager";
import StyleManager from "../../../core/StyleManager";
import NoteSerializer from "../../../core/utils/NoteSerializer";
import action from "../../../core/utils/action";

// TODO: Add spell checking when better supported within the Gtk4 ecosystem

// When cursor moves, need to grab styles applied at that position and add them to current styles

interface NoteEditorParams {
  notesDir: Readonly<NotesDir>;
  actionMap: Gio.ActionMap;
  shortcuts: AppShortcuts;
}

export default class NoteEditor extends Gtk.Box {
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

  private readonly _notesDir: Readonly<NotesDir>;
  private readonly _textView: Gtk.TextView;
  private readonly _actionMap: Gio.ActionMap;
  private readonly _buffer: Gtk.TextBuffer;
  private readonly _textViewKeyController: Gtk.EventControllerKey;
  private readonly _shortcuts: AppShortcuts;
  private readonly _styleManager: StyleManager;
  private readonly _stylesToolbar: StylesToolbar;

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
    return NoteSerializer.serialize(this._buffer) !== this._savedText;
  }

  constructor({ notesDir, actionMap, shortcuts }: NoteEditorParams) {
    super({ orientation: Gtk.Orientation.VERTICAL });
    this.ensureActions();

    this._notesDir = notesDir;
    this._actionMap = actionMap;
    this._shortcuts = shortcuts;

    this._textViewKeyController = new Gtk.EventControllerKey();
    this._buffer = this.createBuffer();
    this._textView = this.createTextView(
      this._buffer,
      this._textViewKeyController
    );

    this._styleManager = new StyleManager({
      actionMap,
      buffer: this._buffer,
      styleContext: this._textView.get_style_context(),
    });

    this._stylesToolbar = new StylesToolbar({
      styleManager: this._styleManager,
      visible: false,
      actionMap: this._actionMap,
      keyController: this._textViewKeyController,
      shortcuts,
    });

    this.append(this._stylesToolbar);

    this.append(
      new Gtk.ScrolledWindow({
        child: this._textView,
        hexpand: true,
        vexpand: true,
      })
    );
    this.registerActionHandlers(actionMap);
  }

  private createTextView(
    buffer: Gtk.TextBuffer,
    textViewKeyController: Gtk.EventControllerKey
  ): Gtk.TextView {
    const textView = new Gtk.TextView({
      left_margin: 12,
      right_margin: 12,
      top_margin: 12,
      bottomMargin: 12,
      visible: false,
      buffer,
      wrapMode: Gtk.WrapMode.WORD,
    });
    textView.add_controller(textViewKeyController);
    return textView;
  }

  public load(id: string) {
    if (this._noteId === id) return;
    this.save();
    this.unload();
    this._noteId = id;

    // Disable undo to prevent being able to undo the load,
    // which essentially deletes everything from the open note.
    this._buffer.set_enable_undo(false);

    this._styleManager.tempDisable(() => {
      this._savedText = this._notesDir.loadNote(id);
      NoteSerializer.deserialize(this._savedText, this._buffer);
    });

    this._textView.visible = true;
    this._stylesToolbar.visible = true;
    const locked = this._notesDir.metaFile.getNoteMetadata(id).locked;
    this.setEditorLocked(locked);

    action.invoke(this._actionMap, NoteEditor.Actions.EditorDirty, false);
    action.invoke(this._actionMap, NoteEditor.Actions.EditorOpened, id);
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      this._textView.grab_focus();
      return GLib.SOURCE_REMOVE;
    });
    this._styleManager.reset();
    this._buffer.set_enable_undo(true);
  }

  public save() {
    if (!this._noteId || !this._isDirty) return;
    const serialized = NoteSerializer.serialize(this._buffer);
    this._notesDir.updateNote(this._noteId, serialized);

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
    this._stylesToolbar.visible = false;

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

    action.handle(actionMap, NoteListItem.Actions.DoSave, null, () =>
      this.save()
    );

    action.handle(
      actionMap,
      NoteListItem.Actions.ToggleLocked,
      (param) => param?.deepUnpack() as [string, boolean],
      ([noteId, locked]) => {
        if (this._noteId === noteId) {
          this.setEditorLocked(locked);
        }
      }
    );

    this._textViewKeyController.connect(
      "key-pressed",
      (_, key, _keycode, modifier) => this.handleKeyPressd(key, modifier)
    );
  }

  private handleKeyPressd(key: number, modifier: Gdk.ModifierType) {
    const shortcut = this._shortcuts.check({ key, modifier });
    if (shortcut) return this.handleShortcut(shortcut);
    return this.handleNonShortcutKeyPressed(key, modifier);
  }

  private handleShortcut(shortcut: ShortcutType): boolean {
    switch (shortcut) {
      case "delete-note":
        action.invoke(
          this._actionMap,
          NoteListItem.Actions.PromptDelete,
          this._noteId
        );
        return Gdk.EVENT_STOP;
      case "save-note":
        this.save();
        return Gdk.EVENT_STOP;
      case "rename-note":
        action.invoke(
          this._actionMap,
          NoteListItem.Actions.PromptRenameCurrent
        );
        return Gdk.EVENT_STOP;
      default:
        return Gdk.EVENT_PROPAGATE;
    }
  }

  private handleNonShortcutKeyPressed(
    key: number,
    modifier: Gdk.ModifierType
  ): boolean {
    if (key === Gdk.KEY_Return || key === Gdk.KEY_KP_Enter) {
      this._styleManager.setStylePreset("normal");
      return Gdk.EVENT_PROPAGATE;
    }
    return Gdk.EVENT_PROPAGATE;
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

  private createBuffer() {
    const buffer = new Gtk.TextBuffer();
    buffer.connect("changed", () => this.handleTextChanged());
    return buffer;
  }

  private setEditorLocked(locked: boolean) {
    this._textView.editable = !locked;
    this._textView.set_cursor_from_name(locked ? "not-allowed" : "text");
    this._textView.set_cursor_visible(!locked); // this is actually the caret
    this._stylesToolbar.setEnabled(!locked);
  }
}
