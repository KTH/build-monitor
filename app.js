'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const express = require('express')
const path = require('path')

const legacyRouter = require('./server/legacy')
const apiRouter = require('./server/api')

const prefix = process.env.PROXY_BASE || '/app/build-monitor'
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000

const bunyan = require('bunyan')
const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})

/* Hot code reloading */
// Important: this should be BEFORE other express.static() calls
if (process.env.NODE_ENV === 'development') {
  const webpack = require('webpack')
  const config = require('./webpack.dev.js')
  const compiler = webpack(config)

  server.use(require('webpack-dev-middleware')(compiler, {
    publicPath: config.output.publicPath
  }))
  server.use(require('webpack-hot-middleware')(compiler))
}

server.use(prefix + '/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')))
server.use(prefix + '/kth-style', express.static(path.join(__dirname, '/node_modules/kth-style/dist')))
server.use(prefix + '/kth-style2', express.static(path.join(__dirname, '/node_modules/kth-style/build')))
server.use(prefix, legacyRouter)
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
