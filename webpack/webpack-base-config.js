import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import BundleTracker from 'webpack-bundle-tracker';
import WebpackIsomorphicToolsPlugin from 'webpack-isomorphic-tools/plugin';
import _debug from 'debug'

import config from '../config';
var webpackIsomorphicToolsPlugin = new WebpackIsomorphicToolsPlugin(require('./webpack-isomorphic-tools'));

const debug = _debug('app:webpack-base-config')
const paths = config.utils_paths
Object.assign(global, config.globals);

debug('Create base webpack configuration.')
const webpackBaseConfig = {
  context: config.path_base,
  entry: [
    paths.src('client')
  ],
  output: {
    // file name pattern for chunk scripts
		chunkFilename: '[name].[hash].js',
    // file name pattern for entry scripts
    filename: path.join('js', '[name].[hash].js'),
    // filesystem path for static files
    path: paths.dist(),
    // webserver path for static files
    publicPath: '/assets/'
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: paths.src(),
        query: {
          cacheDirectory: true,
          plugins: ['transform-runtime'],
          presets: ['es2015', 'react', 'stage-0'],
          env: {
            development: {
              plugins: [
                ['react-transform', {
                  transforms: [{
                    transform: 'react-transform-hmr',
                    imports: ['react'],
                    locals: ['module']
                  }, {
                    transform: 'react-transform-catch-errors',
                    imports: ['react', 'redbox-react']
                  }]
                }]
              ]
            },
            production: {
              plugins: [
                'transform-react-remove-prop-types',
                'transform-react-constant-elements'
              ]
            }
          }
        }
      },
      {
        exclude: /node_modules/,
        loader: 'json-loader',
        test: /\.json$/
      },
      {
        loader: ExtractTextPlugin.extract('css!sass'),
        test: /\.scss$/
      },
      {
        loader: 'file?context=' + paths.base('static') + '&hash=sha512&digest=hex&name=[path][name].[ext]',
        test:  /\.(woff|woff2|ttf|eot|svg)$/i
      },
      {
        loaders: [
            'file?context=' + paths.base('static') + '&hash=sha512&digest=hex&name=[path][name]-[hash].[ext]',
            'image-webpack?bypassOnDebug&optimizationLevel=3&interlaced=false'
        ],
        test: /\.(jpe?g|png|gif)$/i
      },
      {
        loader: 'url-loader?limit=10240',
        test: webpackIsomorphicToolsPlugin.regular_expression('images')
      }
    ]
  },
  // maybe some kind of a progress bar during compilation
  progress: true,
  resolve: {
    fallback: [
      config.path_base,
      paths.src(),
      // path.resolve(config.path_base, 'node_modules'),
      // path.resolve(config.path_base, 'static')
    ],
    extensions: ['', '.js', '.jsx']
  }
}

// -----------------------------------------------------------------------------
// Entry Points
// -----------------------------------------------------------------------------

if (__DEV__) {
  webpackBaseConfig.entry = [
    `webpack-hot-middleware/client?path=http://${config.server_host}:${config.server_port+1}/__webpack_hmr`,
    'webpack/hot/only-dev-server',
  ].concat(webpackBaseConfig.entry)
}

// -----------------------------------------------------------------------------
// Plugins
// -----------------------------------------------------------------------------
webpackBaseConfig.plugins = [
  new webpack.DefinePlugin(config.globals),
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.NoErrorsPlugin()
];

if (__DEV__) {
  debug('Enable plugins for live development (HMR, NoErrors).')
  webpackBaseConfig.plugins.push(
    // new webpack.IgnorePlugin(/webpack-stats\.json$/),
    new webpack.HotModuleReplacementPlugin(),
    webpackIsomorphicToolsPlugin.development()
  )
} else if (__PROD__) {
  debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).')
  webpackBaseConfig.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        unused: true,
        dead_code: true,
        warnings: false
      }
    }),
    webpackIsomorphicToolsPlugin.development(false)
  )
}
// Don't split bundles during testing, since we only want import one bundle
if (!__TEST__) {
  webpackBaseConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    names: ['vendor']
  }))
}

export default webpackBaseConfig
