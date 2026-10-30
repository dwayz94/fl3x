import { existsSync } from "node:fs";
import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// snapcn components import with the "@/" alias (src/).
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: { ...config.resolve, alias: { ...(config.resolve?.alias ?? {}), "@": path.resolve(process.cwd(), "src") } },
}));

// Remotion's downloaded chrome-headless-shell never finishes loading the root on this
// Mac (macOS 27): render with the installed Google Chrome when there is one.
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (existsSync(CHROME)) Config.setBrowserExecutable(CHROME);
