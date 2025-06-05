import Gtk from "@girs/gtk-4.0";

type WidgetBase = Gtk.Widget & {
  add_controller(controller: Gtk.EventController): void;
};

const ClickType = {
  left: 1,
  middle: 2,
  right: 3,
} as const;

type GestureType = keyof typeof ClickType;

type ClickHandler = (params: {
  source: Gtk.GestureClick;
  nPress: number;
  x: number;
  y: number;
}) => void;

export function handleClick<G extends WidgetBase>(
  type: GestureType,
  widget: G,
  handler: ClickHandler
): Gtk.GestureClick {
  const gesture = new Gtk.GestureClick({ button: ClickType[type] });
  gesture.connect("pressed", (source, nPress, x, y) =>
    handler({ source, nPress, x, y })
  );
  widget.add_controller(gesture);
  return gesture;
}

export default {
  handle: handleClick,
};
