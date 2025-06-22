import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";
import Gio from "@girs/gio-2.0";

import icon from "../../../core/utils/icon";
import click from "../../../core/utils/click";
import widget from "../../../core/utils/widget";
import StyleManager from "../../../core/StyleManager";
import action from "../../../core/utils/action";

interface EditorStylesParams {
  styleManager: StyleManager;
  visible: boolean;
  actionMap: Gio.ActionMap;
}

export default class EditorStyles extends Gtk.Box {
  static {
    GObject.registerClass({ GTypeName: "EditorSyles" }, this);
  }

  private styleManager: StyleManager;
  private expanded: boolean = false;
  private dropDownClickerBox: Gtk.Box;
  private dropDownClicker: Gtk.Image;
  private content: Gtk.Box;
  private actionMap: Gio.ActionMap;
  private fontSizePicker: Gtk.DropDown;
  private boldButton: Gtk.ToggleButton;
  private italicButton: Gtk.ToggleButton;
  private underlineButton: Gtk.ToggleButton;

  constructor({ styleManager, visible, actionMap }: EditorStylesParams) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      halign: Gtk.Align.FILL,
      hexpand: true,
      cssClasses: ["editor-styles"],
      visible,
    });

    this.styleManager = styleManager;
    this.actionMap = actionMap;

    const toggler = (label: string, tooltip: string) =>
      new Gtk.ToggleButton({
        child: new Gtk.Label({ label, useMarkup: true }),
        tooltip_text: tooltip,
        cssClasses: ["flat", "style-toggle"],
        canFocus: false,
      });

    this.boldButton = toggler("<b>B</b>", "Bold");
    this.italicButton = toggler("<i>I</i>", "Italic");
    this.underlineButton = toggler("<u>U</u>", "Underline");

    this.fontSizePicker = this.buildFontSizePicker();

    this.content = widget.box.h({
      spacing: 6,
      marginTop: 6,
      marginBottom: 6,
      marginStart: 6,
      marginEnd: 0,
      children: [
        this.boldButton,
        this.italicButton,
        this.underlineButton,
        this.fontSizePicker,
        this.buildStylePresetPicker(),
      ],
      visible: false,
    });

    this.dropDownClicker = new Gtk.Image({
      iconName: icon.symbolic("pan-down"),
    });
    this.dropDownClickerBox = widget.box.h({
      hexpand: true,
      hAlign: "END",
      marginEnd: 12,
      children: [this.dropDownClicker],
    });

    click.handle("left", this.dropDownClicker, () => this.toggleExpanded());

    this.append(this.content);
    this.append(this.dropDownClickerBox);

    this.registerActionHandlers();
  }

  public expand() {
    if (this.expanded) return;
    this.remove(this.dropDownClickerBox);
    this.content.append(this.dropDownClickerBox);
    this.dropDownClicker.set_from_icon_name(icon.symbolic("pan-up"));
    this.content.visible = true;
    this.expanded = true;
  }

  public collapse() {
    if (!this.expanded) return;
    this.content.remove(this.dropDownClickerBox);
    this.append(this.dropDownClickerBox);
    this.dropDownClicker.set_from_icon_name(icon.symbolic("pan-down"));
    this.content.visible = false;
    this.expanded = false;
  }

  public setExpanded(expanded: boolean) {
    if (expanded) this.expand();
    else this.collapse();
  }

  private toggleExpanded() {
    if (this.expanded) this.collapse();
    else this.expand();
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
      const item = listItem.get_item() as Gtk.StringObject;
      const text = item.get_string();
      if (!label) return;

      label.set_attributes(null);
      label.set_markup(text);

      const attrs = new Pango.AttrList();

      // The text for the drop down item is a number represeting the text size,
      // so we can use that to style the
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
      const item = listItem.get_item() as Gtk.StringObject;
      const text = item.get_string();
      if (!label) return;

      label.set_attributes(null);
      label.set_markup(text);

      const presetName = text as keyof typeof StyleManager.StylePresets;
      const { bold, italic, size, underline } =
        StyleManager.StylePresets[presetName];

      const attrs = new Pango.AttrList();
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

  private registerActionHandlers() {
    action.handle(
      this.actionMap,
      StyleManager.Actions.SetTextSize,
      "int",
      (size) =>
        this.fontSizePicker.set_selected(
          this.findIndexInModel(this.fontSizePicker.model, size.toString())
        )
    );
    action.handle(
      this.actionMap,
      StyleManager.Actions.SetBoldEnabled,
      "bool",
      (active) =>
        this.boldButton.active !== active && this.boldButton.set_active(active)
    );

    action.handle(
      this.actionMap,
      StyleManager.Actions.SetItalicEnabled,
      "bool",
      (active) =>
        this.italicButton.active !== active &&
        this.italicButton.set_active(active)
    );

    action.handle(
      this.actionMap,
      StyleManager.Actions.SetUnderlineEnabled,
      "bool",
      (active) =>
        this.underlineButton.active !== active &&
        this.underlineButton.set_active(active)
    );
    this.boldButton.connect("toggled", () =>
      this.styleManager.toggleDecoration("bold")
    );
    this.italicButton.connect("toggled", () =>
      this.styleManager.toggleDecoration("italic")
    );
    this.underlineButton.connect("toggled", () =>
      this.styleManager.toggleDecoration("underline")
    );
  }

  private findIndexInModel(model: Gio.ListModel, target: string) {
    for (let i = 0; i < model.get_n_items(); i++) {
      if ((model.get_item(i) as Gtk.StringObject)?.get_string() === target)
        return i;
    }
    return -1;
  }
}
