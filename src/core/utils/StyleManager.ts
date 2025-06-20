import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Pango from "@girs/pango-1.0";
import GLib from "@girs/glib-2.0";

import { AppShortcuts } from "../ShortcutManager";

interface StyleManagerParams {
  keyController: Gtk.EventControllerKey;
  buffer: Gtk.TextBuffer;
  shortcuts: AppShortcuts;
  actionMap: Gio.ActionMap;
}

const TextDecorations = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
} as const;

const TextSizes = {
  [10]: `size-10`,
  [11]: `size-11`,
  [12]: `size-12`,
  [14]: `size-14`,
  [16]: `size-16`,
  [18]: `size-18`,
  [20]: `size-20`,
  [22]: `size-22`,
  [26]: `size-26`,
  [32]: `size-32`,
} as const;

const StyleTagNames = {
  ...Object.values(TextDecorations),
  ...Object.values(TextSizes),
} as const;

type TextDecorationTagName =
  (typeof TextDecorations)[keyof typeof TextDecorations];

type TextSizeTagName = (typeof TextSizes)[keyof typeof TextSizes];

// function isTextSizeDecorationName(value: string): value is TextSizeTagName {
//   const parts = value.split("-");
//   return (
//     parts.length == 2 &&
//     parts[0] === "size" &&
//     !isNaN(parseInt(parts[1])) &&
//     TextSizes[Number(parts[1]) as keyof typeof TextSizes] !== undefined
//   );
// }

type StyleTagName = TextDecorationTagName | TextSizeTagName;

interface StylePresetConfig {
  size: keyof typeof TextSizes;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}
const StylePresets = {
  normal: {
    size: 11,
    bold: false,
    italic: false,
    underline: false,
  },
  h1: {
    size: 26,
    bold: true,
    italic: false,
    underline: false,
  },
  h2: {
    size: 22,
    bold: true,
    italic: false,
    underline: false,
  },
  h3: {
    size: 18,
    bold: true,
    italic: false,
    underline: false,
  },
  h4: {
    size: 14,
    bold: true,
    italic: true,
    underline: false,
  },
} as const satisfies Record<string, StylePresetConfig>;

export default class StyleManager {
  static Actions = {
    ToggleBold: "toggle-bold",
    ToggleItalics: "toggle-italics",
  } as const;

  private readonly keyController: Gtk.EventControllerKey;
  private readonly buffer: Gtk.TextBuffer;
  private readonly shortcuts: AppShortcuts;
  private readonly actionMap: Gio.ActionMap;

  private readonly styleTags: Record<StyleTagName, Gtk.TextTag>;

  private readonly currentDecorations: Set<TextDecorationTagName> = new Set([]);
  private currentSize: TextSizeTagName = TextSizes[StylePresets.normal.size];
  private _enabled: boolean = true;

  /**
   * Whether or not styles added to newly-added text should be inherrited from
   * the text styles at the current cursor position.
   *
   * This will always be true, unless the user changes styles after moving the cursor.
   */
  private inheritStyles: boolean = true;

  constructor({
    buffer,
    keyController,
    shortcuts,
    actionMap,
  }: StyleManagerParams) {
    this.keyController = keyController;
    this.buffer = buffer;
    this.shortcuts = shortcuts;
    this.actionMap = actionMap;

    this.styleTags = this.buildStyleTags();

    this.buffer.connect("insert-text", (_buffer, start, _text, length) => {
      this._enabled && this.handleBufferInsert(start, length);
    });

    this.listenForShortcuts();
  }

  public get enabled() {
    return this._enabled;
  }

  public enable() {
    this._enabled = true;
  }

  public disable() {
    this._enabled = false;
  }

  public tempDisable(doWhileDisabled: () => void) {
    this.disable();
    doWhileDisabled();
    this.enable();
  }

  private buildStyleTags(): Record<StyleTagName, Gtk.TextTag> {
    // TODO: build this dynamically?
    const tags: Record<StyleTagName, Gtk.TextTag> = {
      bold: new Gtk.TextTag({
        name: TextDecorations.bold,
        weight: Pango.Weight.BOLD,
      }),
      italic: new Gtk.TextTag({
        name: TextDecorations.italic,
        style: Pango.Style.ITALIC,
      }),
      underline: new Gtk.TextTag({
        name: TextDecorations.underline,
        underline: Pango.Underline.SINGLE,
      }),
      "size-10": new Gtk.TextTag({ name: TextSizes[10], sizePoints: 10 }),
      "size-11": new Gtk.TextTag({ name: TextSizes[11], sizePoints: 11 }),
      "size-12": new Gtk.TextTag({ name: TextSizes[12], sizePoints: 12 }),
      "size-14": new Gtk.TextTag({ name: TextSizes[14], sizePoints: 14 }),
      "size-16": new Gtk.TextTag({ name: TextSizes[16], sizePoints: 16 }),
      "size-18": new Gtk.TextTag({ name: TextSizes[18], sizePoints: 18 }),
      "size-20": new Gtk.TextTag({ name: TextSizes[20], sizePoints: 20 }),
      "size-22": new Gtk.TextTag({ name: TextSizes[22], sizePoints: 22 }),
      "size-26": new Gtk.TextTag({ name: TextSizes[26], sizePoints: 26 }),
      "size-32": new Gtk.TextTag({ name: TextSizes[32], sizePoints: 32 }),
    };

    Object.values(tags).forEach((tag) => this.buffer.tagTable.add(tag));

    return tags;
  }

  private listenForShortcuts() {
    this.keyController.connect("key-pressed", (_, key, _keycode, modifier) => {
      const shortcut = this.shortcuts.check({ key, modifier });
      switch (shortcut) {
        case "editor-shoctut-toggle-bold-text":
          this.toggleDecoration("bold");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-toggle-italic-text":
          this.toggleDecoration("italic");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-toggle-underline-text":
          this.toggleDecoration("underline");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-normal":
          this.setStylePreset("normal");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h1":
          this.setStylePreset("h1");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h2":
          this.setStylePreset("h2");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h3":
          this.setStylePreset("h3");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h4":
          this.setStylePreset("h4");
          return Gdk.EVENT_STOP;
        default:
          return Gdk.EVENT_PROPAGATE;
      }
    });
  }

  private toggleDecoration(tagname: TextDecorationTagName) {
    if (this.currentDecorations.has(tagname)) {
      this.currentDecorations.delete(tagname);
    } else {
      this.currentDecorations.add(tagname);
    }
  }

  private setStylePreset(type: keyof typeof StylePresets) {
    const { bold, italic, size, underline } = StylePresets[type];
    this.currentDecorations.clear();

    bold && this.currentDecorations.add("bold");
    italic && this.currentDecorations.add("italic");
    underline && this.currentDecorations.add("underline");
    this.currentSize = TextSizes[size];
  }

  private handleBufferInsert(start: Gtk.TextIter, length: number) {
    const startOffset = start.get_offset();
    const endOffset = startOffset + length;

    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      const start = this.buffer.get_iter_at_offset(startOffset);
      const end = this.buffer.get_iter_at_offset(endOffset);

      for (const style of this.currentDecorations) {
        const tag = this.styleTags[style];
        this.buffer.apply_tag(tag, start, end);
      }

      const tag = this.styleTags[this.currentSize];
      this.buffer.apply_tag(tag, start, end);

      return GLib.SOURCE_REMOVE;
    });
  }
}
