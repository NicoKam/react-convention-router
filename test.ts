import scanRoutes from './src';

scanRoutes({
  pageRoot: 'D:/project/cloud-exhibition-h5-dm1/src/pages',
  output: (routes) => {
    console.log(routes);
  },
});
