import scanRoutes from './src';

scanRoutes({
  pageRoot: 'D:/project/demo-proj/src/pages',
  output: (routes) => {
    console.log(routes);
  },
});
