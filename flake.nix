{
  description = "The Living Archive — Egyptian religion and its afterlives";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          browsers = pkgs.playwright-driver.browsers.override {
            withFirefox = false;
            withWebkit = false;
            withFfmpeg = false;
            withChromiumHeadlessShell = false;
          };
          revision = pkgs.playwright-driver.browsersJSON.chromium.revision;
          executable = {
            x86_64-linux = "chrome-linux64/chrome";
            aarch64-linux = "chrome-linux-arm64/chrome";
            aarch64-darwin = "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
          }.${system};
        in {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs_24 pkgs.curl ];
            EGYPT_DEV_SHELL = "1";
            # Use an explicit executable: nixpkgs and npm pin Playwright independently.
            EGYPT_CHROMIUM_EXECUTABLE = "${browsers}/chromium-${revision}/${executable}";
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
          };
        });
    };
}
