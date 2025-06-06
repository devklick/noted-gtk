import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

export function buildPath(...parts: string[]): string {
  return GLib.build_filenamev(parts);
}

const path = {
  build: buildPath,
};

type FileAttribute = "created" | "modified";
type FileAttributeType = "time";

const attrTypes = {
  created: "time",
  modified: "time",
} satisfies Record<FileAttribute, FileAttributeType>;

function getAttrType(type: FileAttribute): string {
  return `${attrTypes[type]}::${type}`;
}

function getFileDateAttribute(info: Gio.FileInfo, type: FileAttribute): Date {
  return new Date(info.get_attribute_uint64(getAttrType(type)) * 1000);
}

function queryInfo(
  file: Gio.File,
  ...types: Array<FileAttribute>
): Gio.FileInfo {
  const queryString = types.map(getAttrType).join(",");
  return file.query_info(queryString, Gio.FileQueryInfoFlags.NONE, null);
}

const file = {
  getDateAttr: getFileDateAttribute,
  queryInfo,
};

export default {
  path,
  file,
};
