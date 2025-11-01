import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import Pango from "@girs/pango-1.0";
import GLib from "@girs/glib-2.0";

import action from "./utils/action";
import str from "./utils/str";
import obj from "./utils/obj";

export const TextDecorations = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  mono: "mono",
} as const;

export const TextSizes = obj.freezeDeep({
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
} as const);

const TextSizesByTagName = Object.entries(TextSizes).reduce(
  (acc, [textSize, tagName]) => ({ ...acc, [tagName]: Number(textSize) }),
  {} as {
    [K in keyof typeof TextSizes as (typeof TextSizes)[K]]: K;
  }
);
export type TextSizeTagName = (typeof TextSizes)[keyof typeof TextSizes];

type TextDecorationTagName =
  (typeof TextDecorations)[keyof typeof TextDecorations];

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
  mono: boolean;
}
export const StylePresets = obj.freezeDeep({
  custom: undefined,
  normal: {
    size: 11,
    bold: false,
    italic: false,
    underline: false,
    mono: false,
  },
  code: {
    size: 11,
    bold: false,
    italic: false,
    underline: false,
    mono: true,
  },
  h1: {
    size: 26,
    bold: true,
    italic: false,
    underline: false,
    mono: false,
  },
  h2: {
    size: 22,
    bold: true,
    italic: false,
    underline: false,
    mono: false,
  },
  h3: {
    size: 18,
    bold: true,
    italic: false,
    underline: false,
    mono: false,
  },
  h4: {
    size: 14,
    bold: true,
    italic: true,
    underline: false,
    mono: false,
  },
} as const satisfies Record<string, StylePresetConfig | undefined>);

export type StylePresetName = keyof typeof StylePresets | "custom";

interface StyleManagerParams {
  buffer: Gtk.TextBuffer;
  actionMap: Gio.ActionMap;
  styleContext: Gtk.StyleContext;
}

const Actions = obj.freezeDeep({
  BoldChanged: "bold-changed",
  ItalicChanged: "italic-changed",
  UnderlineChanged: "underline-changed",
  MonoChanged: "mono-changed",
  SizeChanged: "size-changed",
} as const);

export default class StyleManager {
  static Actions = Actions;

  static TextSizes = TextSizes;
  static StylePresets = StylePresets;

  private readonly buffer: Gtk.TextBuffer;
  private readonly actionMap: Gio.ActionMap;

  private readonly styleTags: Record<StyleTagName, Gtk.TextTag>;

  private readonly currentDecorations: Set<TextDecorationTagName> = new Set([]);
  private currentSize: TextSizeTagName = TextSizes[StylePresets.normal.size];
  private _enabled: boolean = true;
  private styleContext: Gtk.StyleContext;

  constructor({ buffer, actionMap, styleContext }: StyleManagerParams) {
    this.buffer = buffer;
    this.actionMap = actionMap;
    this.styleContext = styleContext;

    this.styleTags = this.buildStyleTags();

    this.buffer.connect("insert-text", (_buffer, start, _text, length) => {
      this._enabled && this.handleBufferInsert(start, length);
    });

    this.buffer.connect("mark-set", (_, iter, mark) => {
      this._enabled && this.handleMarkSet(mark, iter);
    });

    this.registerActions();
  }

