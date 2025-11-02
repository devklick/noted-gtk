import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";

import StyleManager, { StylePresetName } from "../../core/StyleManager";
import DropDown from "./DropDown";
import obj from "../../core/utils/obj";

interface StylePresetPickerParams {
  onChanged(option: StylePresetName): void;
}
export class StylePresetPicker extends DropDown<StylePresetName> {
  static {
    GObject.registerClass({ GTypeName: "StylePresetPicker" }, this);
  }
  constructor({ onChanged }: StylePresetPickerParams) {
    super({
      items: obj.keys({ ...StyleManager.StylePresets }),
      defaultItem: "normal",
      onChanged,
    });
  }

  protected getAttributes(option: StylePresetName): Pango.AttrList {
    const attrs = new Pango.AttrList();
    
    if (!StyleManager.StylePresets[option]) {
      return attrs;
    }

    const { bold, italic, size, underline } = StyleManager.StylePresets[option];

    attrs.insert(Pango.attr_size_new(size * Pango.SCALE));
    if (bold) attrs.insert(Pango.attr_weight_new(Pango.Weight.BOLD));
    if (italic) attrs.insert(Pango.attr_style_new(Pango.Style.ITALIC));
    if (underline)
      attrs.insert(Pango.attr_underline_new(Pango.Underline.SINGLE));
    return attrs;
  }
}
