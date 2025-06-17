import Gtk from "@girs/gtk-4.0";
import { AppShortcuts } from "../ShortcutManager";
import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Pango from "@girs/pango-1.0";
import GLib from "@girs/glib-2.0";

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
  [12]: `size-12`,
  [14]: `size-14`,
  [16]: `size-16`,
  [18]: `size-18`,
  [20]: `size-20`,
  [22]: `size-22`,
  [26]: `size-26`,
  [32]: `size-32`,
} as const;

type TextDecorationTagName =
  (typeof TextDecorations)[keyof typeof TextDecorations];

type TextSizeTagName = (typeof TextSizes)[keyof typeof TextSizes];

function isTextSizeDecorationName(value: string): value is TextSizeTagName {
  const parts = value.split("-");
  return (
    parts.length == 2 &&
    parts[0] === "size" &&
    !isNaN(parseInt(parts[1])) &&
    TextSizes[Number(parts[1]) as keyof typeof TextSizes] !== undefined
  );
}

type StyleTagName = TextDecorationTagName | TextSizeTagName;

interface StylePresetConfig {
  size: keyof typeof TextSizes;
  bold: Pango.Weight;
  italic: Pango.Style;
  underline: Pango.Underline;
}
const StylePresets = {
  normal: {
    size: 14,
    bold: Pango.Weight.NORMAL,
    italic: Pango.Style.NORMAL,
    underline: Pango.Underline.NONE,
  },
  h1: {
    size: 26,
    bold: Pango.Weight.BOLD,
    italic: Pango.Style.NORMAL,
    underline: Pango.Underline.NONE,
  },
  h2: {
    size: 22,
    bold: Pango.Weight.BOLD,
    italic: Pango.Style.NORMAL,
    underline: Pango.Underline.NONE,
  },
  h3: {
    size: 18,
    bold: Pango.Weight.BOLD,
    italic: Pango.Style.NORMAL,
    underline: Pango.Underline.NONE,
  },
  h4: {
    size: 16,
    bold: Pango.Weight.BOLD,
    italic: Pango.Style.ITALIC,
    underline: Pango.Underline.NONE,
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

    this.buffer.connect("insert-text", (_buffer, start, _text, length) =>
      this.handleBufferInsert(start, length)
    );

    this.listenForShortcuts();
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
      console.log("key pressed");
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

      return GLib.SOURCE_REMOVE;
    });
  }
}
