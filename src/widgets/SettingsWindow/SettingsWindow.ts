import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import Gtk from "@girs/gtk-4.0";
import GObject from "@girs/gobject-2.0";

import Application from "../Application";
import { debounce } from "../../core/utils/timing";

interface SettingsWindowParams {
  application: Application;
  settings: Gio.Settings;
}

export default class SettingsWindow extends Adw.PreferencesWindow {
  static {
    GObject.registerClass({ GTypeName: "SettingsWindow" }, this);
  }

  private readonly settings: Gio.Settings;
  private readonly audioSwitch: Gtk.Switch;
  private readonly speedSlider: Gtk.Scale;

  constructor({ application, settings }: SettingsWindowParams) {
    super({ application, title: "Settings" });
    this.settings = settings;
    this.audioSwitch = new Gtk.Switch({ valign: Gtk.Align.CENTER });
    this.speedSlider = new Gtk.Scale({
      orientation: Gtk.Orientation.HORIZONTAL,
      valuePos: Gtk.PositionType.RIGHT,
      hexpand: true,
      adjustment: new Gtk.Adjustment({
        lower: 100,
        upper: 1000,
        stepIncrement: 1,
      }),
    });

    this.addGeneralPage();
  }

  vfunc_close_request(): boolean {
    this.hide();
    return true;
  }

  private addGeneralPage() {
    const page = new Adw.PreferencesPage({ title: "General" });
    this.addAudioGroup(page);
    this.addDifficultyGroup(page);
    this.add(page);
  }

  private addAudioGroup(page: Adw.PreferencesPage) {
    const audioGroup = new Adw.PreferencesGroup({ title: "Audio" });
    const audioRow = new Adw.ActionRow({
      title: "Enable Audio",
      subtitle: "Play sound effects during gameplay",
    });
    audioRow.add_suffix(this.audioSwitch);
    audioGroup.add(audioRow);
    page.add(audioGroup);

    this.audioSwitch.set_active(this.settings.get_boolean("audio-enabled"));
    this.audioSwitch.connect("notify::active", () => {
      this.settings.set_boolean("audio-enabled", this.audioSwitch.get_active());
    });
  }

  private addDifficultyGroup(page: Adw.PreferencesPage) {
    const speedGroup = new Adw.PreferencesGroup({ title: "Difficulty" });
    const speedRow = new Adw.ActionRow({
      title: "Game Speed",
      subtitle: "How fast or slow the pattern is played",
    });

    speedRow.add_suffix(this.speedSlider);
    speedGroup.add(speedRow);

    page.add(speedGroup);

    this.speedSlider.set_value(this.settings.get_int("game-speed"));

    const debouncedSetSpeed = debounce(100, (value: number) =>
      this.settings.set_int("game-speed", value)
    );

    this.speedSlider.connect("value-changed", (scale) =>
      debouncedSetSpeed(Math.round(scale.get_value()))
    );
  }
}
