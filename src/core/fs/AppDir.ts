import Gio from "@girs/gio-2.0";
import NotesDir from "./NotesDir";
import GLib from "@girs/glib-2.0";

interface AppDirParams {
  appName: string;
}

export default class AppDir {
  public readonly notesDir: Readonly<NotesDir>;

  private _appDir: Gio.File;

  constructor({ appName }: AppDirParams) {
    const path = GLib.build_filenamev([GLib.get_user_config_dir(), appName]);
    this._appDir = Gio.File.new_for_path(path);
    GLib.mkdir_with_parents(path, 0o755);
    this.notesDir = new NotesDir({ appDirPath: path });
  }
}
