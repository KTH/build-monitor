const path = require('path')

module.exports = {
  entry: {
    index: './client/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].bundle.js',
    publicPath: process.env.PROXY_BASE || ''
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
            ],
            plugins: [
              ['babel-plugin-inferno', {imports: true}]
            ]
          }
        }
      }
    ]
  }
}
