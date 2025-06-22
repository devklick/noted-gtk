import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";

import icon from "../../../core/utils/icon";
import click from "../../../core/utils/click";
import widget from "../../../core/utils/widget";
import StyleManager from "../../../core/utils/StyleManager";

interface EditorStylesParams {
  styleManager: StyleManager;
  visible: boolean;
}

export default class EditorStyles extends Gtk.Box {
  static {
    GObject.registerClass({ GTypeName: "EditorSyles" }, this);
  }

  private styleManager: StyleManager;

  constructor({ styleManager, visible }: EditorStylesParams) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      halign: Gtk.Align.FILL,
      hexpand: true,
      cssClasses: ["editor-styles"],
      visible,
    });

    this.styleManager = styleManager;

    const toggleBold = new Gtk.ToggleButton({
      child: new Gtk.Label({ label: "<b>B</b>", useMarkup: true }),
      cssClasses: ["flat", "style-toggle"],
    });

    toggleBold.connect("toggled", () => {});

    const toggleItalic = new Gtk.ToggleButton({
      child: new Gtk.Label({ label: "<i>I</i>", useMarkup: true }),
      cssClasses: ["flat", "style-toggle"],
    });

    toggleItalic.connect("toggled", () => {});

    const toggleUnderline = new Gtk.ToggleButton({
      child: new Gtk.Label({ label: "<u>U</u>", useMarkup: true }),
      cssClasses: ["flat", "style-toggle"],
    });

    toggleUnderline.connect("toggled", () => {});

    const buttons = widget.box.h({
      spacing: 6,
      margin: 6,
      children: [
        toggleBold,
        toggleItalic,
        toggleUnderline,
        this.buildFontSizePicker(),
        this.buildStylePresetPicker(),
      ],
      visible: false,
    });

    const dropDownClickerBox = widget.box.h({
      hexpand: true,
      hAlign: "END",
      marginEnd: 12,
    });
    const dropdownClicker = new Gtk.Image({
      iconName: icon.symbolic("pan-down"),
    });
    dropDownClickerBox.append(dropdownClicker);

    click.handle("left", dropdownClicker, () => {
      const newVisible = !buttons.visible;
      buttons.set_visible(newVisible);
      dropdownClicker.iconName = icon.symbolic(
        newVisible ? "pan-up" : "pan-down"
      );

      if (newVisible) {
        this.remove(dropDownClickerBox);
        buttons.append(dropDownClickerBox);
      } else {
        buttons.remove(dropDownClickerBox);
        this.append(dropDownClickerBox);
      }
    });

    this.append(buttons);
    this.append(dropDownClickerBox);
  }

  // TODO: Need to create a custom DropDown for the pickers.
  // The items in the drop down list should be styled to reflect the style they represent,
  // but the selected item (e.g. shown when list is closed) should just use default style.
  // It's not possible to achieve this with the built-in DropDown widget.

  private buildFontSizePicker() {
    const model = Gtk.StringList.new(Object.keys(StyleManager.TextSizes));
    const factory = Gtk.SignalListItemFactory.new();

    factory.connect("setup", (_, listItem) => {
      const label = new Gtk.Label({ xalign: 0 });
      (listItem as Gtk.ListItem).set_child(label);
    });

    factory.connect("bind", (_, li) => {
      const listItem = li as Gtk.ListItem;
      const label = listItem.get_child() as Gtk.Label;
      const item = listItem.get_item() as Gtk.StringObject; // GObject holding the string
      const text = item.get_string();
      if (!label) return;

      // Reset styles first
      label.set_attributes(null);
      label.set_markup(text); // fallback to raw if you want

      const attrs = new Pango.AttrList();

      const textSize = Number(text) as keyof typeof StyleManager.TextSizes;
      attrs.insert(Pango.attr_size_new(textSize * Pango.SCALE));

      label.set_attributes(attrs);
      label.set_text(text);
    });

    return new Gtk.DropDown({
      model: model,
      factory: factory,
      cssClasses: ["style-toggle"],
    });
  }

  private buildStylePresetPicker() {
    const model = Gtk.StringList.new(Object.keys(StyleManager.StylePresets));

    const factory = Gtk.SignalListItemFactory.new();

    factory.connect("setup", (_, li) => {
      const label = new Gtk.Label({ xalign: 0 });
      (li as Gtk.ListItem).set_child(label);
    });

    factory.connect("bind", (_, li) => {
      const listItem = li as Gtk.ListItem;
      const label = listItem.get_child() as Gtk.Label;
      const item = listItem.get_item() as Gtk.StringObject; // GObject holding the string
      const text = item.get_string();
      if (!label) return;

      // Reset styles first
      label.set_attributes(null);
      label.set_markup(text); // fallback to raw if you want

      const attrs = new Pango.AttrList();

      const presetName = text as keyof typeof StyleManager.StylePresets;
      const { bold, italic, size, underline } =
        StyleManager.StylePresets[presetName];

      attrs.insert(Pango.attr_size_new(size * Pango.SCALE));
      bold && attrs.insert(Pango.attr_weight_new(Pango.Weight.BOLD));
      italic && attrs.insert(Pango.attr_style_new(Pango.Style.ITALIC));
      underline &&
        attrs.insert(Pango.attr_underline_new(Pango.Underline.SINGLE));

      label.set_attributes(attrs);
      label.set_text(text);
    });

    return new Gtk.DropDown({ model, factory });
  }
}
