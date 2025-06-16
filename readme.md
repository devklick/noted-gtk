# Noted

Gtk4 notes application

WIP


WIP notes for building flatpak

- build with npm: `npm run build`
- Setup meson build directory: `meson setup builddir`
- Build flatpak: `flatpak-builder --user --install --force-clean build-dir io.github.devklick.noted.flatpak.yml`
- Run flatpak: `flatpak run io.github.devklick.noted`

TODO: Fix theme issue in flatpak - follow sustem theme.