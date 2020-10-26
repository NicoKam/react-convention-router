import { resolve, join, dirname } from 'path';
import fs from 'fs';
import scanRoutes from 'routes-watcher';
import { IConfig, RouteConfig } from 'routes-watcher/lib';

const DEV_MODE = process.env.NODE_ENV === 'development';
const ifDev = (t: any, f: any): any => (DEV_MODE ? t : f);
const pageRoot = join(process.cwd(), 'src/pages');
const defaultOutputPath: string = join(process.cwd(), 'src/pages/.entry/index.js');
const globIgnore = ['**/components/**', '**/layouts/**', '**/models/**', '**/services/**'];

export interface Config extends IConfig {
  /** output path */
  outputPath?: string;
  importCode?: (importPath: string) => string;
}

function flatten<T>(arr: (T | T[])[]) {
  const res: T[] = [];
  arr.forEach((T) => {
    if (Array.isArray(T)) {
      res.push(...T);
    } else {
      res.push(T);
    }
  });
  return res;
}

const replaceDynamicRoutePath = (path: string) => {
  return path.replace(/\[([^/^\[^\]]+)\]/g, (match0, match1, index, str) => {
    if (
      index > 0 &&
      str[index - 1] === '/' &&
      (index + match0.length >= str.length || str[index + match0.length] === '/')
    ) {
      return `:${match1}`;
    }
    return match0;
  });
};

export default function ({ importCode, ...config }: Config) {
  let outputPath: string = dirname(defaultOutputPath);
  if (config) {
    if (typeof config.output === 'string') {
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
    files: ['index.js', 'index.ts', 'index.tsx', '_layout.js', '_layout.ts', '_layout.jsx', '_layout.tsx'],
    filter: (routePath) => {
      if (/[A-Z]/.test(routePath)) {
        return false;
      }
      if (routePath.includes('/.entry/')) {
        return false;
      }
      return true;
    },
    templateFile: resolve(__dirname, '../RouteConfig.js.template'),
    output: defaultOutputPath,
    watch: DEV_MODE,
    formatter: ({ files = {}, fullPath, path, children = [] }, { toScript, pushChild, relativePageRoot }) => {
      const res: RouteConfig = {
        path: replaceDynamicRoutePath(fullPath || path),
      };
      const importFunc = (importPath: string) =>
        typeof importCode === 'function'
          ? toScript(importCode(importPath))
          : ifDev(toScript(`require('${importPath}').default`), toScript(`asyncComponent(() => import('${importPath}'))`));

      if (files['index']) {
        const indexPath = join(relativePageRoot(outputPath), files['index']);
        const component = importFunc(indexPath);
        res.exact = true;
        if (files['_layout'] || children.length > 0) {
          pushChild({ ...res, component, exact: true });
        } else {
          res.component = component;
          res.exact = true;
        }
      }
      if (files['_layout']) {
        const layoutPath = join(relativePageRoot(outputPath), files['_layout']);
        res.component = importFunc(layoutPath);
        res.exact = false;
      }
      return res;
    },
    ...config,
    modifyRoutes: (routes) => {
      const newRoutes = flatten(routes);
      return typeof config?.modifyRoutes === 'function' ? config.modifyRoutes(newRoutes) : newRoutes;
    },
  });
}
