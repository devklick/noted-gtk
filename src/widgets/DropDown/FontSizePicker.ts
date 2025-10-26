import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";
import StyleManager from "../../core/StyleManager";
import DropDown from "./DropDown";

export class FontSizePicker extends DropDown<typeof StyleManager.TextSizes> {
  static {
    GObject.registerClass({ GTypeName: "FontSizePicker" }, this);
  }
  constructor() {
    super({
      options: StyleManager.TextSizes,
      getAttributes: (option) => {
        const attrs = new Pango.AttrList();
        attrs.insert(Pango.attr_size_new(option * Pango.SCALE));
        return attrs;
      },
    });
  }
}
