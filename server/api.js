const express = require('express')
const apiRouter = express.Router()
const getStatusFromJenkins = require('./lib/jenkinsStatus')

apiRouter.get('/', async (req, res) => {
  const status = await getStatusFromJenkins()
  res.send(status)
})

module.exports = apiRouter
