import { resolve } from 'path';
import scanRouter from '../src/index';

test('scan routes', () => {
  scanRouter({
    pageRoot: resolve(__dirname, 'pages'),
    output: (routesConfig) => {
      console.log(routesConfig);
    },
  });
});
