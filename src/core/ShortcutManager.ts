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

type Shortcut = (typeof Shortcuts)[keyof typeof Shortcuts];

const defaultShortcuts = {
  "new-note": Gtk.accelerator_name(Gdk.KEY_n, Gdk.ModifierType.CONTROL_MASK),
  "rename-note": Gtk.accelerator_name(Gdk.KEY_F12, null),
  "save-note": Gtk.accelerator_name(Gdk.KEY_s, Gdk.ModifierType.CONTROL_MASK),
  "delete-note": Gtk.accelerator_name(
    Gdk.KEY_Delete,
    Gdk.ModifierType.SHIFT_MASK
  ),
  "toggle-sidebar": Gtk.accelerator_name(
    Gdk.KEY_h,
    Gdk.ModifierType.CONTROL_MASK
  ),
} satisfies Record<Shortcut, string>;

type ShortcutKeys = [key: number, modifier: Gdk.ModifierType];

export interface AppShortcuts {
  isSaveNote(modifier: Gdk.ModifierType, key: number): boolean;
  isNewNote(modifier: Gdk.ModifierType, key: number): boolean;
  isDeleteNote(modifier: Gdk.ModifierType, key: number): boolean;
  isRenameNote(modifier: Gdk.ModifierType, key: number): boolean;
  isToggleSidebar(modifier: Gdk.ModifierType, key: number): boolean;
  check(modifier: Gdk.ModifierType, key: number): Shortcut | null;
  get(shortcut: Shortcut): ShortcutKeys | null;
  set(shortcut: Shortcut, keys: ShortcutKeys): void;
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

  public get(shortcut: Shortcut): ShortcutKeys | null {
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
        return null;
    }
  }

  public set(shortcut: Shortcut, keys: ShortcutKeys): void {
    this.settings.set_string(shortcut, Gtk.accelerator_name(keys[0], keys[1]));
  }

  public isSaveNote(modifier: Gdk.ModifierType, key: number): boolean {
    return this.isMatch([key, modifier], this.saveNote);
  }

  public isNewNote(modifier: Gdk.ModifierType, key: number): boolean {
    return this.isMatch([key, modifier], this.newNote);
  }

  public isDeleteNote(modifier: Gdk.ModifierType, key: number): boolean {
    return this.isMatch([key, modifier], this.deleteNote);
  }

  public isRenameNote(modifier: Gdk.ModifierType, key: number): boolean {
    return this.isMatch([key, modifier], this.renameNote);
  }

  public isToggleSidebar(modifier: Gdk.ModifierType, key: number): boolean {
    return this.isMatch([key, modifier], this.toggleSidebar);
  }

  public check(modifier: Gdk.ModifierType, key: number): Shortcut | null {
    if (this.isSaveNote(modifier, key)) return "save-note";
    if (this.isNewNote(modifier, key)) return "new-note";
    if (this.isDeleteNote(modifier, key)) return "delete-note";
    if (this.isRenameNote(modifier, key)) return "rename-note";
    if (this.isToggleSidebar(modifier, key)) return "toggle-sidebar";
    return null;
  }

  private isMatch(
    [inKey, inMod]: ShortcutKeys,
    [actKey, actMod]: ShortcutKeys
  ): boolean {
    return inKey === actKey && (inMod & actMod) === actMod;
  }

  private getShotcut(name: Shortcut): ShortcutKeys {
    const shortcut = this.settings.get_string(name);
    let [success, keyval, mods] = Gtk.accelerator_parse(shortcut);

    if (success) return [keyval, mods ?? Gdk.ModifierType.NO_MODIFIER_MASK];

    console.log(
      `Error with keybinding ${name} ${shortcut}. Reverting to redefault ${defaultShortcuts[name]}`
    );

    this.settings.set_string(name, defaultShortcuts[name]);
    [success, keyval, mods] = Gtk.accelerator_parse(defaultShortcuts[name]);

    if (success) return [keyval, mods ?? Gdk.ModifierType.NO_MODIFIER_MASK];

    throw new Error(`Problem with keybindings: ${name}`);
  }

  private loadShortcuts() {
    this.saveNote = this.getShotcut("save-note");
    this.newNote = this.getShotcut("new-note");
    this.renameNote = this.getShotcut("rename-note");
    this.deleteNote = this.getShotcut("delete-note");
    this.toggleSidebar = this.getShotcut("toggle-sidebar");
  }
}
