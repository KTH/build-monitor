const rp = require('request-promise')
const bunyan = require('bunyan')
const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})

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

async function getStatusFromJenkins () {
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

  return [...socialBuilds, ...lmsBuilds]
}

module.exports = async function (req, res) {
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
