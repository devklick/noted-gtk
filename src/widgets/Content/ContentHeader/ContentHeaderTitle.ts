import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";
import widget from "../../../core/utils/widget";

interface ContentHeaderTitleParams {
  title?: string;
  dirty?: boolean;
}

export default class ContentHeaderTitle extends Gtk.Box {
  static {
    GObject.registerClass({ GTypeName: "ContentHeaderTitle" }, this);
  }

  private _title: string | null;
  private _dirty: boolean;

  constructor({ dirty, title }: ContentHeaderTitleParams = {}) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 4,
    });
    this._title = title ?? null;
    this._dirty = dirty ?? false;
  }

  setDirty(dirty: boolean) {
    this._dirty = dirty;
    this.update();
  }

  clearTitle() {
    this.setTitle(null);
  }

  setTitle(title: string | null) {
    this._title = title;
    this.update();
  }

  private update() {
    widget.box.removeAllChildren(this);

    if (this._dirty) {
      this.append(widget.label.new("•"));
    }
    this.append(widget.label.new(this._title, { ellipse: "END" }));
  }
}
