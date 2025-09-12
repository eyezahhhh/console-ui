{
  description = "Console-like frontend for Moonlight";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" ] (system:
      let
        pkgs = import nixpkgs { inherit system; };
        version = "0.1.0"; # FLAKE_UPDATE_MARKER_VERSION

        sources = {
          "x86_64-linux" = {
            url = "https://github.com/eyezahhhh/console-ui/releases/download/v${version}/Console-UI-${version}.AppImage";
            sha256 = "0kc23s31006yq04l5mavq3k6115jj3h5g2k4zbq2zb49g7ncsm21"; # FLAKE_UPDATE_MARKER_SHA256_X86_64
          };
          "aarch64-linux" = {
            url = "https://github.com/eyezahhhh/console-ui/releases/download/v${version}/Console-UI-${version}-arm64.AppImage";
            sha256 = "11c2qdvkpvssya467g5311v2fx7vdaxy26iw39g34qm2bbs9q9q1"; # FLAKE_UPDATE_MARKER_SHA256_AARCH64
          };
        };

        appPkg = pkgs.appimageTools.wrapType2 rec {
          pname = "console-ui";
          inherit version;

          src = pkgs.fetchurl {
            url = sources.${system}.url;
            sha256 = sources.${system}.sha256;
          };

          extraPkgs = pkgs: with pkgs; [ ];

          meta = with pkgs.lib; {
            description = "Console-like frontend for Moonlight";
            homepage = "https://github.com/eyezahhhh/console-ui";
            license = licenses.mit;
            maintainers = with maintainers; [ "eyezahhhh" ];
            platforms = [ "x86_64-linux" "aarch64-linux" ];
          };
        };

        desktopItem = pkgs.makeDesktopItem {
          name = "console-ui"; # The name of the resulting .desktop file
          exec = "console-ui"; # The command that will be run
          comment = "Console-like frontend for Moonlight";
          desktopName = "Console UI";
          genericName = "Moonlight Client";
          # icon = ./path/to/icon.png;
          icon = "utilities-terminal"; # todo: change
          categories = [ "Game" "Network" ];
        };

      in
      {
        packages.default = pkgs.symlinkJoin {
          name = "console-ui-with-desktop-entry";
          paths = [ appPkg desktopItem ];
          meta = appPkg.meta;
        };
      });
}
