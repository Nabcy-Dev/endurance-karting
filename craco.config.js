const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1. Assurez-vous que les sections resolve et fallback existent
      if (!webpackConfig.resolve) {
        webpackConfig.resolve = {};
      }
      if (!webpackConfig.resolve.fallback) {
        webpackConfig.resolve.fallback = {};
      }

      // 2. Polyfills minimaux pour les modules Node introuvables dans le browser
      Object.assign(webpackConfig.resolve.fallback, {
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        url: false,
        util: false,
        zlib: false,
        buffer: false,
        process: false,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false
      });

      // 3. Préparez la liste des plugins si nécessaire
      if (!webpackConfig.plugins) {
        webpackConfig.plugins = [];
      }

      // 4. Définissez uniquement les variables d'environnement nécessaires
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
          'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL)
        })
      );

      return webpackConfig;
    }
  }
};
