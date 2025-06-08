import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import ContextMenu from "../../../ContextMenu";

import click from "../../../../core/utils/click";
import action from "../../../../core/utils/action";
import widget from "../../../../core/utils/widget";
import { debounce } from "../../../../core/utils/timing";

interface NoteListItemParams {
  id: string;
  name: string;
  actionMap: Gio.ActionMap;
}

export default class NoteListItem extends Gtk.ListBoxRow {
  static {
    GObject.registerClass(
      {
        GTypeName: "NoteListItem",
        Signals: {
          "note-context-menu-requested": {
            param_types: [
              GObject.TYPE_STRING,
              GObject.TYPE_INT,
              GObject.TYPE_INT,
            ],
          },
        },
      },
      this
    );
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

  constructor({ name, actionMap, id }: NoteListItemParams) {
    super({
      name: "NoteListItem",
      hexpand: true,
      cssClasses: [],
      tooltipText: name,
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
  }

  public promptRename() {
    this.buildRenamePopover(this._name).show();
  }

  private registerClickHandlers() {
    this.registerLeftClickHandler();
    this.registerRightClickHandler();
  }

  private registerRightClickHandler() {
    click.handle("right", this, ({ x, y }) =>
      this.emit("note-context-menu-requested", this._id, x, y)
    );
  }

  private registerLeftClickHandler() {
    click.handle("left", this, () =>
      action.invoke(this._actionMap, NoteListItem.Actions.DoOpen, this._id)
    );
    this.connect("activate", () => {
      action.invoke(this._actionMap, NoteListItem.Actions.DoOpen, this._id);
    });
  }

  private buildRenamePopover(currentname: string): Gtk.Popover {
    const popover = new Gtk.Popover({ name: "RenamePopover" });
    const content = widget.box.v({ margin: 20, spacing: 10 });

    popover.set_child(content);
    popover.set_parent(this);
    popover.connect("closed", () => {
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        if (popover.get_parent()) {
          popover.unparent();
        }
        return GLib.SOURCE_REMOVE;
      });
    });

    const header = widget.label.new("Rename Note", { cssClasses: ["title-2"] });
    const input = new Gtk.Entry({ text: currentname });
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

    return popover;
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
