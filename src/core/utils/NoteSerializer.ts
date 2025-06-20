import Gtk from "@girs/gtk-4.0";

export default class NoteSerializer {
  public static serialize(buffer: Gtk.TextBuffer) {
    const start = buffer.get_start_iter();
    const end = buffer.get_end_iter();

    let result = "";

    let iter = start.copy();

    const activeTags = new Set<string>();

    while (iter.compare(end) < 0) {
      const next = iter.copy();
      next.forward_to_tag_toggle(null);

      const text = buffer.get_text(iter, next, true);
      const iterTags = iter.get_tags();
      let acts: Record<string, "open" | "close"> = {};

      // tags which have been opened on this iter
      for (const tag of iterTags) {
        if (!activeTags.has(tag.name)) {
          acts[tag.name] = "open";
          activeTags.add(tag.name);
        }
      }

      // tags which have been closed on this iter
      for (const tag of activeTags) {
        if (!iterTags.find((t) => t.name === tag)) {
          acts[tag] = "close";
          activeTags.delete(tag);
        }
      }

      let part = this.escapeText(text);

      for (const [tagName, act] of Object.entries(acts)) {
        const tag = `<${act === "open" ? "" : "/"}${tagName}>`;
        part = `${tag}${part}`;
      }

      result += part;
      iter = next;
    }

    for (const tagName of activeTags) {
      result += `</${tagName}>`;
    }
    return result;
  }

  public static deserialize(serialized: string, buffer: Gtk.TextBuffer) {
    const tagStack: string[] = [];
    const regex = /<(\/?)([-\w]+)>|([^<]+)/g;

    let match: RegExpExecArray | null;
    let iter = buffer.get_end_iter();
    const tagTable = buffer.tagTable;

    while ((match = regex.exec(serialized)) !== null) {
      if (match[3]) {
        const text = this.unescapeText(match[3]);

        const startMark = buffer.create_mark(null, iter, true); // left-gravity
        buffer.insert(iter, text, -1);
        const start = buffer.get_iter_at_mark(startMark);
        const end = buffer.get_end_iter();

        tagStack.forEach((tagName) => {
          const tag = tagTable.lookup(tagName);
          if (tag) buffer.apply_tag(tag, start, end);
        });

        buffer.delete_mark(startMark);
        iter = end.copy(); // advance iter
      } else {
        const [, slash, tagName] = match;
        if (slash) {
          // Closing tag
          const index = tagStack.lastIndexOf(tagName);
          if (index !== -1) tagStack.splice(index, 1);
        } else {
          // Opening tag
          tagStack.push(tagName);
        }
      }
    }
  }

  private static escapeText(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private static unescapeText(text: string): string {
    return text
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&");
  }
}
