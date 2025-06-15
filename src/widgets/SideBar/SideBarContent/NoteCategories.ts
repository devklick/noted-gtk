import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";

import icon from "../../../core/utils/icon";

export type NoteCategory =
  (typeof NoteCategories.Category)[keyof typeof NoteCategories.Category];

export default class NoteCategories extends Gtk.Box {
  public static Category = {
    All: "all",
    Favourite: "favourite",
    Archive: "archive",
  } as const;

  public static Signals = {
    CategoryClicked: {
      name: "category-clicked",
      params: [GObject.TYPE_STRING],
    },
  };
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

  constructor() {
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
  }

  private buildButtons(): Record<NoteCategory, Gtk.ToggleButton> {
    const buttons: Partial<Record<NoteCategory, Gtk.ToggleButton>> = {};

    const iconMap: Record<NoteCategory, string> = {
      all: icon.symbolic("view-list"),
      archive: icon.symbolic("system-lock-screen"),
      favourite: icon.symbolic("starred"),
    };

    Object.entries(NoteCategories.Category).forEach(([label, category]) => {
      const button = new Gtk.ToggleButton({
        iconName: iconMap[category],
        tooltipText: label,
      });

      button.connect("clicked", () => this.buttonClicked(category));

      buttons[category] = button;
    });

    return buttons as Record<NoteCategory, Gtk.ToggleButton>;
  }

  private buttonClicked(category: NoteCategory) {
    Object.entries(this.buttons).forEach(([key, button]) =>
      this.toggleButtonActive(key as NoteCategory, key === category)
    );
    this.emit(NoteCategories.Signals.CategoryClicked.name, category);
  }

  private toggleButtonActive(category: NoteCategory, active: boolean) {
    const button = this.buttons[category];
    const action = active ? "add" : "remove";
    button[`${action}_css_class`]("suggested-action");
    button.set_active(active);
  }
}
