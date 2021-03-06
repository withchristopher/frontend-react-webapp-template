#!/usr/bin/env node

require('./server.babel'); // babel registration (runtime transpilation for node)
const config = require('../../config').default;


// assign the global variables from the config file.
Object.assign(global, config.globals);

if (global.__DEV__) {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json|\.scss$)/i,
  })) {
    return;
  }
}

// https://github.com/halt-hammerzeit/webpack-isomorphic-tools
const WebpackIsomorphicTools = require('webpack-isomorphic-tools');
global.webpackIsomorphicTools = new WebpackIsomorphicTools(require('../../webpack/webpack-isomorphic-tools'))
  .development(config.globals.__DEV__)
  .server(config.pathBase, function() {
    require('./server');
  });
