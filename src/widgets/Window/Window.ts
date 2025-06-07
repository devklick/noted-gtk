import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";

import SideBar from "../SideBar";
import Content from "../Content";
import action from "../../core/utils/action";
import NoteListItem from "../SideBar/NoteList/NoteListItem";
import NotesDir from "../../core/fs/NotesDir";

import ContentHeader from "../Content/ContentHeader";
import AppAboutDialog from "./dialogs/AppAboutDialog";
import AppPreferencesDialog from "./dialogs/AppPreferencesDialog";
import Layout from "../Layout/Layout";

interface WindowParams {
  notesDir: Readonly<NotesDir>;
  appName: string;
}

export default class Window extends Adw.ApplicationWindow {
  static {
    GObject.registerClass({ GTypeName: "Window" }, this);
  }

  private _notesDir: Readonly<NotesDir>;
  private _keyController: Gtk.EventControllerKey;
  private _appName: string;
  private _layout: Layout;

  constructor({ notesDir, appName }: WindowParams) {
    super({ name: "main-window", defaultHeight: 600, defaultWidth: 600 });
    this.set_size_request(500, 300);
    this._notesDir = notesDir;
    this._appName = appName;
    this.defineActions();

    this._keyController = new Gtk.EventControllerKey();
    this.add_controller(this._keyController);
    this._layout = new Layout({ actionMap: this, appName, notesDir });

    this.set_content(this._layout);

    this.registerActionHandlers();
  }

  public presentAboutDialog() {
    new AppAboutDialog({ appName: this._appName, parent: this });
  }

  public presentPreferencesDialog() {
    new AppPreferencesDialog({ parent: this });
  }

  private defineActions() {
    Content.defineActions(this);
    SideBar.defineActions(this);
    Layout.defineActions(this);
  }

  private registerActionHandlers() {
    action.handle(this, NoteListItem.Actions.PromptDelete, "string", (id) =>
      this.buildDeleteDialog(id)
    );

    this._keyController.connect("key-pressed", (_, keyval, keycode, state) => {
      const ctrl = state & Gdk.ModifierType.CONTROL_MASK;

      if (ctrl && (keyval === Gdk.KEY_N || keyval === Gdk.KEY_n)) {
        action.invoke(this, ContentHeader.Actions.NewNote);
        return Gdk.EVENT_STOP;
      }

      if (!ctrl && keyval === Gdk.KEY_F2) {
        action.invoke(this, NoteListItem.Actions.PromptRenameCurrent);
        return Gdk.EVENT_STOP;
      }

      if (ctrl && (keyval === Gdk.KEY_H || keyval === Gdk.KEY_h)) {
        this._layout.toggleSideBar();
      }
    });
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
