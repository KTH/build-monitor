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

async function jenkinsApi(url, server) {
    try
    {
        const data = await rp({
            url,
            //auth : {user:'elenara', token:'', bearer:'585b61e664b7111f5365da70aaa80993'},
            resolveWithFullResponse: false,
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            }
        })
        return data.jobs

    } catch (e) {
        
        console.log(`Smth went wrong while getting data from ${url.split('@')[1]}`)
        return []
    }
}

async function getStatusFromJenkins() {

        const allBuilds = await jenkinsApi(`https://${process.env.JENKINS_USER}:${process.env.JENKINS_TOKEN}@jenkins.sys.kth.se/api/json`)
        
        const filteredJobs = allBuilds.filter(j => j.name == 'social-develop' )

        console.log(filteredJobs)

        return filteredJobs

}

async function getStatusFromBuild() {
    const jobs = await jenkinsApi(`https://${process.env.JENKINS_USER}:${process.env.BUILD_TOKEN}@build.sys.kth.se/api/json`)
    console.log("holllllla", data)
    return data
}

getStatusFromJenkins ()
//consolgetStatusFromBuild()