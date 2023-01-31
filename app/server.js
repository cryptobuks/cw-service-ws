/**
 *  @fileOverview Start server app.
 */
const config = require('config')
const cw = require('@cowellness/cw-micro-service')(config)
const wss = require('./websocket')
cw.autoStart()
wss.start()
