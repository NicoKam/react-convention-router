import { resolve, join } from "path";
import scanRoutes from "routes-watcher";
import { IConfig, RouteConfig } from "routes-watcher/lib";

const DEV_MODE = process.env.NODE_ENV === "development";
const ifDev = (t: any, f: any): any => (DEV_MODE ? t : f);
const pageRoot = join(process.cwd(), "src/pages");
const outputPath = join(process.cwd(), "src/pages/.entry/index.js");
const globIgnore = ["**/components/**", "**/layouts/**", "**/models/**", "**/services/**"];

export default function (config: IConfig) {
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
    templateFile: resolve(__dirname, "RouteConfig.js.template"),
    output: outputPath,
    watch: DEV_MODE,
    formatter: ({ files = {}, fullPath, path }, { toScript, pushChild, relativePageRoot }) => {
      const res: RouteConfig = {
        path: fullPath ?? path,
      };
      const importFunc = (importPath: string) => ifDev(
        toScript(`require(${importPath}).default`),
        toScript(`asyncComponent(() => import(${importPath}))`),
      );

      if (files["index.js"]) {
        const indexPath = JSON.stringify(join(relativePageRoot(__dirname), files["index.js"]));
        res.component = importFunc(indexPath);
        res.exact = true;
        if (files["_layout.js"]) {
          pushChild({ ...res });
        }
      }
      if (files["_layout.js"]) {
        const layoutPath = JSON.stringify(join(relativePageRoot(__dirname), files["_layout.js"]));
        res.component = importFunc(layoutPath);
        res.exact = false;
      }
      return res;
    },
    ...config,
  });
}
