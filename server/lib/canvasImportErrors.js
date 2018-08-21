const sisUtils = require('@kth/collect_sis_imports_errors/sis_utils')
const moment = require('moment')
const storage = require('azure-storage')
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
const bunyan = require('bunyan')
const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})

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

async function getLogs () {
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

async function renewLogs (cachedLog) {
  const now = moment().format('x')
  if ((now - cachedLog.timeStamp) > process.env.LOG_TTL) {
    const from = moment().subtract(7, 'days').utc().toDate().toISOString()
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
    } catch (e) {
      log.error(`Failed to renew logs: ${e}`)
    }
  }
}

module.exports = {
  getLogs,
  renewLogs
}
