'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const prefix = '/app/build-monitor'
const express = require('express')
const path = require('path')

///const log = require('./server/log')
const PORT = process.env.PORT || 3000

server.use(prefix + '/kth-style', express.static(path.join(__dirname, '../node_modules/kth-style/dist')))

/* ****************************
 * ******* SERVER START *******
 * ****************************
 */

server.start({
  useSsl: false,
  port: PORT,
  ///logger: log
})

async function getStatusFromJenkins() {
    const data = await jenkinsApi('https://jenkins.sys.kth.se/api/json')
}