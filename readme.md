<h1 align="center">
    Noted
</h1>

<p align="center">
    Basic notes application written in <a href='https://gjs.guide/'>GJS</a> (GNOME JavaScript),
    <br>
    utilising a <a href='https://www.gtk.org/'>Gtk</a> user interface styled with 
    <a href='https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1.3/index.html'>libadwaita</a>.
</p>

<p align='center'>
<img src='./doc/images/Screenshot from 2025-11-01 23-43-25.png'>
<br/>
<sup>Using <a href='https://github.com/vinceliuice/WhiteSur-gtk-theme'>WhiteSure Nord theme</a> in this screenshot</sup>
</p>

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