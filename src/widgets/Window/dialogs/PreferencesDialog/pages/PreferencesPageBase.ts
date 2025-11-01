import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import {
  AppPrefs,
  BoolPreferenceKey,
} from "../../../../../core/PreferencesManager";
import Gio from "@girs/gio-2.0";
import widget, { listModel } from "../../../../../core/utils/widget";

interface PreferencesPageBaseParams {
  title: string;
  iconName: string;
  parent: Gtk.Window;
  prefs: AppPrefs;
}
export default class PreferencesPageBase extends Adw.PreferencesPage {
  static {
    GObject.registerClass({ GTypeName: "PreferencesPageBase" }, this);
  }
  protected parentWindow: Gtk.Window;
  protected prefs: AppPrefs;

  constructor({
    iconName,
    title,
    parent: parentWindow,
    prefs,
  }: PreferencesPageBaseParams) {
    super({ title, iconName });
    this.parentWindow = parentWindow;
    this.prefs = prefs;
  }

  protected createToggleGroup(
    title: string,
    description: string | string[],
    prefsKey: BoolPreferenceKey
  ): [group: Adw.PreferencesGroup, toggle: Gtk.Switch] {
    const group = new Adw.PreferencesGroup({
      title,
      description:
        typeof description === "string"
          ? description
          : description.join("\n\n"),
    });

    const toggle = this.createToggle(prefsKey);

    group.set_header_suffix(toggle);

    return [group, toggle] as const;
  }

  protected createToggleRow(
    title: string,
    description: string,
    prefsKey: BoolPreferenceKey
  ) {
    const row = new Adw.ActionRow({
      title,
      subtitle: description,
    });
    const toggle = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this.prefs.get(prefsKey),
    });
    toggle.connect("notify::active", () => {
      this.prefs.set(prefsKey, toggle.active);
    });
    row.add_suffix(toggle);
    return [row, toggle] as const;
  }

  protected createAppPickerRow(
    title: string,
    description: string,
    contentType: string,
    current: string,
    onChanged: (app: Gio.AppInfo) => void
  ) {
    // TODO: Not a fan of this approach, but it's fine for now.
    // Build a custom app choser button which launches a custom app choser dialog
    // See notes onAppChooserDialog.
    const row = new Adw.ActionRow({
      title,
      subtitle: description,
    });

    const apps = Gio.AppInfo.get_all_for_type(contentType);
    const currentIndex = apps.findIndex((app) => app.get_id() === current);
    const store = new Gio.ListStore({ item_type: Gio.AppInfo.$gtype });

    for (const app of apps) {
      store.append(app);
    }

    const factory = new Gtk.SignalListItemFactory();
    factory.connect("setup", (_, li) => {
      const listItem = li as Gtk.ListItem;
      listItem.set_child(new Gtk.Label({ xalign: 0 }));
    });

    factory.connect("bind", (_, li) => {
      const listItem = li as Gtk.ListItem;
      const app = listItem.get_item() as Gio.AppInfo;
      (listItem.child as Gtk.Label).set_text(app.get_display_name());
    });

    const picker = new Gtk.DropDown({
      model: store,
      factory,
    });

    picker.connect("notify::selected", () => {
      const app = picker.get_selected_item() as Gio.AppInfo;
      app && onChanged(app);
    });

    if (currentIndex > 0) {
      picker.set_selected(currentIndex);
    }

    const suffix = widget.box.h({
      vexpand: false,
      vAlign: "CENTER",
      children: [picker],
    });
    row.add_suffix(suffix);
    
    return [row, picker] as const;
  }

  private createToggle(prefsKey: BoolPreferenceKey) {
    const toggle = new Gtk.Switch({
      valign: Gtk.Align.CENTER,
      active: this.prefs.get(prefsKey),
    });

    toggle.connect("notify::active", () => {
      this.prefs.set(prefsKey, toggle.active);
    });

    return toggle;
  }
}
