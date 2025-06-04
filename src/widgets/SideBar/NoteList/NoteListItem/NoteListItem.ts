import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import Pango from "@girs/pango-1.0";

import ContextMenu, { ContextMenuActions } from "../../../ContextMenu";

import { Click } from "../../../../core/utils/gesture";
import action from "../../../../core/utils/action";
import GLib from "@girs/glib-2.0";

interface NoteListItemParams {
  id: string;
  name: string;
  actionMap: Gio.ActionMap;
}

export default class NoteListItem extends Gtk.ListBoxRow {
  static {
    GObject.registerClass({ GTypeName: "NoteListItem" }, this);
  }

  /**
   * Actions that appear in the righ-click context menu
   */
  static ContexMenuActions = {
    Rename: `note-prompt-rename`,
    Delete: "note-prompt-delete",
  } as const;

  static Actions = {
    DoRename: "note-do-rename",
    DoDelete: "note-do-delete",
    DoSave: "note-do-save",
    Open: "note-open",
  } as const;

  private _id: string;
  private _actionMap: Gio.ActionMap;
  private _name: string;
  private _renamePopover: Gtk.Popover;
  private _renameInput: Gtk.Entry;
  private _contextMenu: ContextMenu;

  constructor({ name, actionMap, id }: NoteListItemParams) {
    super({
      name: "NoteListItem",
      hexpand: true,
      cssClasses: ["activatable"],
    });

    this._id = id;
    this._actionMap = actionMap;
    this._name = name;

    const content = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      marginTop: 8,
      marginBottom: 8,
      marginStart: 8,
      marginEnd: 8,
      cssClasses: ["sidebar-row"],
    });

    this.set_child(content);
    content.append(
      new Gtk.Label({
        label: name,
        xalign: 0,
        ellipsize: Pango.EllipsizeMode.END,
        halign: Gtk.Align.START,
      })
    );

    this.registerLeftClickHandler();
    this.registerRightClickHandler();
    [this._renamePopover, this._renameInput] = this.buildRenamePopover();
    this._contextMenu = this.buildContextMenu();
  }

  public promptRename() {
    this._renameInput.set_text(this._name);
    this._renamePopover.show();
  }

  private registerRightClickHandler() {
    Click.register(this, "right", ({ x, y }) =>
      this._contextMenu.popupAt(x, y)
    );
  }

  private registerLeftClickHandler() {
    Click.register(this, "left", () =>
      action.invoke(this._actionMap, NoteListItem.Actions.Open, this._id)
    );
  }

  private buildContextMenu() {
    const menu = ContextMenu.fromObject(
      {
        Rename: `${NoteListItem.ContexMenuActions.Rename}::${this._id}`,
        Delete: `${NoteListItem.ContexMenuActions.Delete}::${this._id}`,
        Open: `${NoteListItem.Actions.Open}::${this._id}`,
      },
      { scope: "win", parent: this }
    );
    return menu;
  }

  private buildRenamePopover(): [Gtk.Popover, Gtk.Entry] {
    const popover = new Gtk.Popover({});
    const content = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      marginTop: 20,
      marginBottom: 20,
      marginStart: 20,
      marginEnd: 20,
      spacing: 10,
    });

    const header = new Gtk.Label({ label: "Rename Note" });
    header.get_style_context().add_class("title-2");

    const input = new Gtk.Entry({});

    const buttonBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      halign: Gtk.Align.END,
    });

    const confirm = new Gtk.Button({ label: "Rename" });
    const confirmStyle = confirm.get_style_context();
    confirmStyle.add_class("suggested-action");
    buttonBox.append(confirm);

    content.append(header);
    content.append(input);
    content.append(buttonBox);

    popover.set_child(content);
    popover.set_parent(this);

    const submit = () =>
      action.invoke(
        this._actionMap,
        NoteListItem.Actions.DoRename,
        GLib.Variant.new_tuple([
          GLib.Variant.new_string(this._id),
          GLib.Variant.new_string(input.get_text()),
        ])
      );

    confirm.connect("clicked", () => submit());
    input.connect("activate", () => submit());

    return [popover, input] as const;
  }
}
