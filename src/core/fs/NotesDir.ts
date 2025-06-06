import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import NotesMetaFile from "./NotesMetaFile";
import fs from "../utils/fs";

/**
 * Object representing data relating to a note.
 *
 * This is an amalgamation of data from the meta file & data from the file system.
 */
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

/**
 * An object representing the directory where notes are stored.
 *
 * @example ~/.config/Noted/notes
 *
 * Also where the notes metadata file is stored.
 *
 * @example ~/.config/Noted/notes/notes.meta.json
 */
export default class NotesDir {
  /**
   * An object representing the file where note metadata is stored.
   */
  public readonly metaFile: Readonly<NotesMetaFile>;

  private readonly _path: string;
  private readonly _decoder: TextDecoder;
  private readonly _encoder: TextEncoder;

  constructor({ appDirPath }: NotesDirParams) {
    this._path = fs.path.build(appDirPath, "notes");
    GLib.mkdir_with_parents(this._path, 0o755);
    this.metaFile = new NotesMetaFile({ dirPath: this._path });
    this._decoder = new TextDecoder("utf8");
    this._encoder = new TextEncoder();
  }

  public list(): Record<string, NotesDirEntry> {
    return Object.entries(this.metaFile.getNotesMetadata()).reduce(
      (acc, [id, { path, name }]) => {
        const file = Gio.File.new_for_path(path);
        const info = fs.file.queryInfo(file, "created", "modified");

        // TODO: created time seems pretty flaky.
        // Consider storing this in meta file when a file note is added
        const createdOn = fs.file.getDateAttr(info, "created");
        const updatedOn = fs.file.getDateAttr(info, "modified");
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
    const file = this.getNoteFile(id);
    const [success, contents] = file.load_contents(null);
    if (!success) throw new Error("Unable to read note");
    return this._decoder.decode(contents);
  }

  public renameNote(id: string, name: string) {
    // The file name is the ID which doesnt change,
    // so we just rename the note in the meta file
    this.metaFile.renameNote(id, name);
  }

  public deleteNote(id: string) {
    const file = this.getNoteFile(id);
    file.delete(null);
    this.metaFile.deleteNote(id);
  }

  public newNote(): string {
    const id = GLib.uuid_string_random();
    const name = new Date().toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const path = fs.path.build(this._path, id);
    this.metaFile.addNote(id, name, path);

    const file = Gio.file_new_for_path(path);
    file.create(Gio.FileCreateFlags.NONE, null);
    return id;
  }

  public loadNote(id: string): string {
    const meta = this.metaFile.getNoteMetadata(id);
    const file = Gio.File.new_for_path(meta.path);
    const [success, contents] = file.load_contents(null);
    if (!success) throw new Error("Failed to load file");
    return this._decoder.decode(contents);
  }

  public updateNote(id: string, contents: string) {
    const meta = this.metaFile.getNoteMetadata(id);
    const file = Gio.File.new_for_path(meta.path);
    let encoded = this._encoder.encode(contents);

    // Hacky workaround: Gio treats an empty Uint8Array (e.g. empty string) as null
    // and throws an error at runtime
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

  private getNoteFile(noteId: string): Gio.File {
    return Gio.File.new_for_path(this.getNotePath(noteId));
  }

  private getNotePath(noteId: string) {
    return fs.path.build(this._path, noteId);
  }
}
