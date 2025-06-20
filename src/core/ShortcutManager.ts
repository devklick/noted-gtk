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

const Shortcuts = {
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
  OpenPreferences: {
    type: "open-prefs",
    description: "Opens the preferences dialog",
    label: "Open Preferences",
    group: ShortcutGroups.Application,
    default: Gtk.accelerator_name(Gdk.KEY_comma, Gdk.ModifierType.CONTROL_MASK),
    caseSensitive: false,
  },
  ToggleBoldText: {
    type: "editor-shoctut-toggle-bold-text",
    description: "Toggle bold text in the note editor",
    label: "Toggle Bold",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_b, Gdk.ModifierType.CONTROL_MASK),
  },
  ToggleItalicText: {
    type: "editor-shoctut-toggle-italic-text",
    description: "Toggle italic text in the note editor",
    label: "Toggle Italic",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_i, Gdk.ModifierType.CONTROL_MASK),
  },
  ToggleUnderlineText: {
    type: "editor-shoctut-toggle-underline-text",
    description: "Toggle underline text in the note editor",
    label: "Toggle Italic",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_u, Gdk.ModifierType.CONTROL_MASK),
  },
  SetTextSizeH1: {
    type: "editor-shoctut-text-size-h1",
    description: "Set text size to header (1) in the note editor",
    label: "Set Text Style Header (1)",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_1, Gdk.ModifierType.CONTROL_MASK),
  },
  SetH2Text: {
    type: "editor-shoctut-text-size-h2",
    description: "Set text size to header (2) in the note editor",
    label: "Set Text Style Header (2)",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_2, Gdk.ModifierType.CONTROL_MASK),
  },
  SetH3Text: {
    type: "editor-shoctut-text-size-h3",
    description: "Set text size to header (3) in the note editor",
    label: "Set Text Style Header (3)",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_3, Gdk.ModifierType.CONTROL_MASK),
  },
  SetH4Text: {
    type: "editor-shoctut-text-size-h4",
    description: "Set text size to header (4) in the note editor",
    label: "Set Text Style Header (4)",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_4, Gdk.ModifierType.CONTROL_MASK),
  },
  SetTextSizeNormal: {
    type: "editor-shoctut-text-size-normal",
    description: "Set text size to normal in the note editor",
    label: "Set Text Style Normal",
    caseSensitive: false,
    group: ShortcutGroups.Editor,
    default: Gtk.accelerator_name(Gdk.KEY_0, Gdk.ModifierType.CONTROL_MASK),
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
  check(keys: ShortcutKeys): ShortcutType | null;
  get(shortcut: ShortcutType): ShortcutKeys;
  getMeta(shortcut: ShortcutType): Shortcut;
  set(shortcut: ShortcutType, keys: ShortcutKeys): void;
  is(keys: ShortcutKeys, shortcut: ShortcutType): boolean;
  reset(shortcut: ShortcutType): void;
  getAll(): Array<Shortcut>;
}

interface ShortcutManagerParams {
  settings: Gio.Settings;
}

export default class ShortcutManager implements AppShortcuts {
  private settings: Gio.Settings;
  private shortcuts: Record<ShortcutType, ShortcutKeys>;

  constructor({ settings }: ShortcutManagerParams) {
    this.settings = settings;
    this.shortcuts = this.mapShortcuts();

    this.settings.connect(
      "changed",
      () => (this.shortcuts = this.mapShortcuts())
    );
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
    const keys = this.shortcuts[shortcut];
    if (!keys) {
      throw new Error(`Invalid shortcut: ${shortcut}`);
    }
    return keys;
  }

  public set(shortcut: ShortcutType, { key, modifier }: ShortcutKeys): void {
    this.settings.set_string(shortcut, Gtk.accelerator_name(key, modifier));
  }

  public check(keys: ShortcutKeys): ShortcutType | null {
    for (const { type } of Object.values(Shortcuts)) {
      if (this.isMatch(keys, type)) {
        return type;
      }
    }
    return null;
  }

  public is(keys: ShortcutKeys, shortcut: ShortcutType): boolean {
    return this.check(keys) === shortcut;
  }

  private isMatch(
    { key: inKey, modifier: inMod }: ShortcutKeys,
    shortcut: ShortcutType
  ): boolean {
    const { key: actKey, modifier: actMod } = this.shortcuts[shortcut];
    const caseSensitive = this.getMeta(shortcut).caseSensitive;

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
      `Error with keybinding ${type} ${shortcut}. Reverting to default ${
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

  private mapShortcuts(): Record<ShortcutType, ShortcutKeys> {
    return Object.values(Shortcuts).reduce(
      (obj, entry) => ({
        ...obj,
        [entry.type]: this.getShotcut(entry.type),
      }),
      {} as Record<ShortcutType, ShortcutKeys>
    );
  }
}
