import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Pango from "@girs/pango-1.0";

interface DropDownParams<T extends Record<string, unknown>> {
  options: T;
  getAttributes(option: keyof T): Pango.AttrList;
}

export default class DropDown<
  T extends Record<string, unknown>
> extends Gtk.DropDown {
  static {
    GObject.registerClass({ GTypeName: "DropDown" }, this);
  }

  constructor({ options, getAttributes }: DropDownParams<T>) {
    super();

    const model = Gtk.StringList.new(Object.keys(options));

    const styledFactory = Gtk.SignalListItemFactory.new();
    styledFactory.connect("setup", (_, li) => {
      const label = new Gtk.Label({ xalign: 0 });
      (li as Gtk.ListItem).set_child(label);
    });

    styledFactory.connect("bind", (_, li) => {
      const listItem = li as Gtk.ListItem;
      const label = listItem.get_child() as Gtk.Label;
      const item = listItem.get_item() as Gtk.StringObject;
      const text = item.get_string();

      const option = text as keyof T;
      const attrs = getAttributes(option);

      label.set_attributes(attrs);
      label.set_text(text);
    });

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
  }
}
