import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import NotesDir from "./NotesDir";

interface AppDirParams {
  appName: string;
}

/**
 * Object representing the local config folder for the Noted application.
 *
 * @example ~/.config/Noted
 */
export default class AppDir {
  /**
   * The notes directory is a subdirectory of the app directory.
   * This is where the notes are stored.
   */
  public readonly notesDir: Readonly<NotesDir>;

  private _appDir: Gio.File;

  constructor({ appName }: AppDirParams) {
    const path = GLib.build_filenamev([GLib.get_user_config_dir(), appName]);
    this._appDir = Gio.File.new_for_path(path);
    GLib.mkdir_with_parents(path, 0o755);
    this.notesDir = new NotesDir({ appDirPath: path });
  }
}