  public get currentStylePreset(): [
    StylePresetName,
    StylePresetConfig | undefined
  ] {
    const matchesCurrentState = (
      config: StylePresetConfig | undefined
    ): boolean => {
      if (!config) return false;
      for (const [name, value] of Object.entries(config)) {
        if (isTextDecorationTagName(name)) {
          const shouldHave = Boolean(value);
          const hasDecoration = this.currentDecorations.has(name);
          if (shouldHave !== hasDecoration) return false;
        } else if (
          name === "size" &&
          TextSizes[value as keyof typeof TextSizes] !== this.currentSize
        ) {
          return false;
        }
      }
      return true;
    };

    const entry = Object.entries(StylePresets).find(([, config]) =>
      matchesCurrentState(config)
    ) as [keyof typeof StylePresets, StylePresetConfig] | undefined;

    return entry ? [...entry] : ["custom", undefined];
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
      mono: new Gtk.TextTag({
        name: TextDecorations.mono,
        family: "monospace",
        background: this.styleContext
          .lookup_color("theme_unfocused_bg_color")?.[1]
          .to_string(),
        letterSpacing: Pango.units_from_double(1.5),
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

  private handleMarkSet(mark: Gtk.TextMark, iter: Gtk.TextIter) {
    if (mark.name !== "insert") return;

    // TODO: This code is meant to check which tags are currently applied
    // and send an event that will cause the relevant style buttons to be set.
    // However, there's a bug where changing the selection actually changes the styles
    const [hasSelection, start, end] = this.buffer.get_selection_bounds();
    if (hasSelection) {
      this.emitDecorationsAtSelection(start, end);
      return;
    }

    this.currentDecorations.clear();
    // Cycle through tags and firing relevant action
    for (const tag of iter.get_tags()) {
      if (isTextSizeTagName(tag.name)) {
        const size = TextSizesByTagName[tag.name];
        this.currentSize = tag.name;
        action.invoke(this.actionMap, Actions.SizeChanged, size);
      } else if (isTextDecorationTagName(tag.name)) {
        this.currentDecorations.add(tag.name);
        action.invoke(
          this.actionMap,
          Actions[`${str.pascal(tag.name)}Changed`],
          true
        );
      }
    }

    // Cycle through missing tags and fire relevant action
    for (const key of obj.keys(TextDecorations) as TextDecorationTagName[]) {
      // if the tag was present, this is true, and we we've already fired an action for it.
      if (this.currentDecorations.has(key)) continue;

      // we know this style tag is not enabled, so fire action to tell the rest of the app
      const actionName = Actions[`${str.pascal(key)}Changed`];
      action.invoke(this.actionMap, actionName, false);
    }
  }

  public toggleDecoration(tagName: TextDecorationTagName, active: boolean) {
    const [hasSelection, start, end] = this.buffer.get_selection_bounds();
    if (hasSelection) {
      this.setDecorationActiveAtSelection(start, end, tagName, active);
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
    // This was previously causing infinit recursion.
    // Removing it has not caused any obvious issues, but leaving it for later reference
    // action.invoke(
    //   this.actionMap,
    //   Actions[`${str.pascal(tagName)}Changed`],
    //   enabled
    // );
  }

  public setSize(size: keyof typeof TextSizes) {
    const [hasSelection, start, end] = this.buffer.get_selection_bounds();
    if (hasSelection) {
      this.replaceSelectionTextSize(start, end, size);
      return;
    }

    this.currentSize = TextSizes[size];
  }

  public setStylePreset(preset: StylePresetName) {
    if (preset === "custom") return;
    const [hasSelection, start, end] = this.buffer.get_selection_bounds();
    if (hasSelection) {
      this.replaceSelectionStylesWithPreset(start, end, preset);
      return;
    }

    const { bold, italic, size, underline, mono } = StylePresets[preset];

    this.currentDecorations.clear();
    if (bold) this.currentDecorations.add("bold");
    if (italic) this.currentDecorations.add("italic");
    if (underline) this.currentDecorations.add("underline");
    if (mono) this.currentDecorations.add("mono");
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
    if (!StylePresets[preset]) return;
    const { bold, italic, size, underline, mono } = StylePresets[preset];

    this.currentDecorations.clear();

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
    if (bold) {
      applyDecoration("bold");
      this.currentDecorations.add("bold");
    }
    if (italic) {
      applyDecoration("italic");
      this.currentDecorations.add("italic");
    }
    if (underline) {
      applyDecoration("underline");
      this.currentDecorations.add("underline");
    }
    if (mono) {
      applyDecoration("mono");
      this.currentDecorations.add("mono");
    }

    this.currentSize = TextSizes[size];

    // Apply the font tag for the preset
    const tag = this.styleTags[`size-${size}`];
    this.buffer.apply_tag(tag, start, end);
  }

  private replaceSelectionTextSize(
    start: Gtk.TextIter,
    end: Gtk.TextIter,
    size: keyof typeof TextSizes
  ) {
    for (const tag of Object.values(this.styleTags)) {
      if (tag.name.startsWith("size-")) {
        this.buffer.remove_tag(tag, start, end);
      }
    }

    // Apply all decoration tags for the given preset
    const applyDecoration = (tagName: TextDecorationTagName) => {
      const tag = this.styleTags[tagName];
      this.buffer.apply_tag(tag, start, end);
    };
    // bold && applyDecoration("bold");
    // italic && applyDecoration("italic");
    // underline && applyDecoration("underline");

    // this.currentDecorations.clear();
    // if (bold) this.currentDecorations.add("bold");
    // if (italic) this.currentDecorations.add("italic");
    // if (underline) this.currentDecorations.add("underline");
    this.currentSize = TextSizes[size];

    // Apply the font tag for the preset
    const tag = this.styleTags[`size-${size}`];
    this.buffer.apply_tag(tag, start, end);
  }

  private setDecorationActiveAtSelection(
    start: Gtk.TextIter,
    end: Gtk.TextIter,
    tagName: TextDecorationTagName,
    active: boolean
  ) {
    const tag = this.styleTags[tagName];

    if (active) {
      this.buffer.apply_tag(this.styleTags[tagName], start, end);
    } else {
      this.buffer.remove_tag(tag, start, end);
    }
  }

  private emitDecorationsAtSelection(start: Gtk.TextIter, end: Gtk.TextIter) {
    for (const tagName of Object.values(TextDecorations)) {
      if (
        this.isTagFullyAppliedAtSelection(this.styleTags[tagName], start, end)
      ) {
        const actionName = Actions[`${str.pascal(tagName)}Changed`];
        action.invoke(this.actionMap, actionName, true);
        this.currentDecorations.add(tagName);
      }
    }

    // Cycle through missing tags and fire relevant action
    for (const key of obj.keys(TextDecorations)) {
      // if the tag was present, this is true, and we we've already fired an action for it.
      if (this.currentDecorations.has(key)) continue;

      // we know this style tag is not enabled, so fire action to tell the rest of the app
      const actionName = Actions[`${str.pascal(key)}Changed`];
      action.invoke(this.actionMap, actionName, false);
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
    action.create(this.actionMap, Actions.SizeChanged, "int");
    action.create(this.actionMap, Actions.BoldChanged, "bool");
    action.create(this.actionMap, Actions.ItalicChanged, "bool");
    action.create(this.actionMap, Actions.UnderlineChanged, "bool");
    action.create(this.actionMap, Actions.MonoChanged, "bool");
  }
}
