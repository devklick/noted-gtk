import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";
import meta from "./NotesMetaFile";

interface NotesDirEntry {
  id: string;
  name: string;
  path: string;
  createdOn: Date;
  updatedOn: Date;
}

interface NotesDirParams {
  appDirPath: string;
}

export default class NotesDir {
  public metaFile: meta;
  private _path: string;
  private readonly _decoder: TextDecoder;
  private readonly _encoder: TextEncoder;

  constructor({ appDirPath }: NotesDirParams) {
    this._path = GLib.build_filenamev([appDirPath, "notes"]);
    GLib.mkdir_with_parents(this._path, 0o755);
    this.metaFile = new meta({ dirPath: this._path });
    this._decoder = new TextDecoder("utf8");
    this._encoder = new TextEncoder();
  }

  public list(): Record<string, NotesDirEntry> {
    return Object.entries(this.metaFile.getNotesMetadata()).reduce(
      (acc, [id, { path, name }]) => {
        const file = Gio.File.new_for_path(path);
        const info = file.query_info(
          "time::modified,time::created",
          Gio.FileQueryInfoFlags.NONE,
          null
        );
        const createdOn = new Date(
          info.get_attribute_uint64("time::created") * 1000
        );
        const updatedOn = new Date(
          info.get_attribute_uint64("time::modified") * 1000
        );
        acc[id] = {
          createdOn,
          id,
          name,
          path,
          updatedOn,
        };
        return acc;
      },
      {} as Record<string, NotesDirEntry>
    );
  }

  public getNoteContents(id: string): string {
    const path = GLib.build_filenamev([this._path, id]);
    const file = Gio.file_new_for_path(path);
    const [success, contents] = file.load_contents(null);
    if (!success) throw new Error("Unable to read note");
    return this._decoder.decode(contents);
  }

  public renameNote(id: string, name: string) {
    this.metaFile.renameNote(id, name);
  }

  public deleteNote(id: string) {
    const path = GLib.build_filenamev([this._path, id]);
    const file = Gio.file_new_for_path(path);
    file.delete(null);
    this.metaFile.deleteNote(id);
  }

  public newNote(): string {
    const id = GLib.uuid_string_random();
    const name = new Date().toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const path = GLib.build_filenamev([this._path, id]);
    this.metaFile.addNote(id, name, path);

    const file = Gio.file_new_for_path(path);
    file.create(Gio.FileCreateFlags.NONE, null);
    return id;
  }

  public loadNote(id: string): string {
    const meta = this.metaFile.getNotesMetadata()[id];
    const file = Gio.File.new_for_path(meta.path);
    const [success, contents] = file.load_contents(null);
    if (!success) throw new Error("Failed to load file");
    return this._decoder.decode(contents);
  }

  public updateNote(id: string, contents: string) {
    const meta = this.metaFile.getNotesMetadata()[id];
    const file = Gio.File.new_for_path(meta.path);
    let encoded = this._encoder.encode(contents);

    // Hacky workaround: Gio treats an empty Uint8Array (e.g. empty string) as null
    if (!encoded.length) {
      encoded = new Uint8Array([0]);
    }

    const [success, message] = file.replace_contents(
      encoded,
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null
    );
    if (!success) throw new Error(`Failed to update file: ${message}`);
  }
}
