const globby = require('globby');

exports.getRoutes = () => {
  const routes = globby
    .sync('app/pages/**/*.{tsx,js,jsx}')
    .sort()
    .reverse()
    .map(page => {
      const fileName = page.replace(/^app\/pages\//, '');
      const path = fileName
        .replace(/\.(tsx|js|jsx)$/, '')
        .split('/')
        .map(x => x.replace(/^\$/, ':'))
        .join('/');

      return {
        path: path === 'index' ? '/' : `/${path}`,
        page: `app/pages/${fileName}`,
      };
    });

  return routes;
};
