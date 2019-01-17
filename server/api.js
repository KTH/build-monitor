const express = require('express')
const apiRouter = express.Router()

const getStatusFromJenkins = require('./lib/jenkinsStatus')

apiRouter.get('/', async (req, res) => {
  try {
    const status = await getStatusFromJenkins()
    res.send(status)
  } catch (e) {
    req.log.error(e)
    res.status(500).send({ status: 500 })
  }
})

apiRouter.get('/import-errors', async (req, res) => {
  res.status(404).send({
    message: 'Sorry, we are disabling temporary this feature until further notice'
  })
})

module.exports = apiRouter
