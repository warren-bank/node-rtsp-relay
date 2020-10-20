const Rtsp = require('rtsp-server');

const {ProducerServer: ProducerServerClass} = require('./lib/ProducerServer');
const {ConsumerServer: ConsumerServerClass} = require('./lib/ConsumerServer');
const {Mounts:         MountsClass}         = require('./lib/Mounts');

class RtspServer {
  constructor(config){
    this.Mounts = new MountsClass({
      rtpPortStart:  config.rtpPortStart,
      rtpPortCount:  config.rtpPortCount
    });

    this.ProducerServer = new ProducerServerClass(config.producerPort, this.Mounts, config.producerHooks);
    this.ConsumerServer = new ConsumerServerClass(config.consumerPort, this.Mounts, config.consumerHooks);
  }

  start(){
    return Promise.race([
      this.ProducerServer.start(),
      this.ConsumerServer.start()
    ])
  }
}

module.exports = {RtspServer};
