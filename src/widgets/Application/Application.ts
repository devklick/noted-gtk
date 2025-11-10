import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gio from "@girs/gio-2.0";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import Gst from "@girs/gst-1.0";
import { exit } from "@girs/gjs/system";

import Window from "../Window";

import styles from "../../styles.css?inline";
import AppDataDir from "../../core/fs/AppDataDir";
import BurgerMenu from "../Content/ContentHeader/BurgerMenu";
import ShortcutManager from "../../core/ShortcutManager";
import PreferencesManager, { AppPrefs } from "../../core/PreferencesManager";
import action from "../../core/utils/action";
import GLib from "@girs/glib-2.0";

const APPLICATION_ID = "io.github.devklick.noted";

interface ApplicationParams {
  isDev: boolean;
}

export default class Application extends Adw.Application {
  public readonly name = "Noted";

  static {
    Adw.init();
    Gst.init(null);
    GObject.registerClass({ GTypeName: "Application" }, this);
  }

  private _window: Window | null = null;
  private get window(): Window {
    if (!this._window) {
      this._window = new Window({
        notesDir: this.appDir.notesDir,
        appName: this.name,
        shortcuts: this.shortcutManager,
        prefs: this.appPrefs,
      });
      this._window.set_application(this);
    }
    return this._window;
  }

  private _appSettings: Gio.Settings | null = null;
  private get appSettings() {
    this._appSettings ??= new Gio.Settings({
      schemaId: `${this.id}.settings`,
    });
    return this._appSettings;
  }

  private _appPrefs: AppPrefs | null = null;
  private get appPrefs() {
    this._appPrefs ??= new PreferencesManager({ settings: this.appSettings });
    return this._appPrefs;
  }

  private _appDir: AppDataDir | null = null;
  public get appDir(): AppDataDir {
    this._appDir ??= new AppDataDir({ appName: this.name });
    return this._appDir;
  }

  private _shortcutManager: ShortcutManager | null = null;
  public get shortcutManager(): ShortcutManager {
    this._shortcutManager ??= new ShortcutManager({
      settings: this.appSettings,
    });
    return this._shortcutManager;
  }

  public get id() {
    return APPLICATION_ID;
  }

  constructor(params: ApplicationParams) {
    super({
      applicationId: APPLICATION_ID,
      flags: Gio.ApplicationFlags.FLAGS_NONE,
    });
    this.version = this.getVersion(params.isDev);
    this.defineActions();
  }

  static run(params: ApplicationParams, ...args: Array<string>): number {
    return new Application(params).run(args);
  }

  override vfunc_activate(): void {
    super.vfunc_activate();
    this.initStyles();
    this.window.present();
    this.window.connect("close-request", () => this.quit());
  }

  private initStyles(): void {
    const cssProvider = new Gtk.CssProvider();
    cssProvider.load_from_string(styles);

    const display = Gdk.Display.get_default();

    if (!display) {
      return exit(1);
    }

    Gtk.StyleContext.add_provider_for_display(
      display,
      cssProvider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
  }

  private defineActions() {
    const preferencesActions = new Gio.SimpleAction({
      name: BurgerMenu.Actions.Preferences,
    });

    preferencesActions.connect("activate", () => {
      this.window.presentPreferencesDialog();
    });

    const aboutActions = new Gio.SimpleAction({
      name: BurgerMenu.Actions.About,
    });
    aboutActions.connect("activate", () => {
      this.window.presentAboutDialog();
    });

    action.create(this, BurgerMenu.Actions.Open["Notes Folder"]);
    action.handle(this, BurgerMenu.Actions.Open["Notes Folder"], null, () => {
      Gio.AppInfo.launch_default_for_uri(this.appDir.notesDir.uri, null);
    });

    action.create(this, BurgerMenu.Actions.Open["Notes Meta File"]);
    action.handle(
      this,
      BurgerMenu.Actions.Open["Notes Meta File"],
      null,
      () => {
        Gio.AppInfo.launch_default_for_uri(
          this.appDir.notesDir.metaFile.uri,
          null
        );
      }
    );

    this.add_action(preferencesActions);
    this.add_action(aboutActions);
  }

  override quit() {
    this.appPrefs.dispose();
    super.quit();
  }

  private getVersion(isDev: boolean) {
    // When running in prod (under flatpak), the imports.package.version is set.
    // This gets set at build time in meson.build, then is
    if (!isDev) return imports.package.version;

    // When running in dev, grab the version from package.json.
    // dev is run by executing `gjs -m dist/main.js`.
    // package.json is not copied to dist, so we need to go up one level to reach package.json

    // import.meta.url is e.g. file:///home/user/repos/devklick/noted-gtk/dist/main.js
    // We need to convert this to an absolute system path, e.g. /home/user/repos/devklick/noted-gtk/dist/main.js
    const currentFile = import.meta.url.replace("file://", "");

    // Go one level up to reach package.json and get it's absolute path
    const currentDir = GLib.path_get_dirname(currentFile);
    const pkgPath = GLib.build_filenamev([currentDir, "..", "package.json"]);

    try {
      const file = Gio.File.new_for_path(pkgPath);
      const [ok, bytes] = file.load_contents(null);
      const text = new TextDecoder().decode(bytes);
      const pkg = JSON.parse(text);
      return `${pkg.version}-local`;
    } catch (e) {
      logError(e);
      return "local";
    }
  }
}
