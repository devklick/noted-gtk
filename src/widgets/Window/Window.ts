import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";

import SideBar from "../SideBar";
import Content from "../Content";
import ContentHeader from "../Content/ContentHeader";
import AboutDialog from "./dialogs/AboutDialog";
import PreferencesDialog from "./dialogs/PreferencesDialog/PreferencesDialog";
import Layout from "../Layout/Layout";
import NoteListItem from "../SideBar/NoteList/NoteListItem";

import action from "../../core/utils/action";
import NotesDir from "../../core/fs/NotesDir";
import { AppShortcuts } from "../../core/ShortcutManager";
import SideBarHeader from "../SideBar/SideBarHeader";

interface WindowParams {
  notesDir: Readonly<NotesDir>;
  appName: string;
  shortcuts: AppShortcuts;
}

export default class Window extends Adw.ApplicationWindow {
  static {
    GObject.registerClass({ GTypeName: "Window" }, this);
  }

  private _notesDir: Readonly<NotesDir>;
  private _keyController: Gtk.EventControllerKey;
  private _appName: string;
  private _layout: Layout;
  private _shortcuts: AppShortcuts;

  constructor({ notesDir, appName, shortcuts }: WindowParams) {
    super({ name: "main-window", defaultHeight: 600, defaultWidth: 600 });
    this.set_size_request(500, 300);
    this._notesDir = notesDir;
    this._appName = appName;
    this._shortcuts = shortcuts;
    this.defineActions();

    this._keyController = new Gtk.EventControllerKey();
    this.add_controller(this._keyController);
    this._layout = new Layout({
      actionMap: this,
      appName,
      notesDir,
      shortcuts,
    });

    this.set_content(this._layout);

    this.registerActionHandlers();
  }

  public presentAboutDialog() {
    new AboutDialog({ appName: this._appName, parent: this });
  }

  public presentPreferencesDialog() {
    new PreferencesDialog({ parent: this, shortcuts: this._shortcuts });
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

    this._keyController.connect("key-pressed", (_, key, _keycode, modifier) => {
      console.log(this._shortcuts.check({ key, modifier }), { key, modifier });
      switch (this._shortcuts.check({ key, modifier })) {
        case "new-note":
          action.invoke(this, ContentHeader.Actions.NewNote);
          return Gdk.EVENT_STOP;
        case "toggle-sidebar":
          this._layout.toggleSideBar();
          return Gdk.EVENT_STOP;
        case "search-notes":
          action.invoke(this, SideBarHeader.Actions.FocusSearch);
          return Gdk.EVENT_STOP;

        default:
          return Gdk.EVENT_PROPAGATE;
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
