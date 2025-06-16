import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

import click from "../../../../core/utils/click";
import action from "../../../../core/utils/action";
import widget from "../../../../core/utils/widget";
import icon from "../../../../core/utils/icon";
import { AppPrefs } from "../../../../core/PreferencesManager";

interface NoteListItemParams {
  id: string;
  name: string;
  actionMap: Gio.ActionMap;
  starred: boolean;
  locked: boolean;
  hidden: boolean;
  prefs: AppPrefs;
}

export default class NoteListItem extends Gtk.ListBoxRow {
  static Signals = action.signal.many({
    ContextMenuRequested: {
      name: "note-context-menu-requested",
      params: ["TYPE_STRING", "TYPE_INT", "TYPE_INT"],
    },
  });

  static {
    GObject.registerClass(
      {
        GTypeName: "NoteListItem",
        Signals: {
          [this.Signals.ContextMenuRequested.name]: {
            param_types: this.Signals.ContextMenuRequested.params,
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
    ToggleStarred: "note-toggle-starred",
    ToggleLocked: "note-toggle-locked",
  } as const;

  private _id: string;
  private _actionMap: Gio.ActionMap;
  private _name: string;

  constructor({
    name,
    actionMap,
    id,
    locked,
    starred,
    hidden,
    prefs,
  }: NoteListItemParams) {
    super({
      name: "NoteListItem",
      hexpand: true,
      tooltipText: name,
      hexpandSet: false,
      cssClasses: ["note-listitem"],
      marginStart: 0,
      marginEnd: 0,
      marginTop: 0,
      marginBottom: 0,
    });
    this.ensureActions();

    this._id = id;
    this._actionMap = actionMap;
    this._name = name;
    this.add_controller;

    const content = widget.box.h({ cssClasses: ["sidebar-row"] });
    this.set_child(content);

    content.append(
      widget.label.new(name, {
        xalign: 0,
        ellipse: "END",
        hAlign: "START",
        hexpand: true,
      })
    );

    const decors = widget.box.h({
      hAlign: "CENTER",
      vAlign: "CENTER",
      linked: true,
      cssClasses: ["note-decorations"],
    });

    if (starred) {
      const image = Gtk.Image.new_from_icon_name(icon.symbolic("non-starred"));
      image.set_tooltip_text("Starred");
      decors.append(image);
    }
    if (locked) {
      const image = Gtk.Image.new_from_icon_name(
        icon.symbolic("system-lock-screen")
      );
      image.set_tooltip_text("Locked");
      decors.append(image);
    }

    if (hidden) {
      const image = Gtk.Image.new_from_icon_name(icon.symbolic("view-conceal"));
      image.set_tooltip_text("Hidden");
      decors.append(image);
    }

    content.append(decors);

    prefs.onChanged("enable-categories", (enabled) =>
      decors.set_visible(enabled && prefs.get("enable-category-decorations"))
    );
    prefs.onChanged("enable-category-decorations", (enabled) =>
      decors.set_visible(enabled && prefs.get("enable-categories"))
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
      this.emit(NoteListItem.Signals.ContextMenuRequested.name, this._id, x, y)
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
    const header = widget.label.new("Rename Note", { cssClasses: ["title-2"] });
    const input = new Gtk.Entry({ text: currentname });

    const confirm = new Gtk.Button({
      label: "Rename",
      cssClasses: ["suggested-action"],
    });

    const buttonBox = widget.box.h({ hAlign: "END", children: [confirm] });

    const content = widget.box.v({
      margin: 20,
      spacing: 10,
      children: [header, input, buttonBox],
    });

    const popover = new Gtk.Popover({ name: "RenamePopover" });
    popover.set_parent(this);
    popover.set_child(content);

    popover.connect("closed", () => {
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        if (popover.get_parent()) {
          popover.unparent();
        }
        return GLib.SOURCE_REMOVE;
      });
    });

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

    action.create(actionMap, NoteListItem.Actions.ToggleStarred, "bool");
    action.create(actionMap, NoteListItem.Actions.ToggleLocked, "bool");

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
