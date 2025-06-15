import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";

const ShortcutGroups = {
  Application: {
    type: "application",
    label: "Application",
    description: "Key bindings to interact with the core application",
  },
  Editor: {
    type: "editor",
    label: "Editor",
    description:
      "Key bindings to interact with the note currently open in the editor",
  },
} as const satisfies Record<
  string,
  { type: string; label: string; description: string }
>;

export const Shortcuts = {
  SaveNote: {
    type: "save-note",
    description: "Save the current contents of the note",
    label: "Save note",
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_s, Gdk.ModifierType.CONTROL_MASK),
    caseSensitive: false,
  },
  NewNote: {
    type: "new-note",
    description: "Create a new note and open it in the editor",
    label: "New note",
    group: ShortcutGroups.Application,
    default: Gtk.accelerator_name(Gdk.KEY_n, Gdk.ModifierType.CONTROL_MASK),
    caseSensitive: false,
  },
  DeleteNote: {
    type: "delete-note",
    description: "Delete the currently-opened note",
    label: "Delete note",
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_Delete, Gdk.ModifierType.SHIFT_MASK),
    caseSensitive: false,
  },
  RenameNote: {
    type: "rename-note",
    description: "Rename the currently-opened note",
    label: "Rename note",
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_F2, null),
    caseSensitive: false,
  },
  ToggleSidebar: {
    type: "toggle-sidebar",
    description: "Toggle (show/hide) the sidebar",
    label: "Toggle sidebar",
    group: ShortcutGroups.Application,
    default: Gtk.accelerator_name(Gdk.KEY_h, Gdk.ModifierType.CONTROL_MASK),
    caseSensitive: false,
  },
  SearchNotes: {
    type: "search-notes",
    description:
      "Focuses on the search box in the sidebar and allows you to filter notes by name",
    label: "Search notes",
    group: ShortcutGroups.Application,
    default: Gtk.accelerator_name(
      Gdk.KEY_f,
      Gdk.ModifierType.CONTROL_MASK | Gdk.ModifierType.SHIFT_MASK
    ),
    caseSensitive: false,
  },
} as const satisfies Record<
  string,
  {
    type: string;
    description: string;
    label: string;
    group: (typeof ShortcutGroups)[keyof typeof ShortcutGroups];
    default: string;
    caseSensitive: boolean;
  }
>;

export type Shortcut = (typeof Shortcuts)[keyof typeof Shortcuts];
export type ShortcutType = (typeof Shortcuts)[keyof typeof Shortcuts]["type"];

export type ShortcutGroup =
  (typeof ShortcutGroups)[keyof typeof ShortcutGroups];

export type ShortcutGroupType =
  (typeof ShortcutGroups)[keyof typeof ShortcutGroups]["type"];

export type ShortcutKeys = { key: number; modifier: Gdk.ModifierType };

export interface AppShortcuts {
  isSaveNote(keys: ShortcutKeys): boolean;
  isNewNote(keys: ShortcutKeys): boolean;
  isDeleteNote(keys: ShortcutKeys): boolean;
  isRenameNote(keys: ShortcutKeys): boolean;
  isToggleSidebar(keys: ShortcutKeys): boolean;
  isSearchNotes(keys: ShortcutKeys): boolean;
  check(keys: ShortcutKeys): ShortcutType | null;
  get(shortcut: ShortcutType): ShortcutKeys;
  getLabel(shortcut: ShortcutType): string;
  getMeta(shortcut: ShortcutType): Shortcut;
  set(shortcut: ShortcutType, keys: ShortcutKeys): void;
  reset(shortcut: ShortcutType): void;
  getAll(): Array<Shortcut>;
}

interface ShortcutManagerParams {
  settings: Gio.Settings;
}

export default class ShortcutManager implements AppShortcuts {
  private settings: Gio.Settings;

  private saveNote!: ShortcutKeys;
  private newNote!: ShortcutKeys;
  private renameNote!: ShortcutKeys;
  private deleteNote!: ShortcutKeys;
  private toggleSidebar!: ShortcutKeys;
  private searchNotes!: ShortcutKeys;

  constructor({ settings }: ShortcutManagerParams) {
    this.settings = settings;

    this.loadShortcuts();

    this.settings.connect("changed", () => this.loadShortcuts());
  }

  public getAll(): Array<Shortcut> {
    return Object.values(Shortcuts);
  }

