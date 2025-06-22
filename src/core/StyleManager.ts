import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import Gdk from "@girs/gdk-4.0";
import Pango from "@girs/pango-1.0";
import GLib from "@girs/glib-2.0";

import { AppShortcuts } from "./ShortcutManager";
import action from "./utils/action";
import str from "./utils/str";
import obj from "./utils/obj";

export const TextDecorations = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
} as const;

export const TextSizes = {
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

const TextSizesByTagName = Object.entries(TextSizes).reduce(
  (obj, [key, val]) => ({ ...obj, [val]: Number(key) }),
  {} as {
    [K in keyof typeof TextSizes as (typeof TextSizes)[K]]: K;
  }
);

type TextDecorationTagName =
  (typeof TextDecorations)[keyof typeof TextDecorations];
type TextSizeTagName = (typeof TextSizes)[keyof typeof TextSizes];
type StyleTagName = TextDecorationTagName | TextSizeTagName;

function isTextDecorationTagName(
  value: unknown
): value is TextDecorationTagName {
  return (
    !!value &&
    Object.values(TextDecorations).includes(value as TextDecorationTagName)
  );
}

function isTextSizeTagName(value: unknown): value is TextSizeTagName {
  return !!value && Object.values(TextSizes).includes(value as TextSizeTagName);
}

interface StylePresetConfig {
  size: keyof typeof TextSizes;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}
export const StylePresets = {
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

interface StyleManagerParams {
  keyController: Gtk.EventControllerKey;
  buffer: Gtk.TextBuffer;
  shortcuts: AppShortcuts;
  actionMap: Gio.ActionMap;
}

export default class StyleManager {
  static Actions = {
    ToggleBold: "toggle-bold",
    ToggleItalics: "toggle-italics",
    ToggleUnderline: "toggle-underline",
    SetBoldEnabled: "set-bold-enabled",
    SetItalicEnabled: "set-italic-enabled",
    SetUnderlineEnabled: "set-underline-enabled",
    SetTextSize: "set-text-size",
  } as const;

  static TextSizes = TextSizes;
  static StylePresets = StylePresets;

  private readonly keyController: Gtk.EventControllerKey;
  private readonly buffer: Gtk.TextBuffer;
  private readonly shortcuts: AppShortcuts;
  private readonly actionMap: Gio.ActionMap;

  private readonly styleTags: Record<StyleTagName, Gtk.TextTag>;

  private readonly currentDecorations: Set<TextDecorationTagName> = new Set([]);
  private currentSize: TextSizeTagName = TextSizes[StylePresets.normal.size];
  private _enabled: boolean = true;

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

    this.buffer.connect("mark-set", (_, iter, mark) => {
      this._enabled && this.handleMarkSet(mark, iter);
    });

    this.registerActions();
    this.listenForShortcuts();
  }

  public reset() {
    this.currentDecorations.clear();
    this.currentSize = TextSizes[StylePresets.normal.size];
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

  /**
   * Temporarily disable the styles while executing the specified function.
   *
   * This is used when deserializing an existing note, which may already have
   * style tags embeded in it.
   */
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

  private handleMarkSet(mark: Gtk.TextMark, iter: Gtk.TextIter) {
    if (mark.name !== "insert") return;

    // Keep track of what tags are present, so we know which are not present
    const has: Record<TextDecorationTagName, boolean> = {
      bold: false,
      italic: false,
      underline: false,
    };

    // Cycle through tags and firing relevant action
    for (const tag of iter.get_tags()) {
      if (isTextSizeTagName(tag.name)) {
        const size = TextSizesByTagName[tag.name];
        action.invoke(this.actionMap, StyleManager.Actions.SetTextSize, size);
      } else if (isTextDecorationTagName(tag.name)) {
        has[tag.name] = true;
        action.invoke(
          this.actionMap,
          StyleManager.Actions[`Set${str.pascal(tag.name)}Enabled`],
          true
        );
      }
    }

    // Cycle through missing tags and fire relevant action
    for (const key of obj.keys(has)) {
      // if the tag was present, this is true, and we we've already fired an action for it.
      if (has[key]) continue;

      // we know this style tag is not enabled, so fire action to tell the rest of the app
      const actionName = StyleManager.Actions[`Set${str.pascal(key)}Enabled`];
      action.invoke(this.actionMap, actionName, false);
    }
  }

  public toggleDecoration(tagName: TextDecorationTagName) {
    const [hasSelection, start, end] = this.buffer.get_selection_bounds();
    if (hasSelection) {
      this.toggleDecorationAtSelection(start, end, tagName);
      return;
    }

    let enabled = false;
    if (this.currentDecorations.has(tagName)) {
      this.currentDecorations.delete(tagName);
      enabled = false;
    } else {
      this.currentDecorations.add(tagName);
      enabled = true;
    }
    // action.invoke(
    //   this.actionMap,
    //   StyleManager.Actions[`Set${str.pascal(tagName)}Enabled`],
    //   enabled
    // );
  }

  private setStylePreset(preset: keyof typeof StylePresets) {
    const [hasSelection, start, end] = this.buffer.get_selection_bounds();
    if (hasSelection) {
      this.replaceSelectionStylesWithPreset(start, end, preset);
      return;
    }

    const { bold, italic, size, underline } = StylePresets[preset];
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

  /**
   * When the user has text selected and tries to change styles, the styles
   * should be applied only to the text that's currently selected.
   */
  private replaceSelectionStylesWithPreset(
    start: Gtk.TextIter,
    end: Gtk.TextIter,
    preset: keyof typeof StylePresets
  ) {
    const { bold, italic, size, underline } = StylePresets[preset];

    // Since we're replacing styles at the current selection, we need to
    // remove all existing style tags first
    for (const tag of Object.values(this.styleTags)) {
      this.buffer.remove_tag(tag, start, end);
    }

    // Apply all decoration tags for the given preset
    const applyDecoration = (tagName: TextDecorationTagName) => {
      const tag = this.styleTags[tagName];
      this.buffer.apply_tag(tag, start, end);
    };
    bold && applyDecoration("bold");
    italic && applyDecoration("italic");
    underline && applyDecoration("underline");

    // Apply the font tag for the preset
    const tag = this.styleTags[`size-${size}`];
    this.buffer.apply_tag(tag, start, end);
  }

  private toggleDecorationAtSelection(
    start: Gtk.TextIter,
    end: Gtk.TextIter,
    tagName: TextDecorationTagName
  ) {
    const tag = this.styleTags[tagName];

    // If the tag is applied to the entire selection range, then remove it, othewise add it
    if (this.isTagFullyAppliedAtSelection(tag, start, end)) {
      this.buffer.remove_tag(tag, start, end);
    } else {
      this.buffer.apply_tag(this.styleTags[tagName], start, end);
    }
  }

  private isTagFullyAppliedAtSelection(
    tag: Gtk.TextTag,
    start: Gtk.TextIter,
    end: Gtk.TextIter
  ): boolean {
    const iter = start.copy();

    while (iter.compare(end) < 0) {
      if (!iter.has_tag(tag)) {
        return false;
      }
      // Optimization: Skip forward to next place tag changes (toggle)
      iter.forward_to_tag_toggle(tag);

      // Prevent overshooting:
      if (iter.compare(end) >= 0) break;
    }

    return true;
  }

  private registerActions() {
    action.create(this.actionMap, StyleManager.Actions.SetTextSize, "int");
    action.create(this.actionMap, StyleManager.Actions.SetBoldEnabled, "bool");
    action.create(
      this.actionMap,
      StyleManager.Actions.SetItalicEnabled,
      "bool"
    );
    action.create(
      this.actionMap,
      StyleManager.Actions.SetUnderlineEnabled,
      "bool"
    );
  }
}
