{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.electron
    pkgs.glib
    pkgs.gtk3
    pkgs.dbus
    pkgs.xorg.libX11
    pkgs.libxkbcommon
  ];

  shellHook = ''
    export ELECTRON_BIN="${pkgs.electron}/bin/electron"
  '';
}
