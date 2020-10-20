const {RtspServer} = require('./rtsp-streaming-server')

const process_cli = function(argv_vals){
  const config = {
    producerPort:  argv_vals["--producer-port"],
    consumerPort:  argv_vals["--consumer-port"],
    rtpPortStart:  argv_vals["--rtp-low-port"],
    rtpPortCount:  argv_vals["--rtp_port_count"]
  }

  if(argv_vals["--producer-username"] && argv_vals["--producer-password"]){
    config.producerHooks = {
      authentication: async (username, password) => {
        return (
             (username === argv_vals["--producer-username"])
          && (password === argv_vals["--producer-password"])
        )
      }
    }
  }

  if(argv_vals["--consumer-username"] && argv_vals["--consumer-password"]){
    config.consumerHooks = {
      authentication: async (username, password) => {
        return (
             (username === argv_vals["--consumer-username"])
          && (password === argv_vals["--consumer-password"])
        )
      }
    }
  }

  const relay = new RtspServer(config)
  return relay.start() //Promise
}

module.exports = {rtsp_relay: process_cli}
