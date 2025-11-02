import Gio from "@girs/gio-2.0";
import fs from "../utils/fs";

// TODO: Considering monitoring the metda file for changes.
// Not sure if it's really worth it, since it's not expected for users to be altering this file.
// It should be quite cheap to do, but will involve more actions being fired and handled, so adds complexity

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
  public readonly gioFile: Gio.File;
  private readonly _decoder: TextDecoder;
  private readonly _encoder: TextEncoder;

  constructor({ dirPath }: NotesMetaFileParams) {
    this._path = fs.path.build(dirPath, this._fileName);
    this.gioFile = Gio.File.new_for_path(this._path);
    this._decoder = new TextDecoder("utf-8");
    this._encoder = new TextEncoder();
    this.ensureExists();
  }

  public get uri(): string {
    return this.gioFile.get_uri();
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
    const [success, contents] = this.gioFile.load_contents(null);
    if (!success) {
      throw new Error("Failed to read notes metadata file");
    }

    const text = this._decoder.decode(contents);
    const data = JSON.parse(text);

    if (!this.isValidNotesMetadata(data)) {
      console.log(JSON.stringify(data, null, 2));
      throw new Error("Failed to parse notes metadata file");
    }

    return data;
  }

  public getNoteMetadata(id: string): NoteMetadata {
    return this.getNotesMetadata()[id];
  }

  public open() {
    const folder = Gio.File.new_for_path(this._path);
    Gio.AppInfo.launch_default_for_uri(folder.get_uri(), null);
  }

  private isValidNotesMetadata(data: unknown): data is NotesMetadata {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return false;
    }

    let patched = false;

    const ensureProp = (obj: any, name: string, defaultValue: unknown) => {
      if (typeof obj[name] === "undefined") {
        obj[name] = defaultValue;
        patched = true;
      }
      if (typeof obj[name] !== typeof defaultValue) {
        console.log("failed type check", typeof obj[name], typeof defaultValue);
        return false;
      }
      return true;
    };

    for (const [key, value] of Object.entries(data)) {
      if (typeof key !== "string") {
        return false;
      }
      if (typeof value !== "object" || value === null) {
        return false;
      }
      // The only property that is required and we
      // cannot patch if missing is the path
      if (typeof value.path !== "string") {
        return false;
      }

      // The following properties are all required,
      // but we can patch with suitable default values if missing
      if (!ensureProp(value, "name", "Unnamed Note")) {
        return false;
      }
      if (!ensureProp(value, "starred", false)) {
        return false;
      }
      if (!ensureProp(value, "locked", false)) {
        return false;
      }
      if (!ensureProp(value, "hidden", false)) {
        return false;
      }
    }

    // Update the file if we had to patch missing data
    if (patched) {
      this.save(data as NotesMetadata);
    }

    return true;
  }

  private save(data: NotesMetadata) {
    const bytes = this.getBytes(data);
    this.gioFile.replace_contents(
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
    if (!this.gioFile.query_exists(null)) {
      const content = this.getBytes({});
      this.gioFile.replace_contents(
        content,
        null,
        false,
        Gio.FileCreateFlags.NONE,
        null
      );
    }
  }
}
