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
    return rp({
        url,
        //auth : {user:'elenara', token:'', bearer:'585b61e664b7111f5365da70aaa80993'},
        resolveWithFullResponse: true,
        method: 'GET',
        headers: {
            'content-type': 'application/json'
        }
    })
}

async function getStatusFromJenkins() {
    const data = await jenkinsApi(`https://${process.env.JENKINS_USER}:${process.env.JENKINS_TOKEN}@jenkins.sys.kth.se/api/json`)
    console.log(data)
    return data
}

getStatusFromJenkins ()