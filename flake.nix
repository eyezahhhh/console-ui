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
        version = "0.1.1"; # FLAKE_UPDATE_MARKER_VERSION

        sources = {
          "x86_64-linux" = {
            url = "https://github.com/eyezahhhh/console-ui/releases/download/v${version}/Console-UI-${version}.AppImage";
            sha256 = "0i82yssak00qqz49s46hzfifvlgwyzrh9g96cny54fz5rfp7k9nv"; # FLAKE_UPDATE_MARKER_SHA256_X86_64
          };
          "aarch64-linux" = {
            url = "https://github.com/eyezahhhh/console-ui/releases/download/v${version}/Console-UI-${version}-arm64.AppImage";
            sha256 = "17709zrxfhs13qqvshsdlzlyha1izvypmv9k6yz4s79xn8ibi85y"; # FLAKE_UPDATE_MARKER_SHA256_AARCH64
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
