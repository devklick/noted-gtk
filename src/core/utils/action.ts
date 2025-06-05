import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

const VariantTypes = {
  string: GLib.VariantType.new("s"),
  int: GLib.VariantType.new("i"),
  bool: GLib.VariantType.new("b"),
  double: GLib.VariantType.new("d"),
  object: GLib.VariantType.new("o"),
} as const;

type VType = keyof typeof VariantTypes;

export function createAction(actionMap: Gio.ActionMap, name: string): void;
export function createAction(
  actionMap: Gio.ActionMap,
  name: string,
  paramType?: VType | GLib.VariantType
): void;
export function createAction(
  actionMap: Gio.ActionMap,
  name: string,
  paramType: VType | GLib.VariantType | null,
  handler: null | (() => void)
): void;

export function createAction(
  actionMap: Gio.ActionMap,
  name: string,
  paramType?: VType | GLib.VariantType | null,
  handler?: null | (() => void)
) {
  if (actionMap.lookup_action(name)) {
    return;
  }

  const actionParams: ConstructorParameters<typeof Gio.SimpleAction>[0] = {
    name,
  };

  if (paramType) {
    if (paramType instanceof GLib.VariantType) {
      actionParams.parameterType = paramType;
    } else {
      actionParams.parameterType = VariantTypes[paramType];
    }
  }
  const action = new Gio.SimpleAction(actionParams);

  actionMap.add_action(action);

  if (handler) {
    const parser = paramType
      ? VariantParser.fromVariantType(
          paramType instanceof GLib.VariantType
            ? paramType
            : VariantTypes[paramType]
        )
      : VariantParser.None;

    handleAction(actionMap, name, parser, handler);
  }
}

export const VariantParser = {
  String(param: GLib.Variant | null): string {
    const s = param?.get_string();
    const v = s?.[0];
    if (v === undefined) throw new Error("Parameter not found");
    return v;
  },
  Bool(param: GLib.Variant | null): boolean {
    const v = param?.get_boolean();
    if (v === undefined) throw new Error("Parameter not found");
    return v;
  },
  None: () => null,
  fromVariantType(type: GLib.VariantType) {
    switch (type.dup_string()) {
      case "s":
        return this.String;
      default:
        throw new Error("Cannot determine VariantParser from VariantType");
    }
  },
} as const;

export function handleAction<T>(
  actionMap: Gio.ActionMap,
  actionName: string,
  paramParser: (param: GLib.Variant | null) => T,
  callback: (parsed: T) => void
): void {
  const action = actionMap.lookup_action(actionName);

  if (!action) {
    throw new Error(`Action '${actionName}' not found`);
  }

  if (!(action instanceof Gio.SimpleAction)) {
    throw new Error(`Action '${actionName}' is not a SimpleAction`);
  }

  action.connect("activate", (_action, param) => {
    try {
      const parsed = paramParser(param);
      callback(parsed);
    } catch (err) {
      logError(Object(err), `Failed to handle action '${actionName}'`);
    }
  });
}

export function invokeAction<P>(
  actionMap: Gio.ActionMap,
  name: string,
  param: P | GLib.Variant | null = null
) {
  const variant = getParamVariant(param);
  const action = actionMap.lookup_action(name);
  action?.activate(variant);
}

function getParamVariant<T>(param: T | null): null | GLib.Variant {
  if (param === null) return null;
  if (param instanceof GLib.Variant) return param;
  switch (typeof param) {
    case "string":
      return GLib.Variant.new_string(param);
    case "boolean":
      return GLib.Variant.new_boolean(param);
    default:
      throw new Error(`Cannot create GLib.Variant of type ${typeof param}`);
  }
}

export default {
  create: createAction,
  handle: handleAction,
  invoke: invokeAction,
  VariantParser,
};
