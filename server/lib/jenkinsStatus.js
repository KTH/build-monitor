const got = require('got')
const bunyan = require('bunyan')
const logLevel = process.env.BUNYAN_LOG_LEVEL || 'info'
const log = bunyan.createLogger({
  name: 'build-monitor',
  level: logLevel
})

async function jenkinsApi (url, username, token) {
  try {
    const { body } = await got({
      url,
      json: true,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(username + ':' + token).toString('base64')
      }
    })
    return body.jobs || []
  } catch (e) {
    log.error(`Something went wrong while getting data from ${url}: `, e)
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
    'lms-export-results-nightly',
    'lms-sync-users',
    'lms-sync-users-nightly',
    'lms-sync-courses',
    'lms-sync-courses-nightly',
    'lms-api',
    'build-monitor',
    'lms-web'
  ]
  const buildKTH = await jenkinsApi(`https://build.sys.kth.se/api/json`, process.env.BUILD_USER, process.env.BUILD_TOKEN)
  const lmsBuilds = buildKTH.filter(j => lmsNames.includes(j.name))

  return [...socialBuilds, ...lmsBuilds]
}

module.exports = getStatusFromJenkins
