# Noted

Basic notes application written in [GJS](https://gjs.guide/) (GNOME JavaScript), utilising a [Gtk](https://www.gtk.org/) 
user interface styled with [libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1.3/index.html).

![snapshot](./doc/images/Screenshot%20from%202025-11-01%2023-43-25.png)
<sup>Using [WhiteSure Nord theme](https://github.com/vinceliuice/WhiteSur-gtk-theme) in this screenshot</sup>


## Features

- Totally offline - notes only saved to local file system
- Pre-defined not categories (Favourite, Locked, Hidden)
- Toggleable styles (bold, italic, underline, monospace, font size)
- Style presets
- Customisable keyboard shortcuts

## To do
- Bundle with flatpak (notes to help me remember)
  - build with npm: `npm run build`
  - Setup meson build directory: `meson setup builddir`
  - Build flatpak: `flatpak-builder --user --install --force-clean build-dir io.github.devklick.noted.flatpak.yml`
  - Run flatpak: `flatpak run io.github.devklick.noted`
  - TODO: Fix theme issue in flatpak - follow system theme.
- ...
- Refactor / Re-write
  - Since this was my first real attempt at building a Gtk app (other than [Simon Says](https://github.com/devklick/simon-says)), it's far from perfect. If it's going to be something that's used and maintained, it's probably going to benefit from some refactoring, applying some of the lessons I learned along the way,