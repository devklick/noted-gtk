import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";

import icon from "../../../core/utils/icon";
import action from "../../../core/utils/action";
import { AppPrefs } from "../../../core/PreferencesManager";

export type NoteCategory =
  (typeof NoteCategories.Category)[keyof typeof NoteCategories.Category];

interface NoteCategoriesParams {
  prefs: AppPrefs;
}

export default class NoteCategories extends Gtk.Box {
  public static Category = {
    All: "all",
    Favourite: "favourite",
    Locked: "locked",
    Hidden: "hidden",
  } as const;

  public static Signals = action.signal.many({
    CategoryClicked: {
      name: "category-clicked",
      params: ["TYPE_STRING"],
    },
  });

  static {
    GObject.registerClass(
      {
        GTypeName: "NoteCategories",
        Signals: {
          [this.Signals.CategoryClicked.name]: {
            param_types: this.Signals.CategoryClicked.params,
          },
        },
      },
      this
    );
  }

  private buttons: Record<NoteCategory, Gtk.ToggleButton> = this.buildButtons();

  constructor({ prefs }: NoteCategoriesParams) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      homogeneous: true,
      marginStart: 6,
      marginEnd: 6,
      marginTop: 6,
      marginBottom: 6,
      cssClasses: ["linked"],
    });

    Object.values(this.buttons).forEach((button) => this.append(button));

    this.toggleButtonActive("all", true);

    prefs.onChanged("enable-categories", (enabled) => {
      this.set_visible(enabled);
    });
  }

  private buildButtons(): Record<NoteCategory, Gtk.ToggleButton> {
    const buttons: Partial<Record<NoteCategory, Gtk.ToggleButton>> = {};

    const iconMap: Record<NoteCategory, string> = {
      all: icon.symbolic("view-list"),
      locked: icon.symbolic("system-lock-screen"),
      favourite: icon.symbolic("starred"),
      hidden: icon.symbolic("view-conceal"),
    };

    Object.entries(NoteCategories.Category).forEach(([label, category]) => {
      const button = new Gtk.ToggleButton({
        iconName: iconMap[category],
        tooltipText: label,
        cssClasses: ["flat"],
      });

      button.connect("clicked", () => this.buttonClicked(category));

      buttons[category] = button;
    });

    return buttons as Record<NoteCategory, Gtk.ToggleButton>;
  }

  private buttonClicked(category: NoteCategory) {
    Object.keys(this.buttons).forEach((key) =>
      this.toggleButtonActive(key as NoteCategory, key === category)
    );
    this.emit(NoteCategories.Signals.CategoryClicked.name, category);
  }

  private toggleButtonActive(category: NoteCategory, active: boolean) {
    const button = this.buttons[category];
    button.set_active(active);
  }
}
