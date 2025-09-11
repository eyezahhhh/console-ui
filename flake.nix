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
        version = "0.0.18"; # FLAKE_UPDATE_MARKER_VERSION

        sources = {
          "x86_64-linux" = {
            url = "[https://github.com/eyezahhhh/console-ui/releases/download/v$](https://github.com/eyezahhhh/console-ui/releases/download/v$){version}/Console-UI-${version}.AppImage";
            sha256 = "1vxm6gdb2zf01mql7b61gyjwg5dah9ii6h0i63y5bhi6wj2fgh9v"; # FLAKE_UPDATE_MARKER_SHA256_X86_64
          };
          "aarch64-linux" = {
            url = "[https://github.com/eyezahhhh/console-ui/releases/download/v$](https://github.com/eyezahhhh/console-ui/releases/download/v$){version}/Console-UI-${version}-arm64.AppImage";
            sha256 = "15qv2gq8jzy3jbqyli063n690hrzdwlgxjabapicsh7r9kax0i8z"; # FLAKE_UPDATE_MARKER_SHA256_AARCH64
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
