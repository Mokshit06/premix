const fs = require('fs');
const path = require('path');

exports.getRoutes = () => {
  const routes = fs
    .readdirSync('app/pages')
    .sort()
    .reverse()
    .map(page => {
      const routePath = page.replace(/\.(tsx|js|jsx)$/, '').replace(/^\$/, ':');

      return {
        path: routePath === 'index' ? '/' : `/${routePath}`,
        page: path.join(process.cwd(), `app/pages/${page}`),
      };
    });

  return routes;
};
