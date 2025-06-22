import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Pango from "@girs/pango-1.0";

//#region ======================= Base =======================
type Color = "accent" | "success" | "warning" | "error";
type Align = keyof typeof Gtk.Align;
type Elipsize = keyof typeof Pango.EllipsizeMode;
type GtkWidgetParams = Partial<Gtk.Widget.ConstructorProps>;
type CustomWidgetParams = Partial<{
  margin: number;
  hAlign: Align;
  vAlign: Align;
  color: Color;
}>;
const _customWidgetParamKeys: Record<keyof CustomWidgetParams, 1> = {
  margin: 1,
  hAlign: 1,
  vAlign: 1,
  color: 1,
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
  if (params.color) {
    ensureClasses(params).cssClasses.push(params.color);
  }
  return omitKeys(params, CustomWidgetParamKeys);
}

function ensureClasses<T extends Partial<Gtk.Widget.ConstructorProps>>(
  params: T
): T & { cssClasses: string[] } {
  if (!params.cssClasses) params.cssClasses = [];
  return params as T & { cssClasses: string[] };
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
type CustomBoxParams = Partial<{
  children: Array<Gtk.Widget>;
  linked: boolean;
}>;
const _customBoxParamKeys: Record<keyof CustomBoxParams, 1> = {
  children: 1,
  linked: 1,
} as const;

const CustomBoxtParamKeys = Object.keys(_customBoxParamKeys) as Array<
  keyof typeof _customBoxParamKeys
>;

type BoxParams = GtkBoxParams & CustomWidgetParams & CustomBoxParams;

function applyCustomBoxParams(params: BoxParams): GtkBoxParams {
  applyCustomBaseParams(params);

  return omitKeys(params, [...CustomWidgetParamKeys, ...CustomBoxtParamKeys]);
}

export function createBox(params: BoxParams = {}): Gtk.Box {
  const box = new Gtk.Box({
    ...applyCustomBoxParams(params),
  });
  for (const child of params.children ?? []) {
    box.append(child);
  }
  if (params.linked) {
    box.add_css_class("linked");
  }
  return box;
}

export function vBox(params: BoxParams = {}): Gtk.Box {
  return createBox({ ...params, orientation: Gtk.Orientation.VERTICAL });
}

export function hBox(params: BoxParams = {}): Gtk.Box {
  return createBox({ ...params, orientation: Gtk.Orientation.HORIZONTAL });
}

function removeAllChildren(box: Gtk.Box) {
  let child = box.get_first_child();
  while (child) {
    const next = child.get_next_sibling();
    box.remove(child);
    child = next;
  }
}

function hasChild(box: Gtk.Box, child: Gtk.Widget): boolean {
  if (!box.get_first_child()) return false;

  for (
    let _child = box.get_first_child();
    _child !== null;
    _child = _child.get_next_sibling()
  ) {
    if (_child === child) {
      return true;
    }
  }
  return false;
}

function safeAppend(box: Gtk.Box, child: Gtk.Widget) {
  if (!hasChild(box, child)) {
    box.append(child);
  }
}
function safeRemove(box: Gtk.Box, child: Gtk.Widget) {
  if (hasChild(box, child)) {
    box.remove(child);
  }
}

export const box = {
  v: vBox,
  h: hBox,
  removeAllChildren,
  hasChild,
  safeAppend,
  safeRemove,
};

//#endregion

//#region ======================= Label =======================
type GtkLabelParams = GtkWidgetParams & Partial<Gtk.Label.ConstructorProps>;
type TypographyStyle =
  | "title-1"
  | "title-2"
  | "title-3"
  | "title-4"
  | "heading"
  | "body"
  | "caption"
  | "caption-heading"
  | "monospace"
  | "numeric";
type CustomLabelParams = Partial<{
  ellipse: Elipsize;
  typography: TypographyStyle;
}>;
const _customLabelParamKeys: Record<keyof CustomLabelParams, 1> = {
  ellipse: 1,
  typography: 1,
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
  if (params.typography) {
    ensureClasses(params).cssClasses.push(params.typography);
  }
  return omitKeys(params, [...CustomLabelParamKeys, ...CustomWidgetParamKeys]);
}

function createLabel(value: string | null = null, params: LabelParams = {}) {
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

//#region ======================= Button =======================
type GtkButtonParams = Partial<Gtk.Button.ConstructorProps>;
type ButtonShape = "normal" | "circular" | "pill";
type ButtonActionType = "suggested" | "destructive" | "normal";
type ButtonDepth = "flat" | "raised";
type CustomButtonParams = Partial<{
  shape: ButtonShape;
  actionType: ButtonActionType;
  depth: ButtonDepth;
  onClick(): void;
}>;
const _customButtonKeys: Record<keyof CustomButtonParams, 1> = {
  shape: 1,
  actionType: 1,
  depth: 1,
  onClick: 1,
} as const;

const CustomButtonKeys = Object.keys(_customButtonKeys) as Array<
  keyof typeof _customButtonKeys
>;

type ButtonParams = WidgetParams & GtkButtonParams & CustomButtonParams;

function applyCustomButtonParams(params: ButtonParams): GtkButtonParams {
  params = applyCustomBaseParams(params);
  params = ensureClasses(params);
  if (params.shape && params.shape !== "normal") {
    params.cssClasses?.push(params.shape);
  }
  if (params.actionType && params.actionType !== "normal") {
    params.cssClasses?.push(`${params.actionType}-action`);
  }
  if (params.depth) {
    params.cssClasses?.push(params.depth);
  }

  return omitKeys(params, [...CustomWidgetParamKeys, ...CustomButtonKeys]);
}

function createButton(params: ButtonParams = {}): Gtk.Button {
  const button = new Gtk.Button({
    ...applyCustomButtonParams(params),
  });

  if (params.onClick) {
    button.connect("clicked", () => params.onClick?.());
  }

  return button;
}

export const button = { new: createButton };
//#endregion

export default {
  box,
  label,
  toolbarView,
  header,
  button,
};
