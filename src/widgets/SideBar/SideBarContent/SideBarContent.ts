import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";

import NoteList from "../NoteList";
import NoteCategories from "./NoteCategories";
import NotesDir from "../../../core/fs/NotesDir";
import { AppPrefs } from "../../../core/PreferencesManager";

interface SideBarContentParams {
  actionMap: Gio.ActionMap;
  notesDir: Readonly<NotesDir>;
  prefs: AppPrefs;
}
export default class SideBarContent extends Gtk.Box {
  static {
    GObject.registerClass({ GTypeName: "SideBarContent" }, this);
  }

  private categories: NoteCategories;
  private noteList: NoteList;

  constructor({ actionMap, notesDir, prefs }: SideBarContentParams) {
    super({ orientation: Gtk.Orientation.VERTICAL });
    this.categories = new NoteCategories({ prefs });
    this.noteList = new NoteList({ actionMap, notesDir, prefs });

    this.categories.connect(
      NoteCategories.Signals.CategoryClicked.name,
      (_, category) => this.noteList.filterCategory(category)
    );

    this.append(this.noteList);
    this.append(this.categories);
  }
}
