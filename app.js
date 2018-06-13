'use strict'
require('dotenv').config()
const server = require('kth-node-server')
const prefix = '/app/build-monitor'
const express = require('express')
const path = require('path')
const rp = require('request-promise')


///const log = require('./server/log')
const PORT = process.env.PORT || 3000

server.use(prefix + '/kth-style', express.static(path.join(__dirname, '../node_modules/kth-style/dist')))

/* ****************************
 * ******* SERVER START *******
 * ****************************
 */

server.start({
  useSsl: false,
  port: PORT,
  ///logger: log
})

async function jenkinsApi(url) {
    try
    {
        const data = await rp({
            url,
            resolveWithFullResponse: false,
            method: 'GET',
            json: true,
        })
        return data.jobs

    } catch (e) {
        
        console.log(`Smth went wrong while getting data from ${url.split('@')[1]}: `, e)
        return []
    }
}

async function getStatusFromJenkins() {

        const jenkinsKTH = await jenkinsApi(`https://${process.env.JENKINS_USER}:${process.env.JENKINS_TOKEN}@jenkins.sys.kth.se/api/json`)
        
        const socialBuilds = jenkinsKTH.filter(j => j.name == 'social-develop' || j.name == 'social-master'|| j.name == 'social-features' )

        const buildKTH = await jenkinsApi(`https://${process.env.JENKINS_USER}:${process.env.BUILD_TOKEN}@build.sys.kth.se/api/json`)

        const lmsBuilds = buildKTH.filter(j => j.name == 'lms-export-results' ||  j.name =='lms-sync-users'  || j.name == 'lms-sync-courses' || j.name == 'lms-api')

        const filteredJobs = [...socialBuilds, ...lmsBuilds]

        console.log(filteredJobs)

        return filteredJobs

}



getStatusFromJenkins ()
