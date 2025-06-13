import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";

interface ShortcutManagerParams {
  settings: Gio.Settings;
}

export const Shortcuts = {
  SaveNote: "save-note",
  NewNote: "new-note",
  DeleteNote: "delete-note",
  RenameNote: "rename-note",
  ToggleSidebar: "toggle-sidebar",
} as const;

export type ShortcutType = (typeof Shortcuts)[keyof typeof Shortcuts];
export type ShortcutKeys = { key: number; modifier: Gdk.ModifierType };

export const ShortcutLabels = {
  "delete-note": "Delete Note",
  "new-note": "New Note",
  "rename-note": "Rename Note",
  "save-note": "Save Note",
  "toggle-sidebar": "Toggle Sidebar",
} as const satisfies Record<ShortcutType, string>;

export const ShortcutDescriptions = {
  "delete-note": "",
  "new-note": "",
  "rename-note": "",
  "save-note": "",
  "toggle-sidebar": "",
} as const satisfies Record<ShortcutType, string>;

// prettier-ignore
const defaultShortcuts = {
  "new-note": Gtk.accelerator_name(Gdk.KEY_n, Gdk.ModifierType.CONTROL_MASK),
  "rename-note": Gtk.accelerator_name(Gdk.KEY_F12, null),
  "save-note": Gtk.accelerator_name(Gdk.KEY_s, Gdk.ModifierType.CONTROL_MASK),
  "delete-note": Gtk.accelerator_name(Gdk.KEY_Delete,Gdk.ModifierType.SHIFT_MASK),
  "toggle-sidebar": Gtk.accelerator_name(Gdk.KEY_h,Gdk.ModifierType.CONTROL_MASK),
} satisfies Record<ShortcutType, string>;

export interface AppShortcuts {
  isSaveNote(keys: ShortcutKeys): boolean;
  isNewNote(keys: ShortcutKeys): boolean;
  isDeleteNote(keys: ShortcutKeys): boolean;
  isRenameNote(keys: ShortcutKeys): boolean;
  isToggleSidebar(keys: ShortcutKeys): boolean;
  check(keys: ShortcutKeys): ShortcutType | null;
  get(shortcut: ShortcutType): ShortcutKeys;
  getLabel(shortcut: ShortcutType): string;
  set(shortcut: ShortcutType, keys: ShortcutKeys): void;
  reset(shortcut: ShortcutType): void;
}

export default class ShortcutManager implements AppShortcuts {
  private settings: Gio.Settings;

  private saveNote!: ShortcutKeys;
  private newNote!: ShortcutKeys;
  private renameNote!: ShortcutKeys;
  private deleteNote!: ShortcutKeys;
  private toggleSidebar!: ShortcutKeys;

  constructor({ settings }: ShortcutManagerParams) {
    this.settings = settings;

    this.loadShortcuts();

    this.settings.connect("changed", () => this.loadShortcuts());
  }

  public reset(shortcut: ShortcutType): void {
    this.settings.set_string(shortcut, defaultShortcuts[shortcut]);
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
      default:
        throw new Error(`Invalid shortcut: ${shortcut}`);
    }
  }

  getLabel(shortcut: ShortcutType): string {
    return ShortcutLabels[shortcut];
  }

  public set(shortcut: ShortcutType, { key, modifier }: ShortcutKeys): void {
    this.settings.set_string(shortcut, Gtk.accelerator_name(key, modifier));
  }

  public isSaveNote(keys: ShortcutKeys): boolean {
    return this.isMatch(keys, this.saveNote);
  }

  public isNewNote(keys: ShortcutKeys): boolean {
    return this.isMatch(keys, this.newNote);
  }

  public isDeleteNote(keys: ShortcutKeys): boolean {
    return this.isMatch(keys, this.deleteNote);
  }

  public isRenameNote(keys: ShortcutKeys): boolean {
    return this.isMatch(keys, this.renameNote);
  }

  public isToggleSidebar(keys: ShortcutKeys): boolean {
    return this.isMatch(keys, this.toggleSidebar);
  }

  public check(keys: ShortcutKeys): ShortcutType | null {
    if (this.isSaveNote(keys)) return "save-note";
    if (this.isNewNote(keys)) return "new-note";
    if (this.isDeleteNote(keys)) return "delete-note";
    if (this.isRenameNote(keys)) return "rename-note";
    if (this.isToggleSidebar(keys)) return "toggle-sidebar";
    return null;
  }

  private isMatch(
    { key: inKey, modifier: inMod }: ShortcutKeys,
    { key: actKey, modifier: actMod }: ShortcutKeys
  ): boolean {
    return inKey === actKey && (inMod & actMod) === actMod;
  }

  private getShotcut(name: ShortcutType): ShortcutKeys {
    const shortcut = this.settings.get_string(name);
    let [success, keyval, mods] = Gtk.accelerator_parse(shortcut);

    if (success)
      return {
        key: keyval,
        modifier: mods ?? Gdk.ModifierType.NO_MODIFIER_MASK,
      };

    console.log(
      `Error with keybinding ${name} ${shortcut}. Reverting to redefault ${defaultShortcuts[name]}`
    );

    this.settings.set_string(name, defaultShortcuts[name]);
    [success, keyval, mods] = Gtk.accelerator_parse(defaultShortcuts[name]);

    if (success)
      return {
        key: keyval,
        modifier: mods ?? Gdk.ModifierType.NO_MODIFIER_MASK,
      };

    throw new Error(`Problem with keybindings: ${name}`);
  }

  private loadShortcuts() {
    this.saveNote = this.getShotcut("save-note");
    this.newNote = this.getShotcut("new-note");
    this.renameNote = this.getShotcut("rename-note");
    console.log(
      this.renameNote,
      Gtk.accelerator_get_label(this.renameNote.key, this.renameNote.modifier)
    );
    this.deleteNote = this.getShotcut("delete-note");
    this.toggleSidebar = this.getShotcut("toggle-sidebar");
  }
}
