import Gio from "@girs/gio-2.0";
import fs from "../utils/fs";

// TODO: Add favourite/starred to notes. Notes whch are starred are pinned at the top of the list
// TODO: Add ability to "lock" a note. Notes which are locked cannot be edited and require double-confirmation to delete

/**
 * An object representing an entry in the note metdata file
 */
export interface NoteMetadata {
  name: string;
  path: string;
  starred: boolean;
  locked: boolean;
  hidden: boolean;
}

/**
 * An object representing all of the entries stored in the note metdata file,
 * keyed by the note ID.
 */
export type NotesMetadata = Record<string, NoteMetadata>;

interface NotesMetaFileParams {
  dirPath: string;
}

/**
 * An object representing the notes metdata file,
 * encapsulation actions that can be performed against it.
 */
export default class NotesMetaFile {
  private readonly _fileName = "notes.meta.json";
  private readonly _path: string;
  private readonly _file: Gio.File;
  private readonly _decoder: TextDecoder;
  private readonly _encoder: TextEncoder;

  constructor({ dirPath }: NotesMetaFileParams) {
    this._path = fs.path.build(dirPath, this._fileName);
    this._file = Gio.File.new_for_path(this._path);
    this._decoder = new TextDecoder("utf-8");
    this._encoder = new TextEncoder();
    this.ensureExists();
  }

  public addNote(id: string, name: string, path: string) {
    const data = this.getNotesMetadata();
    data[id] = { name, path, locked: false, starred: false, hidden: false };
    this.save(data);
  }

  public deleteNote(id: string) {
    const data = this.getNotesMetadata();
    if (!data[id]) return;
    delete data[id];
    this.save(data);
  }

  public setName(id: string, name: string) {
    this.setProperty(id, "name", name);
  }

  public setHidden(id: string, hidden: boolean) {
    this.setProperty(id, "hidden", hidden);
  }

  public setStarred(id: string, starred: boolean) {
    this.setProperty(id, "starred", starred);
  }

  public setLocked(id: string, locked: boolean) {
    this.setProperty(id, "locked", locked);
  }

  public setProperty<K extends Exclude<keyof NoteMetadata, "path">>(
    id: string,
    key: K,
    value: NoteMetadata[K]
  ) {
    const data = this.getNotesMetadata();
    if (!data[id]) return;
    data[id][key] = value;
    this.save(data);
  }

  public getNotesMetadata(): NotesMetadata {
    const [success, contents] = this._file.load_contents(null);
    if (!success) {
      throw new Error("Failed to read notes metadata file");
    }

    const text = this._decoder.decode(contents);
    const data = JSON.parse(text);

    if (!this.isValidNotesMetadata(data)) {
      throw new Error("Failed to parse notes metadata file");
    }

    return data;
  }

  public getNoteMetadata(id: string): NoteMetadata {
    return this.getNotesMetadata()[id];
  }

  private isValidNotesMetadata(data: unknown): data is NotesMetadata {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return false;
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof key !== "string") return false;
      if (
        typeof value !== "object" ||
        value === null ||
        typeof value.name !== "string" ||
        typeof value.path !== "string" ||
        typeof value.starred !== "boolean" ||
        typeof value.locked !== "boolean" ||
        typeof value.hidden !== "boolean"
      ) {
        return false;
      }
    }

    return true;
  }

  private save(data: NotesMetadata) {
    const bytes = this.getBytes(data);
    this._file.replace_contents(
      bytes,
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null
    );
  }

  private getBytes(data: NotesMetadata) {
    const json = JSON.stringify(data, null, 2);
    const bytes = this._encoder.encode(json);
    return bytes;
  }

  private ensureExists() {
    if (!this._file.query_exists(null)) {
      const content = this.getBytes({});
      this._file.replace_contents(
        content,
        null,
        false,
        Gio.FileCreateFlags.NONE,
        null
      );
    }
  }
}
