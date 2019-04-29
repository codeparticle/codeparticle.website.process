'use strict';

const paths = require('./paths');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  resolve: {
    extensions: ['.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx', '.scss', '.css', '.otf', '.json'],
    modules: [paths.appNodeModules, 'node_modules'].concat(
      // It is guaranteed to exist because we tweak it in `env.js`
      process.env.NODE_PATH.split(paths.delimiter).filter(Boolean)
    ),
    alias: {
      // Create aliases the components can use for import in js files
      'react-native': 'react-native-web',
      'd3-process': paths.d3Process,
    },
    plugins: [
      // Prevents users from importing files from outside of src/ (or node_modules/).
      // This often causes confusion because we only process files within src/ with babel.
      // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
      // please link the files into your node_modules/ and let module-resolution kick in.
      // Make sure your source files are compiled, as they will not be processed in any way.
      new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
    ],
  },
  module: {
    rules: [
      // Take all sass files, compile them, and bundle them in with our js bundle
      {
        test: /\.s?css$/,
        use: ['css-hot-loader'].concat(ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              root: paths.appStyles,
            },
          }, {
            loader: 'sass-loader',
            options: {
              includePaths: [paths.appStyles],
            },
          },
          ],
        })),
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
        exclude: /node_modules|package.json/,
      },
      {
        test: /\.(jpe?g|png|gif|svg|otf|woff|woff2|webm|mp4)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/',
            },
          },
        ],
      },
    ],
  },
  node: {
    fs: 'empty',
  },
};
