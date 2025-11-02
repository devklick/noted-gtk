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
