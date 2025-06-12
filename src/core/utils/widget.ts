import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Pango from "@girs/pango-1.0";

//#region ======================= Base =======================
type Align = keyof typeof Gtk.Align;
type Elipsize = keyof typeof Pango.EllipsizeMode;
type GtkWidgetParams = Partial<Gtk.Widget.ConstructorProps>;
type CustomWidgetParams = Partial<{
  margin: number;
  hAlign: Align;
  vAlign: Align;
}>;
const _customWidgetParamKeys: Record<keyof CustomWidgetParams, 1> = {
  margin: 1,
  hAlign: 1,
  vAlign: 1,
} as const;

const CustomWidgetParamKeys = Object.keys(_customWidgetParamKeys) as Array<
  keyof typeof _customWidgetParamKeys
>;

type WidgetParams = GtkWidgetParams & CustomWidgetParams;

function applyCustomBaseParams(params: WidgetParams): GtkWidgetParams {
  if (params.margin !== undefined) {
    params.marginTop = params.margin;
    params.marginBottom = params.margin;
    params.marginStart = params.margin;
    params.marginEnd = params.margin;
  }
  if (params.hAlign !== undefined) {
    params.halign = Gtk.Align[params.hAlign] as Gtk.Align;
  }
  if (params.vAlign !== undefined) {
    params.valign = Gtk.Align[params.vAlign] as Gtk.Align;
  }
  return omitKeys(params, CustomWidgetParamKeys);
}

function omitKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const clone = { ...obj };
  for (const key of keys) {
    delete clone[key];
  }
  return clone;
}
//#endregion

//#region ======================= Box =======================
type GtkBoxParams = GtkWidgetParams & Partial<Gtk.Box.ConstructorProps>;
type BoxParams = GtkBoxParams & CustomWidgetParams;

export function vBox(params: BoxParams = {}): Gtk.Box {
  return new Gtk.Box({
    ...applyCustomBaseParams(params),
    orientation: Gtk.Orientation.VERTICAL,
  });
}

export function hBox(params: BoxParams = {}): Gtk.Box {
  return new Gtk.Box({
    ...applyCustomBaseParams(params),
    orientation: Gtk.Orientation.HORIZONTAL,
  });
}

function removeAllChildren(box: Gtk.Box) {
  let child = box.get_first_child();
  while (child) {
    const next = child.get_next_sibling();
    box.remove(child);
    child = next;
  }
}

export const box = { v: vBox, h: hBox, removeAllChildren };

//#endregion

//#region ======================= Label =======================
type GtkLabelParams = GtkWidgetParams & Partial<Gtk.Label.ConstructorProps>;
type CustomLabelParams = Partial<{
  ellipse: Elipsize;
}>;
const _customLabelParamKeys: Record<keyof CustomLabelParams, 1> = {
  ellipse: 1,
} as const;

const CustomLabelParamKeys = Object.keys(_customLabelParamKeys) as Array<
  keyof typeof _customLabelParamKeys
>;

type LabelParams = WidgetParams & GtkLabelParams & CustomLabelParams;

function applyCustomLabelParams(params: LabelParams): GtkLabelParams {
  applyCustomBaseParams(params);
  if (params.ellipse !== undefined) {
    params.ellipsize = Pango.EllipsizeMode[
      params.ellipse
    ] as Pango.EllipsizeMode;
  }
  return omitKeys(params, [...CustomLabelParamKeys, ...CustomWidgetParamKeys]);
}

function createLabel(value: string | null, params: LabelParams = {}) {
  return new Gtk.Label({
    ...applyCustomLabelParams(params),
    label: value ?? "",
  });
}

export const label = { new: createLabel };
//#endregion

//#region ======================= ToolbarView =======================
type AdwToolbarViewParams = Partial<Adw.ToolbarView.ConstructorProps>;
type CustomToolbarViewParams = Partial<{
  topBar: Gtk.Widget;
}>;
const _customToolbarViewKeys: Record<keyof CustomToolbarViewParams, 1> = {
  topBar: 1,
} as const;

const CustomToolbarViewKeys = Object.keys(_customToolbarViewKeys) as Array<
  keyof typeof _customToolbarViewKeys
>;

type ToolbarViewParams = WidgetParams &
  AdwToolbarViewParams &
  CustomToolbarViewParams;

function applyCustomToolbarViewParams(
  params: ToolbarViewParams
): AdwToolbarViewParams {
  applyCustomBaseParams(params);
  return omitKeys(params, [...CustomWidgetParamKeys, ...CustomToolbarViewKeys]);
}

function createToolbarView(params: ToolbarViewParams = {}): Adw.ToolbarView {
  const toolbar = new Adw.ToolbarView({
    ...applyCustomToolbarViewParams(params),
  });

  if (params.topBar) {
    toolbar.add_top_bar(params.topBar);
  }
  return toolbar;
}

export const toolbarView = { new: createToolbarView };
//#endregion

//#region ======================= HeaderBar =======================
type AdwHeaderBarParams = Partial<Adw.HeaderBar.ConstructorProps>;
type CustomHeaderBarParams = Partial<{
  start: Gtk.Widget;
  end: Gtk.Widget;
  title: Gtk.Widget | string;
}>;
const _customHeaderBarKeys: Record<keyof CustomHeaderBarParams, 1> = {
  start: 1,
  end: 1,
  title: 1,
} as const;

const CustomHeaderBarParams = Object.keys(_customHeaderBarKeys) as Array<
  keyof typeof _customHeaderBarKeys
>;

type HeaderBarParams = WidgetParams &
  AdwHeaderBarParams &
  CustomHeaderBarParams;

function applyCustomHeaderBarParams(
  params: HeaderBarParams
): AdwHeaderBarParams {
  applyCustomBaseParams(params);
  return omitKeys(params, [...CustomWidgetParamKeys, ...CustomHeaderBarParams]);
}

function createHeaderBar(params: HeaderBarParams = {}): Adw.HeaderBar {
  const header = new Adw.HeaderBar({
    ...applyCustomHeaderBarParams(params),
  });

  if (params.start) {
    header.pack_start(params.start);
  }
  if (params.end) {
    header.pack_end(params.end);
  }
  if (params.title) {
    const title =
      params.title instanceof Gtk.Widget
        ? params.title
        : label.new(params.title);

    header.set_title_widget(title);
  }
  return header;
}

export const header = { new: createHeaderBar };
//#endregion

export default {
  box,
  label,
  toolbarView,
  header,
};
