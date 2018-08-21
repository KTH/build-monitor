'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const express = require('express')
const path = require('path')

const getStatusFromJenkins = require('./server/jenkinsStatus')
const getCanvasImportErrors = require('./server/canvasImportErrors')

const prefix = process.env.PROXY_PREFIX || ''
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000

const bunyan = require('bunyan')
const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})

/* ****************************
 * ******* SERVER START *******
 * ****************************
 */

server.start({
  useSsl: false,
  port: PORT,
  logger: log
})
server.use(prefix + '/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')))
server.use(prefix + '/kth-style', express.static(path.join(__dirname, '/node_modules/kth-style/dist')))

server.get(prefix + '/test', getStatusFromJenkins)
server.get(prefix + '/_monitor', (req, res) => res.type('text').status(200).send('APPLICATION_STATUS OK'))
server.get(prefix + '/builds', getStatusFromJenkins)
server.get(prefix + '/canvas_import_errors', getCanvasImportErrors)
