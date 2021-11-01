import { resolve, join, dirname } from 'path';
import fs from 'fs';
import watchRoutes, { scanRoutes } from 'routes-watcher';
import { IConfig } from 'routes-watcher';
import { RouteConfig } from 'routes-watcher/lib/defs';

const DEV_MODE = process.env.NODE_ENV === 'development';
const pageRoot = join(process.cwd(), 'src/pages');
const defaultOutputPath: string = join(process.cwd(), 'src/pages/.entry/index.js');

export interface Config extends IConfig {
  /** output path */
  outputPath?: string;
}

function sortDynamicRoutes(arr: RouteConfig[] | undefined): RouteConfig[] {
  if (!arr) {
    return [];
  }
  return arr.map((r) => {
    if (Array.isArray(r.children) && r.children.length > 0) {
      return {
        ...r,
        children: sortDynamicRoutes(r.children)
      }
    }
    return r;
  }).sort((a, b) => {
    const dynA = a.path?.indexOf(':') ?? -1;
    const dynB = b.path?.indexOf(':') ?? -1;
    return dynA - dynB;
  });
}

function sort404(arr: RouteConfig[]) {
  return arr
    .map((item) => {
      if (Array.isArray(item.children)) {
        return {
          ...item,
          children: sort404(item.children),
        };
      }
      return item;
    })
    .sort((a, b) => {
      // @ts-ignore
      const va = a.flag === '404' ? 1 : 0;
      // @ts-ignore
      const vb = b.flag === '404' ? 1 : 0;
      return va - vb;
    });
}

export default function (config: Config) {
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
  const scanFn = DEV_MODE ? watchRoutes : scanRoutes;

  scanFn({
    pageRoot,
    filter: (obj) => {
      if (/[A-Z]/.test(obj.path)) return false;
      if (obj.path.includes('/.entry/')) return false;
      return obj.name === 'index' || obj.name === '_layout' || obj.name === '404';
    },
    excludes: [/[\\/](components|models|services|layouts)[\\/]/],
    templateFile: resolve(__dirname, '../RouteConfig.js.template'),
    output: defaultOutputPath,
    modifyRoutePath: (path) => {
      // 动态路由替换
      return path.replace(/\/\[([^/^\[^\]]+)\](\/?)/g, (match0, match1, match2, index, str) => {
        if (index > 0) {
          if (match1.endsWith('$')) {
            return `/:${match1.slice(0, match1.length - 1)}?${match2}`;
          }
          return `/:${match1}${match2}`;
        }
        return match0;
      });
    },
    ...config,
    modifyRoutes: (routes) => {
      const newRoutes = sortDynamicRoutes(sort404(routes));
      return typeof config?.modifyRoutes === 'function' ? config.modifyRoutes(newRoutes) : newRoutes;
    },
  });
}
