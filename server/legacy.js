const getStatusFromJenkins = require('./lib/jenkinsStatus')
const canvasImportErrors = require('./lib/canvasImportErrors')

const bunyan = require('bunyan')
const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})

async function testEndpoint (req, res) {
  try {
    const statusLib = {
      blue: 'alert-success',
      red: 'alert-danger',
      yellow: 'alert-info',
      blue_anime: 'alert-success progress-bar-striped progress-bar-animated',
      red_anime: 'alert-danger progress-bar-striped progress-bar-animated',
      yellow_anime: 'alert-info progress-bar-striped progress-bar-animated'
    }

    const filteredJobs = await getStatusFromJenkins()
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

async function canvasImportErrorsEndpoint (req, res) {
  try {
    const cachedLog = canvasImportErrors.getLogs()
  } catch (e) {
    log.error('Something went horribly wrong when trying to fetch the blob.')
    log.error(e)
    res.send(e)
  }

  canvasImportErrors.renewLogs(cachedLog)

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
}

module.exports = {
  testEndpoint,
  canvasImportErrorsEndpoint
}
