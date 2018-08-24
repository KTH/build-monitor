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
  try {
    const status = await getStatusFromJenkins()
    res.send(status)
  } catch (e) {
    res.status(500).send({ status: 500 })
  }
})

apiRouter.get('/import-errors', async (req, res) => {
  try {
    const cachedLog = await getLogs()
    const status = await renewLogs(cachedLog)

    res.send({
      lastUpdate: parseInt(cachedLog.timeStamp, 10),
      nextUpdate: parseInt(cachedLog.timeStamp, 10) + parseInt(process.env.LOG_TTL, 10),
      log: logToObject(cachedLog.log),
      status
    })
  } catch (e) {
    res.status(500).send({ status: 500 })
  }
})

module.exports = apiRouter
