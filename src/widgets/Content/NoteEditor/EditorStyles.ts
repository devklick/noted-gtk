import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import Gio from "@girs/gio-2.0";
import GObject from "@girs/gobject-2.0";

import icon from "../../../core/utils/icon";
import click from "../../../core/utils/click";
import widget, { listModel } from "../../../core/utils/widget";
import StyleManager from "../../../core/StyleManager";
import action from "../../../core/utils/action";
import { AppShortcuts } from "../../../core/ShortcutManager";
import { FontSizePicker, StylePresetPicker } from "../../DropDown";

interface EditorStylesParams {
  styleManager: StyleManager;
  visible: boolean;
  actionMap: Gio.ActionMap;
  keyController: Gtk.EventControllerKey;
  shortcuts: AppShortcuts;
}

/**
 * Widget containing the elements that a user can interact with to change styles.
 *
 * Also responsible for listening for shortcuts known to change styles.
 *
 * When either scenarios occur, the EditorStyles widget is responsible for
 * informing the StleManager about the changes to the styles.
 */
export default class EditorStyles extends Gtk.Box {
  static {
    GObject.registerClass({ GTypeName: "EditorSyles" }, this);
  }

  private styleManager: StyleManager;
  private expanded: boolean = false;
  private dropDownClickerBox: Gtk.Box;
  private dropDownClicker: Gtk.Image;
  private content: Gtk.Box;
  private actionMap: Gio.ActionMap;
  private fontSizePicker: FontSizePicker;
  private stylePresetPicker: StylePresetPicker;
  private boldButton: Gtk.ToggleButton;
  private boldToggledHandlerId?: number;
  private italicButton: Gtk.ToggleButton;
  private italicToggledHandlerId?: number;
  private underlineButton: Gtk.ToggleButton;
  private monoButton: Gtk.ToggleButton;
  private underlineToggledHandlerId?: number;
  private monoToggledHandlerId?: number;
  private keyController: Gtk.EventControllerKey;
  private readonly shortcuts: AppShortcuts;

