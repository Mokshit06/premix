const fs = require('fs');

exports.getRoutes = () => {
  const routes = fs
    .readdirSync('app/pages')
    .sort()
    .reverse()
    .map(page => {
      const path = page.replace(/\.(tsx|js|jsx)$/, '').replace(/^\$/, ':');

      return {
        path: path === 'index' ? '/' : `/${path}`,
        page: `app/pages/${page}`,
      };
    });

  return routes;
};
