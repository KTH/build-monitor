require('dotenv').config()
const server = require('kth-node-server')
const express = require('express')
const path = require('path')

const apiRouter = require('./server/api')

const prefix = process.env.PROXY_BASE || ''
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000

const bunyan = require('bunyan')
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: process.env.BUNYAN_LOG_LEVEL || 'info'
})

/* Hot code reloading */
// Important: this should be BEFORE other express.static() calls
if (process.env.NODE_ENV === 'development') {
  const webpack = require('webpack')
  const config = require('./webpack.dev.js')
  const compiler = webpack(config)
  log.warn('************ The app is going to start in DEVELOPMENT mode ******')

  server.use(require('webpack-dev-middleware')(compiler, {
    publicPath: config.output.publicPath,
    logger: log
  }))
  server.use(require('webpack-hot-middleware')(compiler, {
    quiet: true
  }))
}

/* Middlewares */
server.use((req, res, next) => {
  req.log = log.child({
    request_path: req.path
  })
  next()
})

/* Endpoints */
server.use(prefix + '/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')))
server.use(prefix + '/kth-style', express.static(path.join(__dirname, '/node_modules/kth-style/dist')))
server.use(prefix + '/kth-style2', express.static(path.join(__dirname, '/node_modules/kth-style/build')))
server.use(prefix, express.static('public'))
server.use(prefix + '/api', apiRouter)

server.get(prefix + '/_monitor', (req, res) => res.type('text').status(200).send('APPLICATION_STATUS OK'))

/* ****************************
 * ******* SERVER START *******
 * ****************************
 */

server.start({
  useSsl: false,
  port: PORT,
  logger: log
})
