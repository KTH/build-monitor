'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const prefix = '/app/build-monitor'
const express = require('express')
const path = require('path')
const rp = require('request-promise')
const bunyan = require('bunyan')

/// const log = require('./server/log')
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
const log = bunyan.createLogger({
  name: 'build-monitor'
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

async function jenkinsApi (url, username, token) {
  try {
    const data = await rp({
      //    host: 'test.example.com',
      // port: 443,
      // path: '/api/service/'+servicename,
      url,
      resolveWithFullResponse: false,
      method: 'GET',
      json: true,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ':' + token).toString('base64')
      }
    })
    return data.jobs
  } catch (e) {
    log.error(`Something went wrong while getting data from ${url.split('@')[1]}: `, e)
    return []
  }
}

async function getStatusFromJenkins (req, res) {
  const socialNames = [
    'social-develop',
    'social-master',
    'social-features'
  ]
  const jenkinsKTH = await jenkinsApi(`https://jenkins.sys.kth.se/api/json`, process.env.JENKINS_USER, process.env.JENKINS_TOKEN)
  const socialBuilds = jenkinsKTH.filter(j => socialNames.includes(j.name))

  const lmsNames = [
    'lms-export-results',
    'lms-sync-users',
    'lms-sync-courses',
    'lms-api'
  ]
  const buildKTH = await jenkinsApi(`https://build.sys.kth.se/api/json`, process.env.BUILD_USER, process.env.BUILD_TOKEN)
  const lmsBuilds = buildKTH.filter(j => lmsNames.includes(j.name))

  const filteredJobs = [...socialBuilds, ...lmsBuilds]

  const statusLib = {
    blue: 'alert-success',
    red: 'alert-danger',
    yellow: 'alert-info',
    blue_anime: 'alert-success progress-bar-striped progress-bar-animated',
    red_anime: 'alert-danger progress-bar-striped progress-bar-animated',
    yellow_anime: 'alert-info progress-bar-striped progress-bar-animated'
  }

  const stringDiv = filteredJobs
    .map(build =>
      `<div
         aria-live="polite"
         role="alert"
         class="alert ${statusLib[build.color]}"
       >
         <p><b>${build.name}</b> <a href="${build.url}">check for more</a></p>
       </div>`)
    .join('')

  return res.send(`
    <html>
      <head>
        <meta charset=utf-8>
        <title>Build status</title>
        <meta http-equiv="refresh" content="10">
        <link rel="stylesheet" href="/app/build-monitor/bootstrap/css/bootstrap.css">
        <link rel="stylesheet" href="/app/build-monitor/kth-style/css/kth-bootstrap.css">
        <h2>Monitor builds for Social and LMS projects</h2>
        ${stringDiv}
  `)
}

server.get(prefix + '/test', getStatusFromJenkins)

server.get(prefix + '/_monitor', (req, res) =>
  res.type('text').status(200).send('APPLICATION_STATUS OK'))
