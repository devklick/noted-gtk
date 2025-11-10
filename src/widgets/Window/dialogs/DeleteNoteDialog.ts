import Adw from "@girs/adw-1";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

interface DeleteNoteDialogParams {
  parent: Gtk.Window;
  noteName: string;
  autoShow?: boolean;
  onConfirm?(): void;
  onCancel?(): void;
}

export default class DeleteNoteDialog extends Adw.AlertDialog {
  static {
    GObject.registerClass({ GTypeName: "DeleteNoteDialog" }, this);
  }
  constructor({
    noteName,
    parent,
    onCancel,
    onConfirm,
    autoShow = true,
  }: DeleteNoteDialogParams) {
    super({heading: `Delete note ${noteName}`});
    this.add_response("cancel", "Cancel");
    this.add_response("delete", "Delete");
    this.set_response_appearance(
      "delete",
      Adw.ResponseAppearance.DESTRUCTIVE
    );
    this.set_default_response("delete");
    this.connect("response", (_, response) => {
      switch (response) {
        case "delete":
          onConfirm?.();
          break;
        case "cancel":
          onCancel?.();
          break;
      }
    });

    if (autoShow) {
      this.present(parent);
    }
  }
}
