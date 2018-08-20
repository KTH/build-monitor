'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const express = require('express')
const path = require('path')
const rp = require('request-promise')
const sisUtils = require('@kth/collect_sis_imports_errors/sis_utils')
const moment = require('moment')
const storage = require('azure-storage')
const bunyan = require('bunyan')

const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})
const prefix = '/app/build-monitor'
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000
const blobService = storage.createBlobService()
const containerName = 'elearningbmcontainer'
const templateFileText = JSON.stringify({timeStamp: 0, log: 'no logs have yet been fetched'})
const blobName = 'bmblob'
const blobStatuses = Object.freeze({
  BLOB_MISSING: Symbol('blob_missing'),
  BLOB_CONTAINER_MISSING: Symbol('blob_container_missing'),
  BLOB_DOWNLOADED: Symbol('blob_downloaded'),
  BLOB_CONTAINER_CREATED: Symbol('blob_container_created'),
  BLOB_CREATED: Symbol('blob_created')
})
const newlineRegExp = /\n/g

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

async function setBlob (text) {
  return new Promise((resolve, reject) => {
    blobService.createBlockBlobFromText(containerName, blobName, text, err => {
      if (err) {
        reject(err)
      } else {
        resolve(blobStatuses.BLOB_CREATED)
      }
    })
  })
}

async function jenkinsApi (url, username, token) {
  try {
    const data = await rp({
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
  try {
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
  } catch (e) {
    log.error('Error in build-monitor', e)
    return res.send(`
      <html>
      <head>
      <meta charset=utf-8>
      <title>Build status failing</title>
      <meta http-equiv="refresh" content="10">
      <div>Build status failing. Refreshing in 10 seconds. Check the logs...</div>
    `)
  }
}

async function getCanvasImportErrors (req, res) {
  let cachedLog = JSON.parse(templateFileText)
  try {
    let result = await new Promise((resolve, reject) => {
      blobService.getBlobToText(containerName, blobName, (err, text) => {
        if (err) {
          if (err.name === 'StorageError' && err.code === 'ContainerNotFound') {
            resolve(blobStatuses.BLOB_CONTAINER_MISSING)
          } else if (err.name === 'StorageError' && err.code === 'BlobNotFound') {
            resolve(blobStatuses.BLOB_MISSING)
          } else {
            reject(err)
          }
        } else {
          cachedLog = JSON.parse(text)
          resolve(blobStatuses.BLOB_DOWNLOADED)
        }
      })
    })
    if (result === blobStatuses.BLOB_CONTAINER_MISSING) {
      result = await new Promise((resolve, reject) => {
        blobService.createContainer(containerName, {publicAccessLevel: 'blob'}, err => {
          if (err) {
            reject(err)
          } else {
            resolve(blobStatuses.BLOB_CONTAINER_CREATED)
          }
        })
      })
    }
    if (result === blobStatuses.BLOB_CONTAINER_CREATED ||
      result === blobStatuses.BLOB_MISSING) {
      result = await setBlob(templateFileText)
      if (result === blobStatuses.BLOB_CREATED) {
        log.info('A new blob was created.')
      }
    }
  } catch (e) {
    log.error('Something went horribly wrong when trying to fetch the blob.')
    log.error(e)
    return res.send(e)
  }

  res.send(`
    <html>
      <head>
        <meta charset=utf-8>
        <title>SIS IMPORT ERRORS</title>
        <meta http-equiv="refresh" content="10">
        <link rel="stylesheet" href="/app/build-monitor/bootstrap/css/bootstrap.css">
        <link rel="stylesheet" href="/app/build-monitor/kth-style/css/kth-bootstrap.css">
        <h1>Error logs found</h1>
        <p>${cachedLog.log.replace(newlineRegExp, '<br>')}</p>
  `)

  const now = moment().format('x')
  if ((now - cachedLog.timeStamp) > process.env.LOG_TTL) {
    const from = moment().subtract(7, 'days').utc().toDate().toISOString()
    try {
      const latestErrors = await sisUtils.getFilteredErrors(process.env.CANVAS_API_BASE_URL,
        process.env.CANVAS_ACCESS_TOKEN,
        from,
        process.env.UG_URL,
        process.env.UG_USERNAME,
        process.env.UG_PWD)
      await setBlob(JSON.stringify({timeStamp: now, log: latestErrors}))
      log.info('Renewed logs in the blob.')
    } catch (e) {
      log.error(`Failed to renew logs: ${e}`)
    }
  }
}

server.get(prefix + '/test', getStatusFromJenkins)

server.get(prefix + '/_monitor', (req, res) =>
  res.type('text').status(200).send('APPLICATION_STATUS OK'))

server.get(prefix + '/canvas_import_errors', getCanvasImportErrors)
