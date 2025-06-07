import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import ContextMenu from "../../../ContextMenu";

import click from "../../../../core/utils/click";
import action from "../../../../core/utils/action";
import widget from "../../../../core/utils/widget";

interface NoteListItemParams {
  id: string;
  name: string;
  actionMap: Gio.ActionMap;
}

export default class NoteListItem extends Gtk.ListBoxRow {
  static {
    GObject.registerClass({ GTypeName: "NoteListItem" }, this);
  }
  private static _actionsCreated = true;

  public static Actions = {
    PromptRename: `note-prompt-rename`,
    PromptRenameCurrent: `note-prompt-rename-current`,
    PromptDelete: "note-prompt-delete",
    DoRename: "note-do-rename",
    DoDelete: "note-do-delete",
    DoSave: "note-do-save",
    DoOpen: "note-do-open",
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
      cssClasses: [],
    });
    this.ensureActions();

    this._id = id;
    this._actionMap = actionMap;
    this._name = name;
    this.add_controller;

    const content = widget.box.h({ margin: 8, cssClasses: ["sidebar-row"] });
    this.set_child(content);

    content.append(
      widget.label.new(name, { xalign: 0, ellipse: "END", hAlign: "START" })
    );

    this.registerClickHandlers();
    [this._renamePopover, this._renameInput] = this.buildRenamePopover();
    this._contextMenu = this.buildContextMenu();
  }

  public promptRename() {
    this._renameInput.set_text(this._name);
    this._renamePopover.show();
  }

  private registerClickHandlers() {
    this.registerLeftClickHandler();
    this.registerRightClickHandler();
  }

  private registerRightClickHandler() {
    click.handle("right", this, ({ x, y }) => this._contextMenu.popupAt(x, y));
  }

  private registerLeftClickHandler() {
    click.handle("left", this, () =>
      action.invoke(this._actionMap, NoteListItem.Actions.DoOpen, this._id)
    );
  }

  private buildContextMenu() {
    return ContextMenu.fromObject(
      {
        Rename: `${NoteListItem.Actions.PromptRename}::${this._id}`,
        Delete: `${NoteListItem.Actions.PromptDelete}::${this._id}`,
        Open: `${NoteListItem.Actions.DoOpen}::${this._id}`,
      } as const,
      { scope: "win", parent: this }
    );
  }

  private buildRenamePopover(): [Gtk.Popover, Gtk.Entry] {
    const popover = new Gtk.Popover();
    const content = widget.box.v({ margin: 20, spacing: 10 });

    popover.set_child(content);
    popover.set_parent(this);

    const header = widget.label.new("Rename Note", { cssClasses: ["title-2"] });
    const input = new Gtk.Entry();
    const buttonBox = widget.box.h({ hAlign: "END" });
    const confirm = new Gtk.Button({
      label: "Rename",
      cssClasses: ["suggested-action"],
    });

    buttonBox.append(confirm);
    content.append(header);
    content.append(input);
    content.append(buttonBox);

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

  public static defineActions(actionMap: Gio.ActionMap) {
    action.create(actionMap, NoteListItem.Actions.PromptDelete, "string");
    action.create(actionMap, NoteListItem.Actions.PromptRename, "string");
    action.create(actionMap, NoteListItem.Actions.PromptRenameCurrent);

    action.create(actionMap, NoteListItem.Actions.DoOpen, "string");
    action.create(actionMap, NoteListItem.Actions.DoSave);
    action.create(actionMap, NoteListItem.Actions.DoDelete, "string");
    action.create(
      actionMap,
      NoteListItem.Actions.DoRename,
      GLib.VariantType.new("(ss)")
    );
    NoteListItem._actionsCreated = true;
  }
  private ensureActions() {
    if (!NoteListItem._actionsCreated) {
      throw new Error(
        "NoteListItem.defineActions must be called before instantiation"
      );
    }
  }
}