  constructor({
    styleManager,
    visible,
    actionMap,
    keyController,
    shortcuts,
  }: EditorStylesParams) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      halign: Gtk.Align.FILL,
      hexpand: true,
      cssClasses: ["editor-styles"],
      visible,
    });

    this.styleManager = styleManager;
    this.actionMap = actionMap;
    this.keyController = keyController;
    this.shortcuts = shortcuts;

    const toggler = (label: string, tooltip: string) =>
      new Gtk.ToggleButton({
        child: new Gtk.Label({ label, useMarkup: true }),
        tooltip_text: tooltip,
        cssClasses: ["flat", "style-toggle"],
        canFocus: false,
      });

    this.boldButton = toggler("<b>B</b>", "Bold");
    this.italicButton = toggler("<i>I</i>", "Italic");
    this.underlineButton = toggler("<u>U</u>", "Underline");
    this.monoButton = toggler(
      '<span font_family="Monospace" font_size="12000">Code</span>',
      "Monospace / code"
    );

    this.fontSizePicker = new FontSizePicker({
      onChanged: (size) => this.styleManager.setSize(size),
    });

    this.stylePresetPicker = new StylePresetPicker({
      onChanged: (preset) => this.styleManager.setStylePreset(preset),
    });

    this.content = widget.box.h({
      spacing: 6,
      marginTop: 6,
      marginBottom: 6,
      marginStart: 6,
      marginEnd: 0,
      children: [
        this.boldButton,
        this.italicButton,
        this.underlineButton,
        this.monoButton,
        this.fontSizePicker,
        this.stylePresetPicker,
      ],
      visible: false,
    });

    this.dropDownClicker = new Gtk.Image({
      iconName: icon.symbolic("pan-down"),
    });
    this.dropDownClickerBox = widget.box.h({
      hexpand: true,
      hAlign: "END",
      marginEnd: 12,
      children: [this.dropDownClicker],
    });

    click.handle("left", this.dropDownClicker, () => this.toggleExpanded());

    this.append(this.content);
    this.append(this.dropDownClickerBox);

    this.registerActionHandlers();
    this.listenForShortcuts();
  }

  public expand() {
    if (this.expanded) return;
    this.remove(this.dropDownClickerBox);
    this.content.append(this.dropDownClickerBox);
    this.dropDownClicker.set_from_icon_name(icon.symbolic("pan-up"));
    this.content.visible = true;
    this.expanded = true;
  }

  public collapse() {
    if (!this.expanded) return;
    this.content.remove(this.dropDownClickerBox);
    this.append(this.dropDownClickerBox);
    this.dropDownClicker.set_from_icon_name(icon.symbolic("pan-down"));
    this.content.visible = false;
    this.expanded = false;
  }

  public setExpanded(expanded: boolean) {
    if (expanded) this.expand();
    else this.collapse();
  }

  private toggleExpanded() {
    if (this.expanded) this.collapse();
    else this.expand();
  }

  private registerActionHandlers() {
    action.handle(
      this.actionMap,
      StyleManager.Actions.SizeChanged,
      "int",
      (size) => {
        this.fontSizePicker.set_selected(
          listModel.findIndex(this.fontSizePicker.model, size.toString())
        );
        this.stylePresetPicker.set_selected(
          listModel.findIndex(
            this.stylePresetPicker.model,
            this.styleManager.currentStylePreset[0]
          )
        );
      }
    );
    action.handle(
      this.actionMap,
      StyleManager.Actions.BoldChanged,
      "bool",
      (active) => {
        this.boldButton.active !== active &&
          this.silentlyUpdateToggle(
            this.boldButton,
            this.boldToggledHandlerId,
            active
          );
        this.stylePresetPicker.set_selected(
          listModel.findIndex(
            this.stylePresetPicker.model,
            this.styleManager.currentStylePreset[0]
          )
        );
      }
    );

    action.handle(
      this.actionMap,
      StyleManager.Actions.ItalicChanged,
      "bool",
      (active) => {
        this.silentlyUpdateToggle(
          this.italicButton,
          this.italicToggledHandlerId,
          active
        );
        this.stylePresetPicker.set_selected(
          listModel.findIndex(
            this.stylePresetPicker.model,
            this.styleManager.currentStylePreset[0]
          )
        );
      }
    );

    action.handle(
      this.actionMap,
      StyleManager.Actions.UnderlineChanged,
      "bool",
      (active) => {
        this.silentlyUpdateToggle(
          this.underlineButton,
          this.underlineToggledHandlerId,
          active
        );
        this.stylePresetPicker.set_selected(
          listModel.findIndex(
            this.stylePresetPicker.model,
            this.styleManager.currentStylePreset[0]
          )
        );
      }
    );

    action.handle(
      this.actionMap,
      StyleManager.Actions.MonoChanged,
      "bool",
      (active) => {
        this.silentlyUpdateToggle(
          this.monoButton,
          this.monoToggledHandlerId,
          active
        );
        this.stylePresetPicker.set_selected(
          listModel.findIndex(
            this.stylePresetPicker.model,
            this.styleManager.currentStylePreset[0]
          )
        );
      }
    );

    this.boldToggledHandlerId = this.boldButton.connect("toggled", () =>
      this.styleManager.toggleDecoration("bold", this.boldButton.active)
    );
    this.italicToggledHandlerId = this.italicButton.connect("toggled", () =>
      this.styleManager.toggleDecoration("italic", this.italicButton.active)
    );
    this.underlineToggledHandlerId = this.underlineButton.connect(
      "toggled",
      () =>
        this.styleManager.toggleDecoration(
          "underline",
          this.underlineButton.active
        )
    );
    this.monoToggledHandlerId = this.monoButton.connect("toggled", () =>
      this.styleManager.toggleDecoration("mono", this.monoButton.active)
    );
  }

  private listenForShortcuts() {
    this.keyController.connect("key-pressed", (_, key, _keycode, modifier) => {
      const shortcut = this.shortcuts.check({ key, modifier });
      switch (shortcut) {
        case "editor-shoctut-toggle-bold-text":
          this.toggleButton(this.boldButton);
          return Gdk.EVENT_STOP;
        case "editor-shoctut-toggle-italic-text":
          this.toggleButton(this.italicButton);
          return Gdk.EVENT_STOP;
        case "editor-shoctut-toggle-underline-text":
          this.toggleButton(this.underlineButton);
          return Gdk.EVENT_STOP;
        case "editor-shoctut-toggle-mono-text":
          this.toggleButton(this.monoButton);
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-normal":
          this.styleManager.setStylePreset("normal");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h1":
          this.styleManager.setStylePreset("h1");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h2":
          this.styleManager.setStylePreset("h2");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h3":
          this.styleManager.setStylePreset("h3");
          return Gdk.EVENT_STOP;
        case "editor-shoctut-text-size-h4":
          this.styleManager.setStylePreset("h4");
          return Gdk.EVENT_STOP;
        default:
          return Gdk.EVENT_PROPAGATE;
      }
    });
  }

  private toggleButton(button: Gtk.ToggleButton) {
    button.set_active(!button.active);
  }

  /**
   * Update the specified ToggleButton's active property
   * without firing the `toggled` event.
   */
  private silentlyUpdateToggle(
    button: Gtk.ToggleButton,
    handlerId: number | undefined,
    toggled: boolean
  ) {
    if (!handlerId) return;
    button.block_signal_handler(handlerId);
    button.set_active(toggled);
    button.unblock_signal_handler(handlerId);
  }
}
