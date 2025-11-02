import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";

import StyleManager from "../../core/StyleManager";
import DropDown from "./DropDown";
import obj from "../../core/utils/obj";

interface FontSizePickerParams {
  onChanged(option: keyof typeof StyleManager.TextSizes): void;
}
export class FontSizePicker extends DropDown<
  keyof typeof StyleManager.TextSizes
> {
  static {
    GObject.registerClass({ GTypeName: "FontSizePicker" }, this);
  }
  constructor({ onChanged }: FontSizePickerParams) {
    super({
      items: obj.keys(StyleManager.TextSizes),
      onChanged,
    });
  }

  protected getAttributes(
    option: keyof typeof StyleManager.TextSizes
  ): Pango.AttrList {
    const attrs = new Pango.AttrList();
    attrs.insert(Pango.attr_size_new(option * Pango.SCALE));
    return attrs;
  }
}
