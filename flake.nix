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
        version = "0.0.17"; # FLAKE_UPDATE_MARKER_VERSION

        sources = {
          "x86_64-linux" = {
            url = "[https://github.com/eyezahhhh/console-ui/releases/download/v$](https://github.com/eyezahhhh/console-ui/releases/download/v$){version}/Console-UI-${version}.AppImage";
            sha256 = "1532ypnx27p7iy5sj69d060bz8i9743yw7fx5xpijvnsdhy8xsn3"; # FLAKE_UPDATE_MARKER_SHA256_X86_64
          };
          "aarch64-linux" = {
            url = "[https://github.com/eyezahhhh/console-ui/releases/download/v$](https://github.com/eyezahhhh/console-ui/releases/download/v$){version}/Console-UI-${version}-arm64.AppImage";
            sha256 = "0q55r7zzg7l45w1685khvadndnsqpmdf97jf5ggvlsvrzy0fsi38"; # FLAKE_UPDATE_MARKER_SHA256_AARCH64
          };
        };

      in
      {
        packages.default = pkgs.appimageTools.wrapType2 rec {
          pname = "console-ui";
          inherit version;

          src = pkgs.fetchurl {
            url = sources.${system}.url;
            sha256 = sources.${system}.sha256;
          };

          extraPkgs = pkgs: with pkgs; [ ];

          meta = with pkgs.lib; {
            description = "Console-like frontend for Moonlight";
            homepage = "[https://github.com/eyezahhhh/console-ui](https://github.com/eyezahhhh/console-ui)";
            license = licenses.mit;
            maintainers = with maintainers; [ "eyezahhhh" ];
            platforms = [ "x86_64-linux" "aarch64-linux" ];
          };
        };
      });
}
