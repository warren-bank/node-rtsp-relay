const process_argv = require('@warren-bank/node-process-argv')
const debug        = require('debug')
const path         = require('path')

const argv_flags = {
  "--help":              {bool: true},
  "--version":           {bool: true},

  "--producer-port":     {num:  "int"},
  "--producer-username": {},
  "--producer-password": {},

  "--consumer-port":     {num:  "int"},
  "--consumer-username": {},
  "--consumer-password": {},

  "--rtp-low-port":      {num:  "int"},
  "--rtp-high-port":     {num:  "int"},

  "--log-level":         {num:  "int"}
}

const argv_flag_aliases = {
  "--version":           ["-v"],

  "--producer-port":     ["-pport"],
  "--producer-username": ["-pu"],
  "--producer-password": ["-pp"],

  "--consumer-port":     ["-cport", "--client-port"],
  "--consumer-username": ["-cu",    "--client-username"],
  "--consumer-password": ["-cp",    "--client-password"],

  "--rtp-low-port":      ["-rlp"],
  "--rtp-high-port":     ["-rhp"],

  "--log-level":         ["-L", "--log"]
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  const data = require('../../package.json')
  console.log(data.version)
  process.exit(0)
}

// default: only allow non-negative (>=0) integers
const argv_set_default_integer = (key, val, min=0) => {
  if (
       (typeof argv_vals[key] !== 'number')
    || isNaN(argv_vals[key])
    || (argv_vals[key] < min)
  ) {
    argv_vals[key] = val
  }
}

// alias for default: only allow non-negative (>=0) integers
const argv_set_default_nonnegative_integer = argv_set_default_integer

// override: only allow positive (>=1) integers
const argv_set_default_positive_integer = (key, val) => argv_set_default_integer(key, val, 1)

argv_set_default_positive_integer("--producer-port",  5554)
argv_set_default_positive_integer("--consumer-port",  6554)
argv_set_default_positive_integer("--rtp-low-port",   10000)
argv_set_default_positive_integer("--rtp-high-port", (10000 + argv_vals["--rtp-low-port"]))

argv_set_default_integer("--log-level", 1, -1)

let rtp_port_count = argv_vals["--rtp-high-port"] - argv_vals["--rtp-low-port"]

if ((rtp_port_count % 2) === 1) {
  // odd
  argv_vals["--rtp-high-port"]--
  rtp_port_count--
}

if (rtp_port_count < 2) {
  console.log('ERROR: "--rtp-high-port" must be greater than "--rtp-low-port" by a multiple of 2')
  process.exit(1)
}

argv_vals["--rtp_port_count"] = rtp_port_count

{
  let debug_namespaces

  switch(argv_vals["--log-level"]) {
    case -1:
      debug_namespaces = process.env.DEBUG
      break
    case 0:
      debug_namespaces = null
      break
    case 1:
      debug_namespaces = 'rtsp-relay:1:*'
      break
    case 2:
      debug_namespaces = 'rtsp-relay:*'    //'rtsp-relay:[1-4]:*'
      break
    case 3:
      debug_namespaces = 'rtsp-*'          //'rtsp-relay:[1-4]:*,rtsp-server,rtsp-stream'
      break
    case 4:
    default:
      debug_namespaces = '*'               //'rtsp-relay:[1-4]:*,rtsp-server,rtsp-stream'
      break
  }

  if (debug_namespaces)
    debug.enable(debug_namespaces)
  else
    debug.disable()
}

module.exports = argv_vals