  public getMeta(shortcut: ShortcutType): Shortcut {
    return this.getAll().find(({ type }) => type === shortcut)!;
  }

  public reset(shortcut: ShortcutType): void {
    this.settings.set_string(shortcut, this.getMeta(shortcut).default);
  }

  public get(shortcut: ShortcutType): ShortcutKeys {
    switch (shortcut) {
      case "delete-note":
        return this.deleteNote;
      case "new-note":
        return this.newNote;
      case "rename-note":
        return this.renameNote;
      case "save-note":
        return this.saveNote;
      case "toggle-sidebar":
        return this.toggleSidebar;
      case "search-notes":
        return this.searchNotes;
      default:
        throw new Error(`Invalid shortcut: ${shortcut}`);
    }
  }

  getLabel(shortcut: ShortcutType): string {
    return this.getMeta(shortcut).label;
  }

  public set(shortcut: ShortcutType, { key, modifier }: ShortcutKeys): void {
    this.settings.set_string(shortcut, Gtk.accelerator_name(key, modifier));
  }

  public isSaveNote(keys: ShortcutKeys): boolean {
    return this.isMatch(
      keys,
      this.saveNote,
      this.getMeta("save-note").caseSensitive
    );
  }

  public isNewNote(keys: ShortcutKeys): boolean {
    return this.isMatch(
      keys,
      this.newNote,
      this.getMeta("new-note").caseSensitive
    );
  }

  public isDeleteNote(keys: ShortcutKeys): boolean {
    return this.isMatch(
      keys,
      this.deleteNote,
      this.getMeta("delete-note").caseSensitive
    );
  }

  public isRenameNote(keys: ShortcutKeys): boolean {
    return this.isMatch(
      keys,
      this.renameNote,
      this.getMeta("rename-note").caseSensitive
    );
  }

  public isToggleSidebar(keys: ShortcutKeys): boolean {
    return this.isMatch(
      keys,
      this.toggleSidebar,
      this.getMeta("toggle-sidebar").caseSensitive
    );
  }
  public isSearchNotes(keys: ShortcutKeys): boolean {
    return this.isMatch(
      keys,
      this.searchNotes,
      this.getMeta("search-notes").caseSensitive
    );
  }

  public check(keys: ShortcutKeys): ShortcutType | null {
    if (this.isSaveNote(keys)) return "save-note";
    if (this.isNewNote(keys)) return "new-note";
    if (this.isDeleteNote(keys)) return "delete-note";
    if (this.isRenameNote(keys)) return "rename-note";
    if (this.isToggleSidebar(keys)) return "toggle-sidebar";
    if (this.isSearchNotes(keys)) return "search-notes";
    return null;
  }

  private isMatch(
    { key: inKey, modifier: inMod }: ShortcutKeys,
    { key: actKey, modifier: actMod }: ShortcutKeys,
    caseSensitive: boolean
  ): boolean {
    // prettier-ignore
    const keyMatch = inKey === actKey || 
      (!caseSensitive && Gdk.keyval_to_lower(inKey) === Gdk.keyval_to_lower(actKey));

    const modMatch = (inMod & actMod) === actMod;

    return keyMatch && modMatch;
  }

  private getShotcut(type: ShortcutType): ShortcutKeys {
    const shortcut = this.settings.get_string(type);
    let [success, keyval, mods] = Gtk.accelerator_parse(shortcut);

    if (success)
      return {
        key: keyval,
        modifier: mods ?? Gdk.ModifierType.NO_MODIFIER_MASK,
      };

    console.log(
      `Error with keybinding ${type} ${shortcut}. Reverting to redefault ${
        this.getMeta(type).default
      }`
    );

    this.settings.set_string(type, this.getMeta(type).default);
    [success, keyval, mods] = Gtk.accelerator_parse(this.getMeta(type).default);

    if (success)
      return {
        key: keyval,
        modifier: mods ?? Gdk.ModifierType.NO_MODIFIER_MASK,
      };

    throw new Error(`Problem with keybindings: ${type}`);
  }

  private loadShortcuts() {
    this.saveNote = this.getShotcut("save-note");
    this.newNote = this.getShotcut("new-note");
    this.renameNote = this.getShotcut("rename-note");
    this.deleteNote = this.getShotcut("delete-note");
    this.toggleSidebar = this.getShotcut("toggle-sidebar");
    this.searchNotes = this.getShotcut("search-notes");
  }
}
