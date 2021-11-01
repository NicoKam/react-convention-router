import scanRoutes from './src';

scanRoutes({
  pageRoot: 'D:/project/aliyun-gts-whale-front/src/pages',
  output: (routes) => {
    console.log(routes);
  },
});
