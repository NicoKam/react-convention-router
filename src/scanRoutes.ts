import { resolve, join, dirname } from "path";
import fs from "fs";
import scanRoutes from "routes-watcher";
import { IConfig, RouteConfig } from "routes-watcher/lib";

const DEV_MODE = process.env.NODE_ENV === "development";
const ifDev = (t: any, f: any): any => (DEV_MODE ? t : f);
const pageRoot = join(process.cwd(), "src/pages");
const defaultOutputPath: string = join(process.cwd(), "src/pages/.entry/index.js");
const globIgnore = ["**/components/**", "**/layouts/**", "**/models/**", "**/services/**"];

export interface Config extends IConfig {
  /** output path */
  outputPath?: string,
}

export default function (config: Config) {
  let outputPath: string = dirname(defaultOutputPath);
  if (config) {
    if (typeof config.output === "string") {
      outputPath = dirname(config.output);
    } else if (config.outputPath) {
      outputPath = config.outputPath;
    }
  }
  try {
    fs.accessSync(outputPath);
  } catch (err) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  scanRoutes({
    pageRoot,
    ignore: globIgnore,
    files: ["index.js", "index.ts", "_layout.js", "_layout.ts", "_layout.jsx", "_layout.tsx"],
    filter: (routePath) => {
      if (/[A-Z]/.test(routePath)) {
        return false;
      }
      if (routePath.includes("/.entry/")) {
        return false;
      }
      return true;
    },
    templateFile: resolve(__dirname, "../RouteConfig.js.template"),
    output: defaultOutputPath,
    watch: DEV_MODE,
    formatter: ({ files = {}, fullPath, path }, { toScript, pushChild, relativePageRoot }) => {
      const res: RouteConfig = {
        path: fullPath ?? path,
      };
      const importFunc = (importPath: string) => ifDev(
        toScript(`require(${importPath}).default`),
        toScript(`asyncComponent(() => import(${importPath}))`),
      );

      if (files["index"]) {
        const indexPath = JSON.stringify(join(relativePageRoot(outputPath), files["index"]));
        res.component = importFunc(indexPath);
        res.exact = true;
        if (files["_layout"]) {
          pushChild({ ...res });
        }
      }
      if (files["_layout"]) {
        const layoutPath = JSON.stringify(join(relativePageRoot(outputPath), files["_layout"]));
        res.component = importFunc(layoutPath);
        res.exact = false;
      }
      return res;
    },
    ...config,
  });
}
