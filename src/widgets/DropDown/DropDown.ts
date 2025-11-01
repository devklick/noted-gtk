import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Pango from "@girs/pango-1.0";
import { listModel } from "../../core/utils/widget";

interface DropDownParams<T extends string | number> {
  items: T[];
  onChanged(item: T): void;
  defaultItem?: T;
}

export default class DropDown<T extends string | number> extends Gtk.DropDown {
  static {
    GObject.registerClass({ GTypeName: "DropDown" }, this);
  }

  constructor({ items, onChanged, defaultItem }: DropDownParams<T>) {
    super();

    const model = Gtk.StringList.new(items.map(String));

    const styledFactory = Gtk.SignalListItemFactory.new();
    styledFactory.connect("setup", (_, li) => {
      const label = new Gtk.Label({ xalign: 0 });
      (li as Gtk.ListItem).set_child(label);
    });

    styledFactory.connect("bind", (_, li) => this.buildListItem(li));

    const plainFactory = Gtk.SignalListItemFactory.new();
    plainFactory.connect("setup", (_, li) => {
      const label = new Gtk.Label({ xalign: 0 });
      (li as Gtk.ListItem).set_child(label);
    });
    plainFactory.connect("bind", (_, li) => {
      const listItem = li as Gtk.ListItem;
      const label = listItem.get_child() as Gtk.Label;
      const item = listItem.get_item() as Gtk.StringObject;
      if (label && item) label.set_text(item.get_string());
    });

    this.set_model(model);
    this.set_factory(plainFactory);
    this.set_list_factory(styledFactory);

    this.connect("notify::selected", () => {
      const selected = this.get_selected_item() as Gtk.StringObject;
      if (!selected) return;
      const option = selected.get_string() as T;
      onChanged(option);
    });
    if (defaultItem) {
      this.set_selected(
        listModel.findIndex(this.model, defaultItem.toString())
      );
    }
  }

  protected getAttributes(option: T): Pango.AttrList {
    return Pango.AttrList.new();
  }

  private buildListItem(li: GObject.Object): void {
    const listItem = li as Gtk.ListItem;
    const label = listItem.get_child() as Gtk.Label;
    const item = listItem.get_item() as Gtk.StringObject;
    const text = item.get_string();

    const option = text as T;
    const attrs = this.getAttributes(option);

    label.set_attributes(attrs);
    label.set_text(text);
  }
}
