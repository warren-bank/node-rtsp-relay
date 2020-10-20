#! /usr/bin/env node

const argv_vals    = require('./rtsp-relay/process_argv')
const {rtsp_relay} = require('../lib/process_cli')

rtsp_relay(argv_vals)
.then(() => {
  process.exit(0)
})
.catch((e) => {
  console.log(e.message)
  process.exit(1)
})
