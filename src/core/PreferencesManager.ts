import Gio from "@girs/gio-2.0";

type TypeName = "boolean" | "int" | "string";

type GetterName = {
  [K in keyof Gio.Settings]: K extends `get_${infer S}`
    ? S extends TypeName
      ? K
      : never
    : never;
}[keyof Gio.Settings];

type SetterName = {
  [K in keyof Gio.Settings]: K extends `set_${infer S}`
    ? S extends TypeName
      ? K
      : never
    : never;
}[keyof Gio.Settings];

type Setters = { [K in SetterName]: InstanceType<typeof Gio.Settings>[K] };

// prettier-ignore
type ActualType<T extends TypeName> 
  = T extends "boolean" ? boolean
  : T extends "int" ? number
  : T extends "string" ? string
  : never;

const PreferenceKeys = {
  // Implement logic around auto-save setting
  AutoSave: "auto-save",
  EnableCategories: "enable-categories",
  EnableCategoryDecorations: "enable-category-decorations",
} as const;

export type PreferenceKey =
  (typeof PreferenceKeys)[keyof typeof PreferenceKeys];

export type BoolPreferenceKey = {
  [K in PreferenceKey]: (typeof preferenceMetadata)[K]["type"] extends "boolean"
    ? K
    : never;
}[PreferenceKey];

const preferenceMetadata = {
  "auto-save": {
    getter: "get_boolean",
    type: "boolean",
    setter: "set_boolean",
  },
  "enable-categories": {
    getter: "get_boolean",
    type: "boolean",
    setter: "set_boolean",
  },
  "enable-category-decorations": {
    getter: "get_boolean",
    type: "boolean",
    setter: "set_boolean",
  },
} as const satisfies Record<
  PreferenceKey,
  { getter: GetterName; setter: SetterName; type: TypeName }
>;

type OnChangeHandler<K extends PreferenceKey> = (
  value: ActualType<(typeof preferenceMetadata)[K]["type"]>
) => void;

export interface AppPrefs {
  readonly categoriesEnabled: boolean;
  setCategoriesEnabled(enabled: boolean): void;
  get<K extends PreferenceKey>(
    key: K
  ): ActualType<(typeof preferenceMetadata)[K]["type"]>;
  set<K extends PreferenceKey>(
    key: K,
    value: ActualType<(typeof preferenceMetadata)[K]["type"]>
  ): void;
  onChanged<K extends PreferenceKey>(key: K, handler: OnChangeHandler<K>): void;
  dispose(): void;
}

interface PreferencesManagerParams {
  settings: Gio.Settings;
}
/**
 * A class to manage non-shortcut preferences.
 *
 * To manage shortcuts, the `ShortcutManager` should be used instead.
 *
 * @todo Consider refactoring this. It was meant to be a generic wrapper
 * around `Gio.Settings` so that the caller doesnt need to worry about which
 * type-specific getters and setters to call based on the settings in question.
 * It works we'll, but at the cost of some initial metadata setup and complexity.
 */
export default class PreferencesManager implements AppPrefs {
  private settings: Gio.Settings;
  private signalIds: Array<number> = [];
  private changeHandlers: Partial<
    Record<PreferenceKey, Array<(value: any) => void>>
  > = {};

  public categoriesEnabled!: boolean;

  /**
   * An object containing the various setter functions from the Gio.Settings instance
   * that are used in this class.
   *
   * This is required because of how GJS is implemented - it's not possible to dynamically
   * call the setter functions by name (e.g. `Gio.Settings.prototype['set_boolean']`) without
   * first having bound it to the instance (e.g. `settings['set_boolean'].bind(settings)`).
   */
  private setters: Setters;

  constructor({ settings }: PreferencesManagerParams) {
    this.settings = settings;
    this.setters = this.buildSetters();
    this.loadPrefs();
    this.settings.connect("changed", () => this.loadPrefs());
    this.listen();
  }

  public dispose(): void {
    // Not sure if we need to do this manually. Leave out for now
    // for (const id of this.signalIds.splice(0)) {
    //   this.settings.disconnect(id);
    // }
  }

  public onChanged<K extends PreferenceKey>(
    key: K,
    handler: OnChangeHandler<K>
  ): void {
    this.changeHandlers[key] ??= [];
    this.changeHandlers[key].push(handler);
    handler(this.get(key));
  }

  public setCategoriesEnabled(enabled: boolean): void {
    this.settings.set_boolean("enable-categories", enabled);
  }

  private loadPrefs() {
    this.categoriesEnabled = this.settings.get_boolean("enable-categories");
    this.settings.get_boolean;
  }

  public get<K extends PreferenceKey>(
    key: K
  ): ActualType<(typeof preferenceMetadata)[K]["type"]> {
    return this.settings[preferenceMetadata[key].getter](key) as ActualType<
      (typeof preferenceMetadata)[K]["type"]
    >;
  }

  public set<K extends PreferenceKey>(
    key: K,
    value: ActualType<(typeof preferenceMetadata)[K]["type"]>
  ): void {
    const setterName = preferenceMetadata[key].setter;
    const setter = this.setters[setterName];
    // HACK: TS struggles to narrow the setters parameter types, so it becaomes `never`.
    setter(key, value as never);
  }

  private listen() {
    Object.values(PreferenceKeys).forEach((key) => {
      const id = this.settings.connect(`changed::${key}`, () =>
        this.changeHandlers[key]?.forEach((handler) => {
          handler(this.get(key));
        })
      );
      this.signalIds.push(id);
    });
  }

  private buildSetters(): Setters {
    return Object.values(preferenceMetadata).reduce(
      (obj, { setter }) =>
        ({
          ...obj,
          [setter]: this.settings[setter].bind(this.settings),
        } as const),
      {} as Setters
    );
  }
}
