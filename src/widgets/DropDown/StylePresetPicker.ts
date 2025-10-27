import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";
import StyleManager from "../../core/StyleManager";
import DropDown from "./DropDown";

interface StylePresetPickerParams {
  onChanged(option: keyof typeof StyleManager.StylePresets): void;
}
export class StylePresetPicker extends DropDown<
  typeof StyleManager.StylePresets
> {
  static {
    GObject.registerClass({ GTypeName: "StylePresetPicker" }, this);
  }
  constructor({ onChanged }: StylePresetPickerParams) {
    super({
      options: StyleManager.StylePresets,
      getAttributes: (option) => {
        const { bold, italic, size, underline } =
          StyleManager.StylePresets[option];

        const attrs = new Pango.AttrList();
        attrs.insert(Pango.attr_size_new(size * Pango.SCALE));
        if (bold) attrs.insert(Pango.attr_weight_new(Pango.Weight.BOLD));
        if (italic) attrs.insert(Pango.attr_style_new(Pango.Style.ITALIC));
        if (underline)
          attrs.insert(Pango.attr_underline_new(Pango.Underline.SINGLE));
        return attrs;
      },
      onChanged,
    });
  }
}
