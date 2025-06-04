import Gtk from "@girs/gtk-4.0";

export namespace Click {
  type WidgetBase = { add_controller(controller: Gtk.EventController): void };

  const ClickType = {
    left: 1,
    middle: 2,
    right: 3,
  } as const;

  type GestureType = keyof typeof ClickType;

  type GestureCallback = (params: {
    source: Gtk.GestureClick;
    nPress: number;
    x: number;
    y: number;
  }) => void;

  export function register<G extends WidgetBase>(
    widget: G,
    type: GestureType,
    callback: GestureCallback
  ): Gtk.GestureClick {
    const gesture = new Gtk.GestureClick({ button: ClickType[type] });
    gesture.connect("pressed", (source, nPress, x, y) =>
      callback({ source, nPress, x, y })
    );
    widget.add_controller(gesture);
    return gesture;
  }
}
