const express = require('express')
const papaparse = require('papaparse')
const apiRouter = express.Router()

const getStatusFromJenkins = require('./lib/jenkinsStatus')
const { getLogs, renewLogs } = require('./lib/canvasImportErrors')

const logToObject = (log) => {
  const lines = log.split('\n').slice(1).join('\n')
  return papaparse.parse(lines, {
    header: true
  }).data
}

apiRouter.get('/', async (req, res) => {
  const status = await getStatusFromJenkins()
  res.send(status)
})

apiRouter.get('/import-errors', async (req, res) => {
  const cachedLog = await getLogs()
  renewLogs(cachedLog)

  res.send(logToObject(cachedLog.log))
})

module.exports = apiRouter
