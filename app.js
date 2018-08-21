'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const express = require('express')
const path = require('path')

const legacyRouter = require('./server/legacy')

const prefix = process.env.PROXY_BASE || ''
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
server.use(prefix, legacyRouter)
server.use(prefix, express.static('public'))

server.get(prefix + '/_monitor', (req, res) => res.type('text').status(200).send('APPLICATION_STATUS OK'))

server.get(prefix, (req, res) => {
  res.send('This is the new endpoint!')
})
// server.use(prefix + '/api', apiRouter)
