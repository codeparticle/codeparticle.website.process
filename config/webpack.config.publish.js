const CopyPkgJsonPlugin = require('copy-pkg-json-webpack-plugin');
const webpack = require('webpack');
const paths = require('./paths');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: paths.d3ProcessIndexJs,
  output: {
    // The build folder.
    path: paths.appBuild,
    filename: 'index.js',
    library: 'codeparticle.website.process',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules\/(?!d3-force)/,
        loader: require.resolve('babel-loader'),
        options: {
          compact: true,
        },
      },
    ],
  },
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true,
    }),
    new CopyPkgJsonPlugin({
      remove: ['private', 'devDependencies', 'dependencies', 'scripts', 'husky', 'jest', 'babel', 'eslintConfig'],
      replace: {
        main: 'index.js',
      },
    }),
  ],
};
