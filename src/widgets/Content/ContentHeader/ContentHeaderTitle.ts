import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";
import Pango from "@girs/pango-1.0";

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
    this.removeAllChildren();
    if (this._dirty) {
      this.append(new Gtk.Label({ label: "•" }));
    }
    this.append(
      new Gtk.Label({
        label: this._title ?? "",
        ellipsize: Pango.EllipsizeMode.END,
      })
    );
  }

  private removeAllChildren() {
    let child = this.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      this.remove(child);
      child = next;
    }
  }
}
