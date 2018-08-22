const webpack = require('webpack')
const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  entry: {
    index: [common.entry.index, 'webpack-hot-middleware/client']
  },
  devtool: 'inline-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  resolve: {
    alias: {
      inferno: 'inferno/dist/index.dev.esm.js'
    }
  }
})
