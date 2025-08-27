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
  
    # Optional: fix locale warnings
    # export LC_ALL=en_US.UTF-8
    # export LANG=en_US.UTF-8

    # echo "Electron dev environment ready. Run 'npm start' or 'npx electron .'"
  '';
}
