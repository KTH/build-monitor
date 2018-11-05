const sisUtils = require('@kth/sis_import_utils')
const moment = require('moment')
const storage = require('azure-storage')
const blobService = storage.createBlobService(process.env.AZURE_STORAGE_CONNECTION_STRING)
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
const bunyan = require('bunyan')
const defaultLog = bunyan.createLogger({
  name: 'build-monitor',
  level: process.env.BUNYAN_LOG_LEVEL || 'info'
})

async function setBlob (text) {
  return new Promise((resolve, reject) => {
    blobService.createBlockBlobFromText(containerName, blobName, text, err => {
      if (err) {
        defaultLog.error('Error in setBlob', err)
        reject(err)
      } else {
        resolve(blobStatuses.BLOB_CREATED)
      }
    })
  })
}

async function getCanvasLogs (options) {
  const log = options.log || defaultLog

  let cachedLog = JSON.parse(templateFileText)

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

  return cachedLog
}

// "Lock" to avoid renewals when they are already happening
let renewing = false

async function renewCanvasLogs (cachedLog, options) {
  const log = options.log || defaultLog

  const now = moment().format('x')
  const from = moment().subtract(7, 'days').utc().toDate().toISOString()
  if (renewing) {
    log.info('Renewal already started')
    return 'UPDATING_LOGS'
  }

  if ((now - cachedLog.timeStamp) < process.env.LOG_TTL) {
    const nextUpdate = moment(parseInt(cachedLog.timeStamp, 10)).add(process.env.LOG_TTL)
    log.info(`The logs are not expired. It will expire in ${nextUpdate.toNow(true)}`)
    return 'TTL_NOT_EXCEEDED'
  }

  // Call the function WITHOUT "await"
  // so it executes in the background and we can return a "success"
  renewLogsAsync(from, now, { log })
  return 'SUCCESS'
}

async function renewLogsAsync (from, now, options) {
  // Double check "renewing" to avoid race conditions
  if (renewing) return

  renewing = true
  const log = options.log || defaultLog
  try {
    const latestErrors = await sisUtils.getFilteredErrors(
      process.env.CANVAS_API_BASE_URL,
      process.env.CANVAS_ACCESS_TOKEN,
      from,
      process.env.UG_URL,
      process.env.UG_USERNAME,
      process.env.UG_PWD
    )
    await setBlob(JSON.stringify({timeStamp: now, log: latestErrors}))
    log.info('Renewed logs in the blob.')
    renewing = false
  } catch (e) {
    renewing = false
    log.error(`Failed to renew logs: ${e}`)
  }
}

module.exports = {
  getCanvasLogs,
  renewCanvasLogs
}
